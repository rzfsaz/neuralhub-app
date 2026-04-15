/**
 * POST   /api/providers         → save/update a provider API key
 * GET    /api/providers         → list connected providers (no plaintext keys)
 * DELETE /api/providers/[id]    → remove a provider key
 * POST   /api/providers/test    → validate a provider key
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { AIProvider } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { encryptKey, rotateKey } from "@/lib/crypto/aes";
import { createProvider } from "@/lib/ai/providers";
import { authenticateRequest } from "@/lib/auth/middleware";
import { cacheDelete } from "@/lib/cache/redis";

// ─────────────────────────────────────────────────────────────────────────────
// GET — list connected providers (status only, no plaintext keys)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const keys = await prisma.providerKey.findMany({
    where:  { userId: auth.userId },
    select: {
      id:          true,
      provider:    true,
      isActive:    true,
      lastTestedAt:true,
      createdAt:   true,
      updatedAt:   true,
      // Expose only the last 4 chars of the IV as a fingerprint — never the key
      keyIv:       true,
    },
  });

  // Attach available models per connected provider
  const result = keys.map((k) => ({
    ...k,
    keyFingerprint: `****${k.keyIv.slice(-4)}`,
    keyIv: undefined,
  }));

  return Response.json({ providers: result });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — save or update a provider API key
// ─────────────────────────────────────────────────────────────────────────────

const SaveSchema = z.object({
  provider: z.nativeEnum(AIProvider),
  apiKey:   z.string().min(1),
});

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const body = SaveSchema.parse(await req.json());

  // 1. Validate the key actually works before saving
  const client  = createProvider(body.provider, body.apiKey);
  const isValid = await client.validateKey();
  if (!isValid) {
    return Response.json({ error: "API key validation failed — check the key and try again." }, { status: 422 });
  }

  // 2. Encrypt
  const encrypted = encryptKey(body.apiKey);

  // 3. Upsert
  const record = await prisma.providerKey.upsert({
    where:  { userId_provider: { userId: auth.userId, provider: body.provider } },
    create: {
      userId:       auth.userId,
      provider:     body.provider,
      encryptedKey: encrypted.encryptedKey,
      keyIv:        encrypted.iv,
      keyTag:       encrypted.tag,
      lastTestedAt: new Date(),
      isActive:     true,
    },
    update: {
      encryptedKey: encrypted.encryptedKey,
      keyIv:        encrypted.iv,
      keyTag:       encrypted.tag,
      lastTestedAt: new Date(),
      isActive:     true,
    },
  });

  // 4. Bust cache
  await cacheDelete(`pkey:${auth.userId}:${body.provider}`);

  return Response.json({ id: record.id, provider: record.provider, status: "connected" });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — rotate a key (re-encrypt with fresh IV)
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { provider } = z.object({ provider: z.nativeEnum(AIProvider) }).parse(await req.json());

  const existing = await prisma.providerKey.findUniqueOrThrow({
    where: { userId_provider: { userId: auth.userId, provider } },
  });

  const rotated = rotateKey({
    encryptedKey: existing.encryptedKey,
    iv:           existing.keyIv,
    tag:          existing.keyTag,
  });

  await prisma.providerKey.update({
    where: { id: existing.id },
    data:  { encryptedKey: rotated.encryptedKey, keyIv: rotated.iv, keyTag: rotated.tag },
  });

  await cacheDelete(`pkey:${auth.userId}:${provider}`);
  return Response.json({ status: "rotated" });
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — disconnect a provider
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const { provider } = z.object({ provider: z.nativeEnum(AIProvider) }).parse(await req.json());

  await prisma.providerKey.updateMany({
    where: { userId: auth.userId, provider },
    data:  { isActive: false },
  });

  await cacheDelete(`pkey:${auth.userId}:${provider}`);
  return Response.json({ status: "disconnected" });
}
