/**
 * POST /api/billing/checkout — create Stripe checkout session
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { Plan } from "@prisma/client";
import { createCheckoutSession } from "@/lib/billing/stripe";
import { authenticateRequest } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { plan } = z.object({ plan: z.nativeEnum(Plan) }).parse(await req.json());
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing`;

  const url = await createCheckoutSession(auth.userId, plan, returnUrl);
  return Response.json({ url });
}
