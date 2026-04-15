"use client";

import React, { useState } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Zap,
  DollarSign, AlertTriangle, Activity,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { UsageChart } from "@/components/charts/UsageChart";
import { ProviderPie } from "@/components/charts/ProviderPie";
import { CostChart } from "@/components/charts/CostChart";

const PERIODS = ["7d", "30d", "90d", "12m"] as const;

const DAILY_DATA: Record<string, Array<{label: string; value: number}>> = {
  "7d": [
    { label: "Apr 8", value: 2800 }, { label: "Apr 9", value: 3200 },
    { label: "Apr 10", value: 2600 }, { label: "Apr 11", value: 4100 },
    { label: "Apr 12", value: 3800 }, { label: "Apr 13", value: 4500 },
    { label: "Apr 14", value: 3900 },
  ],
  "30d": Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}`,
    value: Math.floor(1500 + Math.random() * 3500),
  })),
  "90d": Array.from({ length: 12 }, (_, i) => ({
    label: `W${i + 1}`,
    value: Math.floor(10000 + Math.random() * 25000),
  })),
  "12m": [
    { label: "May", value: 15000 }, { label: "Jun", value: 22000 },
    { label: "Jul", value: 18000 }, { label: "Aug", value: 31000 },
    { label: "Sep", value: 28000 }, { label: "Oct", value: 35000 },
    { label: "Nov", value: 42000 }, { label: "Dec", value: 38000 },
    { label: "Jan", value: 45000 }, { label: "Feb", value: 52000 },
    { label: "Mar", value: 48000 }, { label: "Apr", value: 41000 },
  ],
};

export default function UsagePage() {
  const [period, setPeriod] = useState<typeof PERIODS[number]>("30d");

  return (
    <AppShell title="Usage Analytics" subtitle="Monitor your AI consumption and costs">
      <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Period selector */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {PERIODS.map((p) => (
              <Button
                key={p}
                variant={period === p ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPeriod(p)}
                style={{
                  ...(period === p && {
                    background: "var(--accent-glow)",
                    borderColor: "var(--border-active)",
                    color: "var(--text-primary)",
                  }),
                }}
              >
                {p === "7d" ? "7 days" : p === "30d" ? "30 days" : p === "90d" ? "90 days" : "12 months"}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <StatCard
            label="Total Requests"
            value="24,892"
            change="+18.4% vs prev period"
            changeType="positive"
            icon={<Activity size={20} />}
          />
          <StatCard
            label="Total Tokens"
            value="12.8M"
            change="Input: 4.2M · Output: 8.6M"
            changeType="neutral"
            icon={<Zap size={20} />}
          />
          <StatCard
            label="Total Cost"
            value="$142.30"
            change="+22.1% vs prev period"
            changeType="negative"
            icon={<DollarSign size={20} />}
          />
          <StatCard
            label="Error Rate"
            value="0.8%"
            change="198 failed requests"
            changeType="neutral"
            icon={<AlertTriangle size={20} />}
          />
        </div>

        {/* Main Chart */}
        <Card padding="24px">
          <UsageChart data={DAILY_DATA[period]} title="Request Volume" height={260} />
        </Card>

        {/* Bottom Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <Card padding="24px">
            <ProviderPie
              title="Provider Distribution"
              size={130}
              data={[
                { label: "Anthropic", value: 12420, color: "var(--anthropic)" },
                { label: "OpenAI", value: 8340, color: "var(--openai)" },
                { label: "Google", value: 4132, color: "var(--google)" },
              ]}
            />
          </Card>
          <Card padding="24px">
            <CostChart
              title="Cost by Model"
              data={[
                { label: "Claude Sonnet 4.6", value: 52.40 },
                { label: "GPT-4o", value: 38.90 },
                { label: "Gemini 1.5 Pro", value: 22.50 },
                { label: "Claude Haiku 4.5", value: 15.20 },
                { label: "GPT-4o Mini", value: 8.30 },
                { label: "Gemini Flash", value: 5.00 },
              ]}
            />
          </Card>
          <Card padding="24px">
            <h4 style={{ fontSize: "13px", fontWeight: 500, marginBottom: "16px", color: "var(--text-secondary)" }}>
              Budget Status
            </h4>

            {/* Token budget */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Token Budget</span>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>12.8M / 20M</span>
              </div>
              <div style={{ height: "8px", borderRadius: "4px", background: "var(--bg-surface)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: "64%",
                    borderRadius: "4px",
                    background: "linear-gradient(90deg, var(--accent-start), var(--warning))",
                    transition: "width 1s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: "10px", color: "var(--warning)", marginTop: "4px", display: "block" }}>
                64% used — 7.2M remaining
              </span>
            </div>

            {/* Cost budget */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Cost Budget</span>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>$142 / $200</span>
              </div>
              <div style={{ height: "8px", borderRadius: "4px", background: "var(--bg-surface)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: "71%",
                    borderRadius: "4px",
                    background: "linear-gradient(90deg, var(--accent-start), var(--error))",
                    transition: "width 1s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: "10px", color: "var(--error)", marginTop: "4px", display: "block" }}>
                71% used — $58 remaining
              </span>
            </div>

            {/* Top models */}
            <div style={{ marginTop: "20px" }}>
              <h5 style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "10px" }}>
                Top Models by Volume
              </h5>
              {[
                { model: "claude-sonnet-4-6", pct: 42 },
                { model: "gpt-4o", pct: 28 },
                { model: "gemini-1.5-pro", pct: 18 },
              ].map((m) => (
                <div key={m.model} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", width: "120px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.model}
                  </span>
                  <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "var(--bg-surface)" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${m.pct}%`,
                        borderRadius: "2px",
                        background: "var(--accent-mid)",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", width: "30px", textAlign: "right" }}>
                    {m.pct}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
