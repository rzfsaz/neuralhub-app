"use client";

import React, { useState } from "react";
import {
  Send, Sparkles, Copy, RotateCcw, Clock, Zap,
  ChevronDown, Settings,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";

const DEMO_RESPONSE = `Here's a summary of the key points:

## 1. Performance Improvements
The latest release includes significant performance optimizations that reduce API latency by approximately 40%. This is achieved through:
- **Connection pooling** at the database layer
- **Response caching** with intelligent invalidation
- **Stream processing** for large payloads

## 2. New Features
Several new features have been introduced:
- Multi-model routing with automatic fallback
- Enhanced token tracking with per-request cost breakdown
- Real-time usage monitoring dashboard

## 3. Security Updates
Critical security patches applied to:
- AES-256-GCM encryption for API keys at rest
- Rate limiting with sliding window algorithm
- CSRF protection on all mutation endpoints

These changes represent a major step forward in both reliability and developer experience.`;

export default function PromptsPage() {
  const [provider, setProvider] = useState("ANTHROPIC");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState("1");
  const [maxTokens, setMaxTokens] = useState("4096");

  const MODELS: Record<string, Array<{value: string; label: string}>> = {
    ANTHROPIC: [
      { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
      { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
    OPENAI: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    ],
    GOOGLE: [
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
      { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ],
  };

  function handleExecute() {
    if (!userPrompt.trim()) return;
    setIsStreaming(true);
    setResponse("");

    // Simulate streaming with character-by-character reveal
    let i = 0;
    const interval = setInterval(() => {
      if (i < DEMO_RESPONSE.length) {
        setResponse((prev) => prev + DEMO_RESPONSE[i]);
        i++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 8);
  }

  return (
    <AppShell title="Playground" subtitle="Execute and test prompts in real-time">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", height: "calc(100vh - 140px)" }}>
        {/* Input Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Provider/Model selector */}
          <Card padding="16px">
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Select
                  label="Provider"
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value);
                    setModel(MODELS[e.target.value][0].value);
                  }}
                  options={[
                    { value: "ANTHROPIC", label: "Anthropic" },
                    { value: "OPENAI", label: "OpenAI" },
                    { value: "GOOGLE", label: "Google" },
                  ]}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Select
                  label="Model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  options={MODELS[provider]}
                />
              </div>
              <Button
                variant={showSettings ? "secondary" : "ghost"}
                size="md"
                onClick={() => setShowSettings(!showSettings)}
                icon={<Settings size={14} />}
                style={{ height: "40px" }}
              />
            </div>

            {showSettings && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <Input
                  label="Temperature"
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  min={0}
                  max={2}
                  step={0.1}
                />
                <Input
                  label="Max Tokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  min={1}
                  max={32000}
                />
              </div>
            )}
          </Card>

          {/* System prompt */}
          <Card padding="16px" style={{ flex: 0 }}>
            <Textarea
              label="System Prompt"
              placeholder="You are a helpful AI assistant..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
              style={{ minHeight: "72px" }}
            />
          </Card>

          {/* User prompt */}
          <Card padding="16px" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Textarea
              label="User Prompt"
              placeholder="Type your prompt here..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              style={{ flex: 1, minHeight: "200px" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
              <Button
                variant="ghost"
                icon={<RotateCcw size={14} />}
                onClick={() => {
                  setUserPrompt("");
                  setResponse("");
                }}
              >
                Clear
              </Button>
              <Button
                icon={<Send size={14} />}
                loading={isStreaming}
                onClick={handleExecute}
                disabled={!userPrompt.trim()}
              >
                Execute
              </Button>
            </div>
          </Card>
        </div>

        {/* Output Panel */}
        <Card padding="0" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={14} color="var(--accent-mid)" />
              <span style={{ fontSize: "13px", fontWeight: 500 }}>Response</span>
              {isStreaming && (
                <Badge variant="info" dot>Streaming</Badge>
              )}
            </div>
            {response && (
              <div style={{ display: "flex", gap: "4px" }}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Copy size={12} />}
                  onClick={() => navigator.clipboard.writeText(response)}
                >
                  Copy
                </Button>
              </div>
            )}
          </div>

          {/* Response Body */}
          <div
            style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto",
              fontSize: "13px",
              lineHeight: 1.7,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {response ? (
              <div>{response}{isStreaming && <span className="animate-pulse" style={{ color: "var(--accent-mid)" }}>▋</span>}</div>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  gap: "12px",
                }}
              >
                <Sparkles size={32} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: "13px" }}>Response will appear here</p>
                <p style={{ fontSize: "11px" }}>Select a provider, write your prompt, and click Execute</p>
              </div>
            )}
          </div>

          {/* Footer stats */}
          {response && !isStreaming && (
            <div
              style={{
                display: "flex",
                gap: "16px",
                padding: "10px 16px",
                borderTop: "1px solid var(--border)",
                background: "rgba(0,0,0,0.15)",
                fontSize: "11px",
                color: "var(--text-tertiary)",
                flexShrink: 0,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Zap size={10} /> 2,340 tokens
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={10} /> 1.24s
              </span>
              <span>$0.042</span>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
