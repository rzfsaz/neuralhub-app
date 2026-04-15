/**
 * NeuralHub · Prisma Seed
 * Run: pnpm db:seed
 *
 * Seeds ModelConfig table with current pricing for all supported models.
 * Re-running is idempotent (upsert on provider+modelId).
 */

import { PrismaClient, AIProvider } from "@prisma/client";

const prisma = new PrismaClient();

const models: {
  provider: AIProvider;
  modelId:  string;
  label:    string;
  inputCostPer1kTokens:  number;
  outputCostPer1kTokens: number;
  contextWindow: number;
  supportsVision: boolean;
}[] = [
  // ── Anthropic ──────────────────────────────────────────────────────────────
  {
    provider: "ANTHROPIC", modelId: "claude-opus-4-6",
    label: "Claude Opus 4.6",
    inputCostPer1kTokens: 0.015, outputCostPer1kTokens: 0.075,
    contextWindow: 200_000, supportsVision: true,
  },
  {
    provider: "ANTHROPIC", modelId: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    inputCostPer1kTokens: 0.003, outputCostPer1kTokens: 0.015,
    contextWindow: 200_000, supportsVision: true,
  },
  {
    provider: "ANTHROPIC", modelId: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    inputCostPer1kTokens: 0.00025, outputCostPer1kTokens: 0.00125,
    contextWindow: 200_000, supportsVision: true,
  },

  // ── OpenAI ────────────────────────────────────────────────────────────────
  {
    provider: "OPENAI", modelId: "gpt-4o",
    label: "GPT-4o",
    inputCostPer1kTokens: 0.005, outputCostPer1kTokens: 0.015,
    contextWindow: 128_000, supportsVision: true,
  },
  {
    provider: "OPENAI", modelId: "gpt-4o-mini",
    label: "GPT-4o Mini",
    inputCostPer1kTokens: 0.00015, outputCostPer1kTokens: 0.0006,
    contextWindow: 128_000, supportsVision: true,
  },
  {
    provider: "OPENAI", modelId: "gpt-4-turbo",
    label: "GPT-4 Turbo",
    inputCostPer1kTokens: 0.01, outputCostPer1kTokens: 0.03,
    contextWindow: 128_000, supportsVision: true,
  },

  // ── Google Gemini ─────────────────────────────────────────────────────────
  {
    provider: "GOOGLE", modelId: "gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    inputCostPer1kTokens: 0.00125, outputCostPer1kTokens: 0.005,
    contextWindow: 2_000_000, supportsVision: true,
  },
  {
    provider: "GOOGLE", modelId: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash",
    inputCostPer1kTokens: 0.000075, outputCostPer1kTokens: 0.0003,
    contextWindow: 1_000_000, supportsVision: true,
  },
  {
    provider: "GOOGLE", modelId: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    inputCostPer1kTokens: 0.0001, outputCostPer1kTokens: 0.0004,
    contextWindow: 1_000_000, supportsVision: true,
  },
];

async function main() {
  console.log("Seeding model configs...");

  for (const model of models) {
    await prisma.modelConfig.upsert({
      where:  { provider_modelId: { provider: model.provider, modelId: model.modelId } },
      create: { ...model, isActive: true, supportsStreaming: true },
      update: {
        label:                 model.label,
        inputCostPer1kTokens:  model.inputCostPer1kTokens,
        outputCostPer1kTokens: model.outputCostPer1kTokens,
        contextWindow:         model.contextWindow,
        supportsVision:        model.supportsVision,
        isActive:              true,
      },
    });
    console.log(`  ✓ ${model.provider} / ${model.modelId}`);
  }

  console.log(`\nSeeded ${models.length} model configs.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
