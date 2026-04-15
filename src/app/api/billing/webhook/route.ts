/**
 * POST /api/billing/webhook — Stripe webhook handler
 * This route must receive raw body — Stripe needs it for signature verification.
 */

import { NextRequest } from "next/server";
import { handleStripeWebhook } from "@/lib/billing/stripe";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return Response.json({ error: "No stripe-signature header" }, { status: 400 });

  const payload = await req.arrayBuffer();

  try {
    await handleStripeWebhook(Buffer.from(payload), sig);
    return Response.json({ received: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    console.error("[Stripe webhook]", msg);
    return Response.json({ error: msg }, { status: 400 });
  }
}
