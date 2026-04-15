/**
 * NeuralHub · Usage Budget Cache Refresh
 * 
 * Run this as a cron job every hour (or via pg_cron / Inngest / Vercel Cron).
 * It refreshes the Redis budget cache so `assertBudget()` stays accurate
 * without a DB hit on every request.
 *
 * Vercel Cron: add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/refresh-budgets", "schedule": "0 * * * *" }]
 * }
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { redis } from "@/lib/cache/redis";

export async function GET(req: NextRequest) {
  // Protect with a shared secret
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  // Fetch all users' MTD usage in a single query
  const usageRows = await prisma.usageMonthly.findMany({
    where:  { year, month, provider: null },
    select: { userId: true, totalCost: true, totalTokens: true },
  });

  const pipeline = redis.pipeline();

  for (const row of usageRows) {
    const cacheKey = `budget:${row.userId}:${now.getMonth()}`;
    pipeline.hset(cacheKey, {
      cost:   row.totalCost.toFixed(6),
      tokens: row.totalTokens.toString(),
    });
    pipeline.expire(cacheKey, 7200); // 2 hour TTL
  }

  await pipeline.exec();

  console.log(`[cron] Refreshed budgets for ${usageRows.length} users`);
  return Response.json({ refreshed: usageRows.length, at: now.toISOString() });
}
