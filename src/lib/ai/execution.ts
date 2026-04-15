/**
 * NeuralHub · Prompt Execution Service
 *
 * Orchestrates a prompt run end-to-end:
 *   1. Resolve & decrypt the user's provider key
 *   2. Budget guard — reject if over limit
 *   3. Execute (streaming or batch) via provider abstraction
 *   4. Persist PromptRun + update Usage aggregations (atomic)
 *   5. Return result / stream to caller
 */

import { AIProvider, RunStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { redis } from "@/lib/cache/redis";
import { decryptKey } from "@/lib/crypto/aes";
import { createProvider, CompletionRequest, StreamChunk, calculateCost } from "./providers";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ExecuteOptions {
  userId:      string;
  projectId?:  string;
  apiKeyId?:   string;
  provider:    AIProvider;
  model:       string;
  systemPrompt?: string;
  userPrompt:  string;
  temperature?: number;
  maxTokens?:  number;
  stream?:     boolean;
  requestIp?:  string;
  userAgent?:  string;
  metadata?:   Record<string, unknown>;
}

export interface ExecuteResult {
  runId:       string;
  content:     string;
  usage:       { inputTokens: number; outputTokens: number; totalTokens: number };
  cost:        { inputCost: number; outputCost: number; totalCost: number };
  latencyMs:   number;
  model:       string;
  provider:    AIProvider;
}

// ─────────────────────────────────────────────────────────────────────────────
// Budget Guard
// ─────────────────────────────────────────────────────────────────────────────

async function assertBudget(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // Pull MTD usage from Redis cache (refreshed hourly by a cron)
  const cacheKey = `budget:${userId}:${new Date().getMonth()}`;
  const cached   = await redis.hgetall(cacheKey);

  const mtdCost   = parseFloat(cached.cost   ?? "0");
  const mtdTokens = parseInt(  cached.tokens ?? "0", 10);

  if (mtdCost   >= user.monthlyCostBudget)    throw new Error("BUDGET_EXCEEDED_COST");
  if (mtdTokens >= Number(user.monthlyTokenBudget)) throw new Error("BUDGET_EXCEEDED_TOKENS");
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve Provider API Key (with Redis cache, 5 min TTL)
// ─────────────────────────────────────────────────────────────────────────────

async function resolveApiKey(userId: string, provider: AIProvider): Promise<string> {
  const cacheKey = `pkey:${userId}:${provider}`;
  const cached   = await redis.get(cacheKey);
  if (cached) return cached;

  const record = await prisma.providerKey.findUniqueOrThrow({
    where: { userId_provider: { userId, provider } },
  });

  if (!record.isActive) throw new Error("PROVIDER_KEY_INACTIVE");

  const plainKey = decryptKey({
    encryptedKey: record.encryptedKey,
    iv:  record.keyIv,
    tag: record.keyTag,
  });

  await redis.setex(cacheKey, 300, plainKey);  // 5 min TTL
  return plainKey;
}

// ─────────────────────────────────────────────────────────────────────────────
// Persist run + update aggregations (single transaction)
// ─────────────────────────────────────────────────────────────────────────────

async function persistRun(
  runId:   string,
  opts:    ExecuteOptions,
  status:  RunStatus,
  content: string,
  usage:   { inputTokens: number; outputTokens: number; totalTokens: number },
  cost:    { inputCost: number; outputCost: number; totalCost: number },
  latencyMs: number,
  error?:  string
) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;
  const day   = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  await prisma.$transaction([
    // 1. Upsert the PromptRun
    prisma.promptRun.upsert({
      where:  { id: runId },
      create: {
        id:           runId,
        userId:       opts.userId,
        projectId:    opts.projectId,
        apiKeyId:     opts.apiKeyId,
        provider:     opts.provider,
        model:        opts.model,
        systemPrompt: opts.systemPrompt,
        userPrompt:   opts.userPrompt,
        temperature:  opts.temperature,
        maxTokens:    opts.maxTokens,
        stream:       opts.stream ?? false,
        status,
        response:     content,
        errorMessage: error,
        inputTokens:  usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens:  usage.totalTokens,
        inputCost:    cost.inputCost,
        outputCost:   cost.outputCost,
        totalCost:    cost.totalCost,
        totalMs:      latencyMs,
        requestIp:    opts.requestIp,
        userAgent:    opts.userAgent,
        metadata:     opts.metadata as any,
      },
      update: {
        status,
        response:     content,
        errorMessage: error,
        inputTokens:  usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens:  usage.totalTokens,
        inputCost:    cost.inputCost,
        outputCost:   cost.outputCost,
        totalCost:    cost.totalCost,
        totalMs:      latencyMs,
      },
    }),

    // 2. Daily aggregation (total)
    prisma.usageDaily.upsert({
      where:  { userId_date_provider: { userId: opts.userId, date: day, provider: null as any } },
      create: { userId: opts.userId, date: day, provider: null as any, requests: 1, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, totalTokens: usage.totalTokens, totalCost: cost.totalCost, errorCount: status === "ERROR" ? 1 : 0 },
      update: { requests: { increment: 1 }, inputTokens: { increment: usage.inputTokens }, outputTokens: { increment: usage.outputTokens }, totalTokens: { increment: usage.totalTokens }, totalCost: { increment: cost.totalCost }, errorCount: { increment: status === "ERROR" ? 1 : 0 } },
    }),

    // 3. Daily aggregation (by provider)
    prisma.usageDaily.upsert({
      where:  { userId_date_provider: { userId: opts.userId, date: day, provider: opts.provider } },
      create: { userId: opts.userId, date: day, provider: opts.provider, requests: 1, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, totalTokens: usage.totalTokens, totalCost: cost.totalCost, errorCount: status === "ERROR" ? 1 : 0 },
      update: { requests: { increment: 1 }, inputTokens: { increment: usage.inputTokens }, outputTokens: { increment: usage.outputTokens }, totalTokens: { increment: usage.totalTokens }, totalCost: { increment: cost.totalCost }, errorCount: { increment: status === "ERROR" ? 1 : 0 } },
    }),

    // 4. Monthly aggregation (total)
    prisma.usageMonthly.upsert({
      where:  { userId_year_month_provider: { userId: opts.userId, year, month, provider: null as any } },
      create: { userId: opts.userId, year, month, provider: null as any, requests: 1, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, totalTokens: usage.totalTokens, totalCost: cost.totalCost, errorCount: status === "ERROR" ? 1 : 0 },
      update: { requests: { increment: 1 }, inputTokens: { increment: usage.inputTokens }, outputTokens: { increment: usage.outputTokens }, totalTokens: { increment: usage.totalTokens }, totalCost: { increment: cost.totalCost }, errorCount: { increment: status === "ERROR" ? 1 : 0 } },
    }),
  ]);

  // 5. Invalidate budget cache so next request sees fresh numbers
  await redis.del(`budget:${opts.userId}:${now.getMonth()}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Execute (non-streaming)
// ─────────────────────────────────────────────────────────────────────────────

export async function executePrompt(opts: ExecuteOptions): Promise<ExecuteResult> {
  await assertBudget(opts.userId);

  const apiKey = await resolveApiKey(opts.userId, opts.provider);
  const client = createProvider(opts.provider, apiKey);

  const req: CompletionRequest = {
    model: opts.model,
    messages: [
      ...(opts.systemPrompt ? [{ role: "system" as const, content: opts.systemPrompt }] : []),
      { role: "user", content: opts.userPrompt },
    ],
    temperature: opts.temperature,
    maxTokens:   opts.maxTokens,
  };

  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const res  = await client.complete(req);
    const cost = calculateCost(opts.model, res.usage.inputTokens, res.usage.outputTokens);

    await persistRun(runId, opts, "SUCCESS", res.content, res.usage, cost, res.latencyMs);

    return { runId, content: res.content, usage: res.usage, cost, latencyMs: res.latencyMs, model: opts.model, provider: opts.provider };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await persistRun(runId, opts, "ERROR", "", { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, { inputCost: 0, outputCost: 0, totalCost: 0 }, 0, message);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Execute (streaming) — returns an async generator of text chunks
// ─────────────────────────────────────────────────────────────────────────────

export async function* streamPrompt(
  opts: ExecuteOptions
): AsyncGenerator<{ chunk?: string; done?: boolean; runId?: string; error?: string }> {
  await assertBudget(opts.userId);

  const apiKey = await resolveApiKey(opts.userId, opts.provider);
  const client = createProvider(opts.provider, apiKey);

  const req: CompletionRequest = {
    model: opts.model,
    messages: [
      ...(opts.systemPrompt ? [{ role: "system" as const, content: opts.systemPrompt }] : []),
      { role: "user", content: opts.userPrompt },
    ],
    temperature: opts.temperature,
    maxTokens:   opts.maxTokens,
    stream:      true,
  };

  const runId  = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const start  = Date.now();
  let content  = "";
  let usage    = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

  try {
    for await (const event of client.stream(req)) {
      if (event.type === "delta" && event.delta) {
        content += event.delta;
        yield { chunk: event.delta };
      }
      if (event.type === "done" && event.usage) {
        usage = event.usage;
      }
      if (event.type === "error") {
        throw new Error(event.error);
      }
    }

    const cost = calculateCost(opts.model, usage.inputTokens, usage.outputTokens);
    await persistRun(runId, opts, "SUCCESS", content, usage, cost, Date.now() - start);
    yield { done: true, runId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await persistRun(runId, opts, "ERROR", content, usage, { inputCost: 0, outputCost: 0, totalCost: 0 }, Date.now() - start, message);
    yield { error: message };
  }
}
