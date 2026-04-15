/**
 * POST /api/auth/signup — Register a new user
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

const SignupSchema = z.object({
  name:     z.string().min(1).max(80),
  email:    z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof SignupSchema>;
  try {
    body = SignupSchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });

  if (existing) {
    return Response.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  const user = await prisma.user.create({
    data: {
      email:        body.email.toLowerCase(),
      name:         body.name,
      passwordHash,
      plan:         "FREE",
      monthlyTokenBudget: BigInt(1_000_000),
      monthlyCostBudget:  5,
    },
  });

  return Response.json({ id: user.id, email: user.email }, { status: 201 });
}
