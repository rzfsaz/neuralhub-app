/**
 * NeuralHub · Auth Middleware
 *
 * Supports two auth methods:
 *   1. Bearer token  — platform API key (nhub_sk_live_... / nhub_sk_test_...)
 *   2. Session cookie — NextAuth/iron-session for UI requests
 */

import { NextRequest } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export type AuthResult =
  | { ok: true;  userId: string; apiKeyId?: string }
  | { ok: false; error: string };

const KEY_PREFIX_LIVE = "nhub_sk_live_";
const KEY_PREFIX_TEST = "nhub_sk_test_";

export async function authenticateRequest(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");

  // ── Bearer token path ──────────────────────────────────────────────────────
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();

    if (!token.startsWith(KEY_PREFIX_LIVE) && !token.startsWith(KEY_PREFIX_TEST)) {
      return { ok: false, error: "Invalid API key format" };
    }

    // Fast path: SHA-256 prefix lookup (avoids full bcrypt on every hot request)
    const prefix = token.slice(0, 16);
    const cacheKey = `apikey:${prefix}`;

    const cached = await cacheGet<{ userId: string; keyId: string; keyHash: string }>(cacheKey);

    if (cached) {
      // Still verify full hash (bcrypt) — but only once per TTL window
      const valid = await bcrypt.compare(token, cached.keyHash);
      if (!valid) return { ok: false, error: "Invalid API key" };

      // Update last-used timestamp (fire-and-forget)
      prisma.userApiKey.update({
        where: { id: cached.keyId },
        data:  { lastUsedAt: new Date() },
      }).catch(() => {});

      return { ok: true, userId: cached.userId, apiKeyId: cached.keyId };
    }

    // Cache miss — look up by prefix
    const keyRecord = await prisma.userApiKey.findFirst({
      where:   { keyPrefix: prefix, isActive: true },
      include: { user: { select: { id: true } } },
    });

    if (!keyRecord) return { ok: false, error: "API key not found" };

    // Check expiry
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return { ok: false, error: "API key has expired" };
    }

    const valid = await bcrypt.compare(token, keyRecord.keyHash);
    if (!valid) return { ok: false, error: "Invalid API key" };

    // Cache for 10 minutes
    await cacheSet(cacheKey, { userId: keyRecord.userId, keyId: keyRecord.id, keyHash: keyRecord.keyHash }, 600);

    prisma.userApiKey.update({
      where: { id: keyRecord.id },
      data:  { lastUsedAt: new Date() },
    }).catch(() => {});

    return { ok: true, userId: keyRecord.userId, apiKeyId: keyRecord.id };
  }

  // ── Session cookie path ────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return { ok: true, userId: session.user.id };
  }

  return { ok: false, error: "Unauthorized" };
}

// ─────────────────────────────────────────────────────────────────────────────
// API key generation helper
// ─────────────────────────────────────────────────────────────────────────────

import { randomBytes } from "crypto";

export interface GeneratedKey {
  plaintext: string;   // shown to user once
  prefix:    string;   // stored in DB for display
  hash:      string;   // bcrypt hash stored in DB
}

export async function generateApiKey(type: "live" | "test" = "live"): Promise<GeneratedKey> {
  const suffix    = randomBytes(24).toString("base64url");
  const prefix_   = type === "live" ? KEY_PREFIX_LIVE : KEY_PREFIX_TEST;
  const plaintext = `${prefix_}${suffix}`;
  const prefix    = plaintext.slice(0, 16);
  const hash      = await bcrypt.hash(plaintext, 10);
  return { plaintext, prefix, hash };
}
