/**
 * NeuralHub · Stripe Billing Integration
 *
 * Covers:
 *   - Checkout session creation (new subscriptions)
 *   - Customer portal (manage / cancel)
 *   - Webhook handler (subscription lifecycle events)
 *   - Plan → feature limit mapping
 */

import Stripe from "stripe";
import { Plan } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Plan Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const PLANS: Record<Plan, {
  label:              string;
  priceId:            string | null;
  monthlyTokenBudget: bigint;
  monthlyCostBudget:  number;
  maxProjects:        number | null;  // null = unlimited
  maxApiKeys:         number;
  features:           string[];
}> = {
  FREE: {
    label:              "Starter",
    priceId:            null,
    monthlyTokenBudget: BigInt(1_000_000),
    monthlyCostBudget:  5,
    maxProjects:        5,
    maxApiKeys:         2,
    features:           ["1M tokens/month", "2 AI providers", "5 projects", "Community support"],
  },
  PRO: {
    label:              "Pro",
    priceId:            process.env.STRIPE_PRO_PRICE_ID!,
    monthlyTokenBudget: BigInt(20_000_000),
    monthlyCostBudget:  200,
    maxProjects:        null,
    maxApiKeys:         10,
    features:           ["20M tokens/month", "All AI providers", "Unlimited projects", "Priority support"],
  },
  TEAM: {
    label:              "Team",
    priceId:            process.env.STRIPE_TEAM_PRICE_ID!,
    monthlyTokenBudget: BigInt(100_000_000),
    monthlyCostBudget:  1000,
    maxProjects:        null,
    maxApiKeys:         50,
    features:           ["100M tokens/month", "All providers", "Unlimited everything", "SLA + SSO"],
  },
  ENTERPRISE: {
    label:              "Enterprise",
    priceId:            null,  // contact sales
    monthlyTokenBudget: BigInt(9_999_999_999),
    monthlyCostBudget:  9999,
    maxProjects:        null,
    maxApiKeys:         999,
    features:           ["Custom limits", "Dedicated support", "Custom contract"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Create / retrieve a Stripe customer for a user
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrCreateCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email:    user.email,
    name:     user.name ?? undefined,
    metadata: { userId },
  });

  await prisma.user.update({
    where:  { id: userId },
    data:   { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkout session (upgrade flow)
// ─────────────────────────────────────────────────────────────────────────────

export async function createCheckoutSession(
  userId:      string,
  targetPlan:  Plan,
  returnUrl:   string
): Promise<string> {
  const config = PLANS[targetPlan];
  if (!config.priceId) throw new Error(`Plan ${targetPlan} has no Stripe price.`);

  const customerId = await getOrCreateCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer:             customerId,
    mode:                 "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: config.priceId, quantity: 1 }],
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&plan=${targetPlan}`,
    cancel_url:  `${returnUrl}?cancelled=true`,
    subscription_data: {
      metadata: { userId, plan: targetPlan },
    },
    allow_promotion_codes: true,
  });

  return session.url!;
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer Portal (manage / cancel subscription)
// ─────────────────────────────────────────────────────────────────────────────

export async function createPortalSession(userId: string, returnUrl: string): Promise<string> {
  const customerId = await getOrCreateCustomer(userId);

  const session = await stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url: returnUrl,
  });

  return session.url;
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply plan limits to the user record
// ─────────────────────────────────────────────────────────────────────────────

async function applyPlanToUser(userId: string, plan: Plan, subscription: Stripe.Subscription) {
  const config = PLANS[plan];
  await prisma.user.update({
    where: { id: userId },
    data:  {
      plan,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd:     new Date(subscription.current_period_end * 1000),
      monthlyTokenBudget:   config.monthlyTokenBudget,
      monthlyCostBudget:    config.monthlyCostBudget,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function handleStripeWebhook(
  payload: string | Buffer,
  sig:     string
): Promise<void> {
  const event = stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session  = event.data.object as Stripe.Checkout.Session;
      const userId   = session.metadata?.userId;
      const plan     = session.metadata?.plan as Plan | undefined;
      if (!userId || !plan) break;

      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      await applyPlanToUser(userId, plan, sub);
      break;
    }

    case "customer.subscription.updated": {
      const sub    = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.userId;
      if (!userId) break;

      // Determine plan from price ID
      const priceId = sub.items.data[0]?.price.id;
      const plan    = (Object.entries(PLANS).find(([, v]) => v.priceId === priceId)?.[0] as Plan) ?? "FREE";
      await applyPlanToUser(userId, plan, sub);
      break;
    }

    case "customer.subscription.deleted": {
      const sub    = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.userId;
      if (!userId) break;

      const freePlan = PLANS.FREE;
      await prisma.user.update({
        where: { id: userId },
        data:  {
          plan:                 "FREE",
          stripeSubscriptionId: null,
          currentPeriodEnd:     null,
          monthlyTokenBudget:   freePlan.monthlyTokenBudget,
          monthlyCostBudget:    freePlan.monthlyCostBudget,
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      // Optionally: send dunning email, restrict access, etc.
      console.warn("Invoice payment failed:", event.data.object);
      break;
    }

    default:
      // Unhandled event type — safe to ignore
      break;
  }
}
