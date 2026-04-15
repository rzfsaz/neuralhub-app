/**
 * NeuralHub · Shared TypeScript Types
 */

// Re-export Prisma enums for client-side use
export type { AIProvider, Plan, RunStatus, ProjectStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// API Response shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiError {
  error:    string;
  details?: unknown;
  code?:    string;
}

export interface PaginatedResponse<T> {
  items:  T[];
  total:  number;
  page:   number;
  pages:  number;
  limit:  number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Project
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectSummary {
  id:              string;
  name:            string;
  description?:    string;
  slug:            string;
  defaultProvider: string;
  defaultModel:    string;
  status:          string;
  requestCount:    number;
  mtdCost:         number;
  mtdTokens:       number;
  mtdRequests:     number;
  createdAt:       string;
  updatedAt:       string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt Run
// ─────────────────────────────────────────────────────────────────────────────

export interface PromptRunSummary {
  id:          string;
  provider:    string;
  model:       string;
  status:      string;
  userPrompt:  string;
  totalTokens: number;
  totalCost:   number;
  totalMs?:    number;
  createdAt:   string;
  project?:    { id: string; name: string };
}

export interface PromptRunDetail extends PromptRunSummary {
  systemPrompt?: string;
  response?:     string;
  inputTokens:   number;
  outputTokens:  number;
  inputCost:     number;
  outputCost:    number;
  stopReason?:   string;
  errorMessage?: string;
  ttfbMs?:       number;
  metadata?:     Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyUsage {
  date:         string;
  requests:     number;
  inputTokens:  number;
  outputTokens: number;
  totalTokens:  number;
  totalCost:    number;
  errorCount:   number;
}

export interface MonthlyUsage {
  year:         number;
  month:        number;
  label:        string;
  requests:     number;
  inputTokens:  number;
  outputTokens: number;
  totalTokens:  number;
  totalCost:    number;
  errorCount:   number;
}

export interface ProviderBreakdown {
  provider:    string;
  requests:    number;
  totalTokens: number;
  totalCost:   number;
}

export interface UsageResponse {
  daily:              DailyUsage[];
  monthly:            MonthlyUsage[];
  providerBreakdown:  ProviderBreakdown[];
  totals: {
    requests:     number;
    totalTokens:  number;
    totalCost:    number;
    errorCount:   number;
  };
  mtd: {
    requests:    number;
    totalTokens: number;
    totalCost:   number;
    errorCount:  number;
  } | null;
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanConfig {
  label:              string;
  priceId:            string | null;
  monthlyTokenBudget: number;
  monthlyCostBudget:  number;
  maxProjects:        number | null;
  maxApiKeys:         number;
  features:           string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API Keys
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiKeyRecord {
  id:          string;
  name:        string;
  keyPrefix:   string;   // "nhub_sk_live_xxxx..." — display only
  isActive:    boolean;
  lastUsedAt?: string;
  expiresAt?:  string;
  createdAt:   string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Keys
// ─────────────────────────────────────────────────────────────────────────────

export interface ProviderKeyRecord {
  id:              string;
  provider:        string;
  isActive:        boolean;
  lastTestedAt?:   string;
  keyFingerprint:  string;  // "****abcd"
  createdAt:       string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Model Config
// ─────────────────────────────────────────────────────────────────────────────

export interface ModelInfo {
  provider:              string;
  modelId:               string;
  label:                 string;
  inputCostPer1kTokens:  number;
  outputCostPer1kTokens: number;
  contextWindow:         number;
  supportsStreaming:     boolean;
  supportsVision:        boolean;
}
