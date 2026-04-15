"use client";

import React from "react";
import {
  Activity, Zap, DollarSign, FolderKanban, ArrowUpRight,
  TrendingUp, Clock, Cpu, Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UsageChart } from "@/components/charts/UsageChart";
import { ProviderPie } from "@/components/charts/ProviderPie";
import { CostChart } from "@/components/charts/CostChart";

// Demo data starting completely empty for a new user
const DAILY_USAGE: { label: string; value: number }[] = [];

const PROVIDER_DATA: { label: string; value: number; color: string }[] = [];

const COST_DATA: { label: string; value: number }[] = [];

const RECENT_PROMPTS: {
  id: number; prompt: string; model: string; provider: string; tokens: number; cost: number; ms: number; status: string;
}[] = [];

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" subtitle="Overview of your AI activity">
      <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <StatCard
            label="Total Requests"
            value="0"
            change="No requests yet"
            changeType="neutral"
            icon={<Activity size={20} />}
          />
          <StatCard
            label="Tokens Used"
            value="0"
            change="1.0M remaining"
            changeType="neutral"
            icon={<Zap size={20} />}
          />
          <StatCard
            label="Total Cost"
            value="$0.00"
            change="From your $5.00 budget"
            changeType="neutral"
            icon={<DollarSign size={20} />}
          />
          <StatCard
            label="Active Projects"
            value="0"
            change="Ready to start"
            changeType="neutral"
            icon={<FolderKanban size={20} />}
          />
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          <Card padding="24px">
             <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-tertiary)" }}>
               <TrendingUp size={32} style={{ opacity: 0.5, margin: "0 auto 12px" }} />
               <p>No usage data yet. Start making API requests!</p>
             </div>
          </Card>
        </div>

        {/* Recent Prompts */}
        <Card padding="0">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Recent Prompts</h3>
            <a
              href="/prompts"
              style={{
                fontSize: "12px",
                color: "var(--accent-mid)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          <div>
            {RECENT_PROMPTS.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>
                You have not made any prompt requests yet.
              </div>
            ) : RECENT_PROMPTS.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 100px 80px 70px 80px",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 20px",
                  borderBottom: i < RECENT_PROMPTS.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "var(--transition)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--glass-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <Sparkles size={14} style={{ color: "var(--accent-mid)", flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: "13px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.prompt}
                  </span>
                </div>
                <Badge
                  variant={
                    p.provider === "ANTHROPIC" ? "anthropic" :
                    p.provider === "OPENAI" ? "openai" : "google"
                  }
                  dot
                >
                  {p.model}
                </Badge>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  {p.tokens.toLocaleString()} tok
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  ${p.cost.toFixed(3)}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={10} /> {p.ms}ms
                </span>
                <Badge variant={p.status === "SUCCESS" ? "success" : "error"} dot>
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Provider Status */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[
            { name: "Anthropic", status: "Connected", models: 3, icon: "🟠", color: "var(--anthropic)" },
            { name: "OpenAI", status: "Connected", models: 3, icon: "🟢", color: "var(--openai)" },
            { name: "Google", status: "Connected", models: 3, icon: "🔵", color: "var(--google)" },
          ].map((p) => (
            <Card key={p.name} hover glow>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-md)",
                      background: `${p.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    <Cpu size={16} style={{ color: p.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 500 }}>{p.name}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                      {p.models} models available
                    </p>
                  </div>
                </div>
                <Badge variant="success" dot>{p.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
