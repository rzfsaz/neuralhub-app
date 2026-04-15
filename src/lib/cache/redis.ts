/**
 * NeuralHub · Redis Client + Rate Limiter
 *
 * Uses ioredis. The client is a module-level singleton so it's
 * reused across Next.js hot reloads in development.
 */

import Redis from "ioredis";

declare global {
  // Preserve singleton across hot reloads in dev
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function createRedisClient(): Redis {
  const client = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    enableReadyCheck:     true,
    lazyConnect:          true,
  });

  client.on("error", (err) => console.error("[Redis]", err));
  return client;
}

export const redis: Redis =
  global.__redis ?? (global.__redis = createRedisClient());

// ─────────────────────────────────────────────────────────────────────────────
// Sliding-window rate limiter (Lua script for atomicity)
// ─────────────────────────────────────────────────────────────────────────────

const RATE_LIMIT_LUA = `
local key     = KEYS[1]
local limit   = tonumber(ARGV[1])
local window  = tonumber(ARGV[2])
local now     = tonumber(ARGV[3])
local cutoff  = now - (window * 1000)

redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)
local count = redis.call('ZCARD', key)

if count < limit then
  redis.call('ZADD', key, now, now)
  redis.call('PEXPIRE', key, window * 1000)
  return {1, limit - count - 1}
else
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retry  = math.ceil((tonumber(oldest[2]) + window * 1000 - now) / 1000)
  return {0, retry}
end
`;

export interface RateLimitResult {
  ok:           boolean;
  remaining?:   number;
  retryAfter?:  number;  // seconds
}

/**
 * Sliding-window rate limit.
 * @param key    Unique key (e.g. "rl:prompts:user_123")
 * @param limit  Max requests allowed
 * @param window Window size in seconds
 */
export async function rateLimit(
  key:    string,
  limit:  number,
  window: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const result = await (redis as Redis & { rateLimit?: unknown })
    .eval(RATE_LIMIT_LUA, 1, key, limit, window, now) as [number, number];

  const [allowed, value] = result;
  if (allowed) {
    return { ok: true, remaining: value };
  }
  return { ok: false, retryAfter: value };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  if (!val) return null;
  try { return JSON.parse(val) as T; } catch { return null; }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDelete(key: string): Promise<void> {
  await redis.del(key);
}

export async function cacheMGet<T>(keys: string[]): Promise<(T | null)[]> {
  if (!keys.length) return [];
  const vals = await redis.mget(...keys);
  return vals.map((v) => {
    if (!v) return null;
    try { return JSON.parse(v) as T; } catch { return null; }
  });
}
