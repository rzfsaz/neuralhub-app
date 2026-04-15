/**
 * NeuralHub · usePromptStream
 *
 * React hook for streaming prompt execution over SSE.
 *
 * Usage:
 *   const { execute, content, isStreaming, usage, error, reset } = usePromptStream();
 *
 *   await execute({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-6', userPrompt: '...' });
 */

"use client";

import { useState, useCallback, useRef } from "react";
import type { AIProvider } from "@prisma/client";

interface StreamOptions {
  provider:     AIProvider;
  model:        string;
  userPrompt:   string;
  systemPrompt?: string;
  projectId?:   string;
  temperature?: number;
  maxTokens?:   number;
  onChunk?:     (chunk: string) => void;
  onDone?:      (runId: string) => void;
  onError?:     (error: string) => void;
}

interface Usage {
  inputTokens:  number;
  outputTokens: number;
  totalTokens:  number;
}

export function usePromptStream() {
  const [content,     setContent]     = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [usage,       setUsage]       = useState<Usage | null>(null);
  const [runId,       setRunId]       = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setContent("");
    setUsage(null);
    setRunId(null);
    setError(null);
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const execute = useCallback(async (opts: StreamOptions) => {
    reset();
    setIsStreaming(true);

    const controller    = new AbortController();
    abortRef.current    = controller;

    try {
      const res = await fetch("/api/prompts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  controller.signal,
        body:    JSON.stringify({ ...opts, stream: true }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines  = buffer.split("\n");
        buffer       = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          const event = JSON.parse(json);

          if (event.chunk !== undefined) {
            setContent((prev) => prev + event.chunk);
            opts.onChunk?.(event.chunk);
          }

          if (event.done) {
            setRunId(event.runId);
            opts.onDone?.(event.runId);
          }

          if (event.error) {
            setError(event.error);
            opts.onError?.(event.error);
          }
        }
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Streaming failed";
      setError(msg);
      opts.onError?.(msg);
    } finally {
      setIsStreaming(false);
    }
  }, [reset]);

  return { execute, content, isStreaming, usage, runId, error, reset, abort };
}
