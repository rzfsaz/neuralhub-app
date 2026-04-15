/**
 * GET    /api/projects       → list user projects
 * POST   /api/projects       → create project
 * PATCH  /api/projects/[id]  → update project
 * DELETE /api/projects/[id]  → archive project
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { AIProvider, ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { authenticateRequest } from "@/lib/auth/middleware";
import { PLANS } from "@/lib/billing/stripe";

const CreateSchema = z.object({
  name:            z.string().min(1).max(80),
  description:     z.string().max(500).optional(),
  defaultProvider: z.nativeEnum(AIProvider).default("ANTHROPIC"),
  defaultModel:    z.string().default("claude-sonnet-4-6"),
  systemPrompt:    z.string().max(20_000).optional(),
  status:          z.nativeEnum(ProjectStatus).default("DEVELOPMENT"),
});

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const projects = await prisma.project.findMany({
    where:   { userId: auth.userId, isArchived: false },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { promptRuns: true } },
    },
  });

  // Attach aggregated cost per project (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const costs = await prisma.promptRun.groupBy({
    by:     ["projectId"],
    where:  { userId: auth.userId, createdAt: { gte: thirtyDaysAgo }, status: "SUCCESS" },
    _sum:   { totalCost: true, totalTokens: true },
    _count: { id: true },
  });

  const costMap = new Map(costs.map((c) => [c.projectId, c]));

  return Response.json({
    projects: projects.map((p) => ({
      ...p,
      requestCount:  p._count.promptRuns,
      mtdCost:       costMap.get(p.id)?._sum.totalCost    ?? 0,
      mtdTokens:     costMap.get(p.id)?._sum.totalTokens  ?? 0,
      mtdRequests:   costMap.get(p.id)?._count.id         ?? 0,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  // Enforce project limit per plan
  const user = await prisma.user.findUniqueOrThrow({ where: { id: auth.userId } });
  const planCfg = PLANS[user.plan];
  if (planCfg.maxProjects !== null) {
    const count = await prisma.project.count({ where: { userId: auth.userId, isArchived: false } });
    if (count >= planCfg.maxProjects) {
      return Response.json(
        { error: `Your ${user.plan} plan supports up to ${planCfg.maxProjects} projects. Upgrade to create more.` },
        { status: 403 }
      );
    }
  }

  const body = CreateSchema.parse(await req.json());
  let slug    = slugify(body.name);

  // Ensure slug uniqueness
  const existing = await prisma.project.findFirst({ where: { userId: auth.userId, slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const project = await prisma.project.create({
    data: { userId: auth.userId, slug, ...body },
  });

  return Response.json(project, { status: 201 });
}
