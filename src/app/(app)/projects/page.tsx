"use client";

import React, { useState } from "react";
import {
  Plus, Search, MoreVertical, ExternalLink, Clock, Zap, DollarSign,
  Cpu, FolderKanban,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

const DEMO_PROJECTS = [
  {
    id: "1", name: "Marketing Copilot", slug: "marketing-copilot",
    description: "AI-powered marketing copy generator for campaigns and social media",
    defaultProvider: "ANTHROPIC", defaultModel: "claude-sonnet-4-6",
    status: "ACTIVE", requestCount: 342, mtdCost: 8.45, mtdTokens: 1_240_000,
    mtdRequests: 156, createdAt: "2026-02-15", updatedAt: "2026-04-14",
  },
  {
    id: "2", name: "Code Review Bot", slug: "code-review-bot",
    description: "Automated code review and feedback system for pull requests",
    defaultProvider: "OPENAI", defaultModel: "gpt-4o",
    status: "ACTIVE", requestCount: 218, mtdCost: 12.30, mtdTokens: 890_000,
    mtdRequests: 89, createdAt: "2026-03-01", updatedAt: "2026-04-14",
  },
  {
    id: "3", name: "Customer Support AI", slug: "customer-support-ai",
    description: "Intent classification and automated responses for support tickets",
    defaultProvider: "GOOGLE", defaultModel: "gemini-1.5-pro",
    status: "DEVELOPMENT", requestCount: 45, mtdCost: 1.20, mtdTokens: 340_000,
    mtdRequests: 45, createdAt: "2026-04-01", updatedAt: "2026-04-13",
  },
  {
    id: "4", name: "Document Summarizer", slug: "doc-summarizer",
    description: "Summarize long documents, PDFs, and reports into key takeaways",
    defaultProvider: "ANTHROPIC", defaultModel: "claude-haiku-4-5-20251001",
    status: "STAGING", requestCount: 87, mtdCost: 0.45, mtdTokens: 560_000,
    mtdRequests: 32, createdAt: "2026-03-20", updatedAt: "2026-04-12",
  },
];

const STATUS_COLORS: Record<string, "success" | "warning" | "info" | "default"> = {
  ACTIVE: "success",
  STAGING: "warning",
  DEVELOPMENT: "info",
  ARCHIVED: "default",
};

const PROVIDER_COLORS: Record<string, "anthropic" | "openai" | "google"> = {
  ANTHROPIC: "anthropic",
  OPENAI: "openai",
  GOOGLE: "google",
};

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = DEMO_PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell title="Projects" subtitle="Manage your AI project configurations">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1, maxWidth: "340px" }}>
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
          <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
            New Project
          </Button>
        </div>

        {/* Project Grid */}
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {filtered.map((project) => (
            <Card key={project.id} hover glow padding="0" style={{ overflow: "hidden" }}>
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--accent-glow)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FolderKanban size={16} color="var(--accent-start)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: 600 }}>{project.name}</h3>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                        /{project.slug}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <Badge variant={STATUS_COLORS[project.status]} dot>{project.status}</Badge>
                  </div>
                </div>

                <p style={{ fontSize: "12px", color: "var(--text-tertiary)", lineHeight: 1.5, marginBottom: "16px", minHeight: "36px" }}>
                  {project.description}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Badge variant={PROVIDER_COLORS[project.defaultProvider]}>
                    {project.defaultProvider}
                  </Badge>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {project.defaultModel}
                  </span>
                </div>
              </div>

              {/* Stats footer */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  padding: "12px 20px",
                  borderTop: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.15)",
                }}
              >
                {[
                  { label: "Requests", value: project.mtdRequests, icon: <Zap size={11} /> },
                  { label: "Tokens", value: `${(project.mtdTokens / 1000).toFixed(0)}K`, icon: <Cpu size={11} /> },
                  { label: "Cost", value: `$${project.mtdCost.toFixed(2)}`, icon: <DollarSign size={11} /> },
                ].map((stat) => (
                  <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "var(--text-muted)" }}>{stat.icon}</span>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600 }}>{stat.value}</p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Project" width="520px">
        <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label="Project Name" placeholder="e.g. Marketing Copilot" required />
          <Textarea label="Description" placeholder="Brief description of this project..." rows={3} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Select
              label="Default Provider"
              options={[
                { value: "ANTHROPIC", label: "Anthropic" },
                { value: "OPENAI", label: "OpenAI" },
                { value: "GOOGLE", label: "Google" },
              ]}
            />
            <Select
              label="Default Model"
              options={[
                { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
                { value: "gpt-4o", label: "GPT-4o" },
                { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
              ]}
            />
          </div>
          <Textarea label="System Prompt (optional)" placeholder="You are a helpful assistant..." rows={4} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button icon={<Plus size={14} />}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
