/**
 * POST /api/billing/portal — create Stripe customer portal session
 */

import { NextRequest } from "next/server";
import { createPortalSession } from "@/lib/billing/stripe";
import { authenticateRequest } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing`;
  const url = await createPortalSession(auth.userId, returnUrl);
  return Response.json({ url });
}
