/**
 * GET /api/usage
 * 
 * Returns pre-aggregated usage data for the authenticated user.
 * Results are cached in Redis for 5 minutes.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { AIProvider } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { authenticateRequest } from "@/lib/auth/middleware";

const QuerySchema = z.object({
  period:   z.enum(["7d", "30d", "90d", "12m"]).default("12m"),
  provider: z.nativeEnum(AIProvider).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const params  = QuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const cacheKey = `usage:${auth.userId}:${params.period}:${params.provider ?? "all"}`;

  // Try cache first
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) return Response.json(cached);

  const now   = new Date();
  let fromDate: Date;

  if (params.period === "12m") {
    fromDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  } else {
    const days = parseInt(params.period);
    fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // Daily breakdown
  const daily = await prisma.usageDaily.findMany({
    where: {
      userId:   auth.userId,
      date:     { gte: fromDate },
      provider: params.provider ?? null,
    },
    orderBy: { date: "asc" },
  });

  // Monthly breakdown
  const monthly = await prisma.usageMonthly.findMany({
    where: {
      userId:   auth.userId,
      provider: params.provider ?? null,
      OR: [
        { year: { gt: fromDate.getFullYear() } },
        { year: fromDate.getFullYear(), month: { gte: fromDate.getMonth() + 1 } },
      ],
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  // Provider breakdown (current month)
  const providerBreakdown = await prisma.usageMonthly.findMany({
    where: {
      userId:   auth.userId,
      year:     now.getFullYear(),
      month:    now.getMonth() + 1,
      provider: { not: null },
    },
  });

  // Totals (all time)
  const totals = await prisma.usageMonthly.aggregate({
    where:  { userId: auth.userId, provider: null },
    _sum:   { requests: true, totalTokens: true, totalCost: true, errorCount: true },
  });

  // Current month totals
  const mtd = await prisma.usageMonthly.findFirst({
    where: { userId: auth.userId, year: now.getFullYear(), month: now.getMonth() + 1, provider: null },
  });

  const response = {
    daily: daily.map((d) => ({
      date:         d.date.toISOString().split("T")[0],
      requests:     d.requests,
      inputTokens:  Number(d.inputTokens),
      outputTokens: Number(d.outputTokens),
      totalTokens:  Number(d.totalTokens),
      totalCost:    d.totalCost,
      errorCount:   d.errorCount,
    })),
    monthly: monthly.map((m) => ({
      year:         m.year,
      month:        m.month,
      label:        new Date(m.year, m.month - 1, 1).toLocaleString("en", { month: "short" }),
      requests:     m.requests,
      inputTokens:  Number(m.inputTokens),
      outputTokens: Number(m.outputTokens),
      totalTokens:  Number(m.totalTokens),
      totalCost:    m.totalCost,
      errorCount:   m.errorCount,
    })),
    providerBreakdown: providerBreakdown.map((p) => ({
      provider:    p.provider,
      requests:    p.requests,
      totalTokens: Number(p.totalTokens),
      totalCost:   p.totalCost,
    })),
    totals: {
      requests:    totals._sum.requests    ?? 0,
      totalTokens: Number(totals._sum.totalTokens ?? 0),
      totalCost:   totals._sum.totalCost   ?? 0,
      errorCount:  totals._sum.errorCount  ?? 0,
    },
    mtd: mtd ? {
      requests:    mtd.requests,
      totalTokens: Number(mtd.totalTokens),
      totalCost:   mtd.totalCost,
      errorCount:  mtd.errorCount,
    } : null,
    generatedAt: now.toISOString(),
  };

  await cacheSet(cacheKey, response, 300); // 5 min cache
  return Response.json(response);
}
