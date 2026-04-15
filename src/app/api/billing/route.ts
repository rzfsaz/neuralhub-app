/**
 * GET /api/billing — get current user billing info
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateRequest } from "@/lib/auth/middleware";
import { PLANS } from "@/lib/billing/stripe";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: auth.userId },
    select: {
      plan: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      currentPeriodEnd: true,
      monthlyTokenBudget: true,
      monthlyCostBudget: true,
    },
  });

  const planConfig = PLANS[user.plan];

  return Response.json({
    plan:                 user.plan,
    label:                planConfig.label,
    features:             planConfig.features,
    monthlyTokenBudget:   Number(user.monthlyTokenBudget),
    monthlyCostBudget:    user.monthlyCostBudget,
    hasSubscription:      !!user.stripeSubscriptionId,
    currentPeriodEnd:     user.currentPeriodEnd?.toISOString() ?? null,
  });
}
