/**
 * NeuralHub · AI Provider Abstraction Layer
 * 
 * Unified interface over Anthropic, OpenAI, and Google Gemini.
 * All provider-specific logic is isolated here; the rest of the app
 * only calls `createProvider(config)` and uses the returned interface.
 */

import { AIProvider } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Core Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  topP?: number;
  metadata?: Record<string, unknown>;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CompletionResponse {
  id: string;
  content: string;
  stopReason: string;
  usage: TokenUsage;
  model: string;
  provider: AIProvider;
  latencyMs: number;
}

export interface StreamChunk {
  type: "delta" | "done" | "error";
  delta?: string;
  usage?: TokenUsage;
  error?: string;
}

export interface AIProviderClient {
  provider: AIProvider;
  complete(req: CompletionRequest): Promise<CompletionResponse>;
  stream(req: CompletionRequest): AsyncIterable<StreamChunk>;
  listModels(): Promise<string[]>;
  validateKey(): Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cost Calculator
// ─────────────────────────────────────────────────────────────────────────────

// Prices in USD per 1,000 tokens (as of April 2026 — update regularly)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  "claude-opus-4-6":        { input: 0.015,  output: 0.075  },
  "claude-sonnet-4-6":      { input: 0.003,  output: 0.015  },
  "claude-haiku-4-5-20251001": { input: 0.00025, output: 0.00125 },
  // OpenAI
  "gpt-4o":                 { input: 0.005,  output: 0.015  },
  "gpt-4o-mini":            { input: 0.00015,output: 0.0006 },
  "gpt-4-turbo":            { input: 0.01,   output: 0.03   },
  // Google
  "gemini-1.5-pro":         { input: 0.00125,output: 0.005  },
  "gemini-1.5-flash":       { input: 0.000075,output: 0.0003},
  "gemini-2.0-flash":       { input: 0.0001, output: 0.0004 },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const pricing = MODEL_PRICING[model] ?? { input: 0, output: 0 };
  const inputCost  = (inputTokens  / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

// ─────────────────────────────────────────────────────────────────────────────
// Anthropic Provider
// ─────────────────────────────────────────────────────────────────────────────

class AnthropicProvider implements AIProviderClient {
  readonly provider = AIProvider.ANTHROPIC;
  private client: import("@anthropic-ai/sdk").Anthropic;

  constructor(apiKey: string) {
    // Dynamic import to keep tree-shaking possible
    const Anthropic = require("@anthropic-ai/sdk");
    this.client = new Anthropic.Anthropic({ apiKey });
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now();
    const systemMsg = req.messages.find((m) => m.role === "system");
    const userMsgs  = req.messages.filter((m) => m.role !== "system");

    const res = await this.client.messages.create({
      model: req.model,
      max_tokens: req.maxTokens ?? 4096,
      temperature: req.temperature ?? 1,
      system: systemMsg?.content,
      messages: userMsgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    });

    const text = res.content[0]?.type === "text" ? res.content[0].text : "";
    return {
      id: res.id,
      content: text,
      stopReason: res.stop_reason ?? "end_turn",
      usage: {
        inputTokens:  res.usage.input_tokens,
        outputTokens: res.usage.output_tokens,
        totalTokens:  res.usage.input_tokens + res.usage.output_tokens,
      },
      model: req.model,
      provider: AIProvider.ANTHROPIC,
      latencyMs: Date.now() - start,
    };
  }

  async *stream(req: CompletionRequest): AsyncIterable<StreamChunk> {
    const systemMsg = req.messages.find((m) => m.role === "system");
    const userMsgs  = req.messages.filter((m) => m.role !== "system");

    const stream = await this.client.messages.stream({
      model: req.model,
      max_tokens: req.maxTokens ?? 4096,
      system: systemMsg?.content,
      messages: userMsgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { type: "delta", delta: event.delta.text };
      }
      if (event.type === "message_delta" && event.usage) {
        const msg = await stream.finalMessage();
        yield {
          type: "done",
          usage: {
            inputTokens:  msg.usage.input_tokens,
            outputTokens: msg.usage.output_tokens,
            totalTokens:  msg.usage.input_tokens + msg.usage.output_tokens,
          },
        };
      }
    }
  }

  async listModels() {
    return ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"];
  }

  async validateKey(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI Provider
// ─────────────────────────────────────────────────────────────────────────────

class OpenAIProvider implements AIProviderClient {
  readonly provider = AIProvider.OPENAI;
  private client: import("openai").OpenAI;

  constructor(apiKey: string) {
    const OpenAI = require("openai");
    this.client = new OpenAI.OpenAI({ apiKey });
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now();
    const res = await this.client.chat.completions.create({
      model: req.model,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: req.maxTokens,
      temperature: req.temperature,
      top_p: req.topP,
    });

    const choice = res.choices[0];
    return {
      id: res.id,
      content: choice.message.content ?? "",
      stopReason: choice.finish_reason ?? "stop",
      usage: {
        inputTokens:  res.usage?.prompt_tokens ?? 0,
        outputTokens: res.usage?.completion_tokens ?? 0,
        totalTokens:  res.usage?.total_tokens ?? 0,
      },
      model: req.model,
      provider: AIProvider.OPENAI,
      latencyMs: Date.now() - start,
    };
  }

  async *stream(req: CompletionRequest): AsyncIterable<StreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: req.model,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: req.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield { type: "delta", delta };

      if (chunk.usage) {
        yield {
          type: "done",
          usage: {
            inputTokens:  chunk.usage.prompt_tokens,
            outputTokens: chunk.usage.completion_tokens,
            totalTokens:  chunk.usage.total_tokens,
          },
        };
      }
    }
  }

  async listModels() {
    const res = await this.client.models.list();
    return res.data.map((m) => m.id).filter((id) => id.startsWith("gpt-"));
  }

  async validateKey(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Google Gemini Provider
// ─────────────────────────────────────────────────────────────────────────────

class GeminiProvider implements AIProviderClient {
  readonly provider = AIProvider.GOOGLE;
  private genAI: import("@google/generative-ai").GoogleGenerativeAI;

  constructor(apiKey: string) {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private buildContents(messages: Message[]) {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const start   = Date.now();
    const model   = this.genAI.getGenerativeModel({ model: req.model });
    const system  = req.messages.find((m) => m.role === "system");
    const history = this.buildContents(req.messages.slice(0, -1));
    const last    = req.messages.at(-1)!;

    const chat = model.startChat({
      history,
      systemInstruction: system?.content,
      generationConfig: { maxOutputTokens: req.maxTokens, temperature: req.temperature },
    });

    const result = await chat.sendMessage(last.content);
    const resp   = result.response;
    const usage  = resp.usageMetadata;

    return {
      id: `gemini-${Date.now()}`,
      content: resp.text(),
      stopReason: resp.candidates?.[0]?.finishReason ?? "STOP",
      usage: {
        inputTokens:  usage?.promptTokenCount ?? 0,
        outputTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens:  usage?.totalTokenCount ?? 0,
      },
      model: req.model,
      provider: AIProvider.GOOGLE,
      latencyMs: Date.now() - start,
    };
  }

  async *stream(req: CompletionRequest): AsyncIterable<StreamChunk> {
    const model  = this.genAI.getGenerativeModel({ model: req.model });
    const system = req.messages.find((m) => m.role === "system");
    const last   = req.messages.at(-1)!;

    const chat   = model.startChat({ systemInstruction: system?.content });
    const result = await chat.sendMessageStream(last.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield { type: "delta", delta: text };
    }

    const finalResp = await result.response;
    const usage     = finalResp.usageMetadata;
    yield {
      type: "done",
      usage: {
        inputTokens:  usage?.promptTokenCount ?? 0,
        outputTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens:  usage?.totalTokenCount ?? 0,
      },
    };
  }

  async listModels() {
    return ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"];
  }

  async validateKey(): Promise<boolean> {
    try {
      await this.complete({
        model: "gemini-1.5-flash",
        messages: [{ role: "user", content: "ping" }],
        maxTokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

export function createProvider(provider: AIProvider, apiKey: string): AIProviderClient {
  switch (provider) {
    case AIProvider.ANTHROPIC: return new AnthropicProvider(apiKey);
    case AIProvider.OPENAI:    return new OpenAIProvider(apiKey);
    case AIProvider.GOOGLE:    return new GeminiProvider(apiKey);
    default:
      throw new Error(`Provider ${provider} is not yet implemented`);
  }
}
