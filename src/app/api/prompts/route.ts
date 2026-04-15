/**
 * POST /api/prompts
 * 
 * Execute a prompt against any configured AI provider.
 * Supports both streaming (SSE) and batch responses.
 *
 * Auth: Bearer token (platform API key) or session cookie
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { AIProvider } from "@prisma/client";
import { executePrompt, streamPrompt } from "@/lib/ai/execution";
import { authenticateRequest } from "@/lib/auth/middleware";
import { rateLimit } from "@/lib/cache/redis";

const BodySchema = z.object({
  provider:     z.nativeEnum(AIProvider),
  model:        z.string().min(1),
  systemPrompt: z.string().optional(),
  userPrompt:   z.string().min(1).max(100_000),
  projectId:    z.string().optional(),
  temperature:  z.number().min(0).max(2).optional(),
  maxTokens:    z.number().int().min(1).max(32_000).optional(),
  stream:       z.boolean().default(false),
  metadata:     z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  // 1. Auth
  const auth = await authenticateRequest(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  // 2. Rate limit: 60 req/min per user
  const limited = await rateLimit(`rl:prompts:${auth.userId}`, 60, 60);
  if (!limited.ok) {
    return Response.json(
      { error: "Rate limit exceeded", retryAfter: limited.retryAfter },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  // 3. Parse body
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return Response.json({ error: "Invalid request body", details: err }, { status: 400 });
  }

  const opts = {
    userId:       auth.userId,
    apiKeyId:     auth.apiKeyId,
    projectId:    body.projectId,
    provider:     body.provider,
    model:        body.model,
    systemPrompt: body.systemPrompt,
    userPrompt:   body.userPrompt,
    temperature:  body.temperature,
    maxTokens:    body.maxTokens,
    stream:       body.stream,
    requestIp:    req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined,
    userAgent:    req.headers.get("user-agent") ?? undefined,
    metadata:     body.metadata,
  };

  // 4a. Streaming response (SSE)
  if (body.stream) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of streamPrompt(opts)) {
            const data = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            if (event.done || event.error) break;
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type":  "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection":    "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // 4b. Batch response
  try {
    const result = await executePrompt(opts);
    return Response.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";

    if (message === "BUDGET_EXCEEDED_COST" || message === "BUDGET_EXCEEDED_TOKENS") {
      return Response.json({ error: message }, { status: 402 });
    }

    console.error("[POST /api/prompts]", err);
    return Response.json({ error: "Execution failed", details: message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/prompts — list prompt history
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/prisma";

const ListSchema = z.object({
  page:      z.coerce.number().int().min(1).default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  projectId: z.string().optional(),
  provider:  z.nativeEnum(AIProvider).optional(),
  status:    z.enum(["SUCCESS", "ERROR", "PENDING"]).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 });

  const params = ListSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const skip   = (params.page - 1) * params.limit;

  const where = {
    userId:    auth.userId,
    projectId: params.projectId,
    provider:  params.provider,
    status:    params.status,
  };

  const [runs, total] = await prisma.$transaction([
    prisma.promptRun.findMany({
      where,
      skip,
      take:    params.limit,
      orderBy: { createdAt: "desc" },
      select:  {
        id: true, provider: true, model: true, status: true,
        userPrompt: true, totalTokens: true, totalCost: true,
        totalMs: true, createdAt: true,
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.promptRun.count({ where }),
  ]);

  return Response.json({ runs, total, page: params.page, pages: Math.ceil(total / params.limit) });
}
