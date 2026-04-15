/**
 * GET    /api/apikeys       → list user's API keys (no plaintext)
 * POST   /api/apikeys       → generate a new key (plaintext returned ONCE)
 * DELETE /api/apikeys/[id]  → revoke a key
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { authenticateRequest, generateApiKey } from "@/lib/auth/middleware";
import { PLANS } from "@/lib/billing/stripe";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const keys = await prisma.userApiKey.findMany({
    where:   { userId: auth.userId, isActive: true },
    orderBy: { createdAt: "desc" },
    select:  {
      id: true, name: true, keyPrefix: true,
      isActive: true, lastUsedAt: true,
      expiresAt: true, createdAt: true,
    },
  });

  return Response.json({ keys });
}

const CreateSchema = z.object({
  name:      z.string().min(1).max(60),
  type:      z.enum(["live", "test"]).default("live"),
  expiresIn: z.number().int().min(1).max(365).optional(), // days
});

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  // Enforce key limit
  const user   = await prisma.user.findUniqueOrThrow({ where: { id: auth.userId } });
  const plan   = PLANS[user.plan];
  const count  = await prisma.userApiKey.count({ where: { userId: auth.userId, isActive: true } });
  if (count >= plan.maxApiKeys) {
    return Response.json(
      { error: `Your plan supports up to ${plan.maxApiKeys} active API keys.` },
      { status: 403 }
    );
  }

  const body = CreateSchema.parse(await req.json());
  const gen  = await generateApiKey(body.type);

  const expiresAt = body.expiresIn
    ? new Date(Date.now() + body.expiresIn * 24 * 60 * 60 * 1000)
    : undefined;

  await prisma.userApiKey.create({
    data: {
      userId:    auth.userId,
      name:      body.name,
      keyHash:   gen.hash,
      keyPrefix: gen.prefix,
      expiresAt,
    },
  });

  // Return plaintext ONCE — we never store it
  return Response.json({ key: gen.plaintext, prefix: gen.prefix }, { status: 201 });
}

const DeleteSchema = z.object({ id: z.string() });

export async function DELETE(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { id } = DeleteSchema.parse(await req.json());

  await prisma.userApiKey.updateMany({
    where: { id, userId: auth.userId },
    data:  { isActive: false },
  });

  return Response.json({ status: "revoked" });
}
