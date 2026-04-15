"use client";

import React, { useState } from "react";
import {
  Key, Shield, Cpu, User, Plus, Trash2, RefreshCw,
  Eye, EyeOff, Copy, Check, AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

const DEMO_PROVIDERS = [
  { id: "1", provider: "ANTHROPIC", isActive: true, lastTested: "2026-04-14", fingerprint: "****8f2a" },
  { id: "2", provider: "OPENAI", isActive: true, lastTested: "2026-04-13", fingerprint: "****c3d1" },
  { id: "3", provider: "GOOGLE", isActive: true, lastTested: "2026-04-12", fingerprint: "****7b9e" },
];

const DEMO_API_KEYS = [
  { id: "1", name: "Production App", prefix: "nhub_sk_live_xR4", isActive: true, lastUsed: "2026-04-14T12:00:00", created: "2026-03-01" },
  { id: "2", name: "Development", prefix: "nhub_sk_test_qW7", isActive: true, lastUsed: "2026-04-13T08:30:00", created: "2026-03-15" },
  { id: "3", name: "CI/CD Pipeline", prefix: "nhub_sk_live_mN2", isActive: true, lastUsed: null, created: "2026-04-01" },
];

const PROVIDER_INFO: Record<string, { label: string; badge: "anthropic" | "openai" | "google"; placeholder: string }> = {
  ANTHROPIC: { label: "Anthropic", badge: "anthropic", placeholder: "sk-ant-..." },
  OPENAI:    { label: "OpenAI",    badge: "openai",    placeholder: "sk-..." },
  GOOGLE:    { label: "Google AI", badge: "google",    placeholder: "AIzaSy..." },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"providers" | "apikeys" | "profile">("providers");
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tabs = [
    { key: "providers" as const, label: "AI Providers", icon: <Cpu size={14} /> },
    { key: "apikeys" as const, label: "API Keys", icon: <Key size={14} /> },
    { key: "profile" as const, label: "Profile", icon: <User size={14} /> },
  ];

  return (
    <AppShell title="Settings" subtitle="Manage your account and integrations">
      <div style={{ display: "flex", gap: "24px" }}>
        {/* Sidebar tabs */}
        <div style={{ width: "200px", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                  fontWeight: activeTab === tab.key ? 500 : 400,
                  color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-secondary)",
                  background: activeTab === tab.key ? "var(--accent-glow)" : "transparent",
                  transition: "var(--transition)",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, maxWidth: "800px" }}>
          {/* Providers Tab */}
          {activeTab === "providers" && (
            <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>AI Provider Keys</h3>
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                    Connect your AI provider API keys. Keys are encrypted with AES-256-GCM.
                  </p>
                </div>
                <Button icon={<Plus size={14} />} onClick={() => setShowAddProvider(true)}>
                  Add Provider
                </Button>
              </div>

              {DEMO_PROVIDERS.map((p) => {
                const info = PROVIDER_INFO[p.provider];
                return (
                  <Card key={p.id} padding="16px">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "var(--radius-md)",
                            background: "var(--bg-surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Shield size={18} color="var(--accent-mid)" />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "14px", fontWeight: 500 }}>{info.label}</span>
                            <Badge variant={info.badge}>{p.provider}</Badge>
                          </div>
                          <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                              Key: {p.fingerprint}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              Tested: {p.lastTested}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Badge variant="success" dot>Connected</Badge>
                        <Button variant="ghost" size="sm" icon={<RefreshCw size={12} />}>
                          Rotate
                        </Button>
                        <Button variant="danger" size="sm" icon={<Trash2 size={12} />}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {/* Unconnected providers */}
              {["MISTRAL", "COHERE"].map((provider) => (
                <Card key={provider} padding="16px" style={{ opacity: 0.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "var(--radius-md)",
                          background: "var(--bg-surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Cpu size={18} color="var(--text-muted)" />
                      </div>
                      <div>
                        <span style={{ fontSize: "14px", fontWeight: 500 }}>{provider}</span>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Not connected</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddProvider(true)}
                    >
                      Connect
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === "apikeys" && (
            <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>Platform API Keys</h3>
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                    Manage API keys for programmatic access to NeuralHub.
                  </p>
                </div>
                <Button icon={<Plus size={14} />} onClick={() => setShowCreateKey(true)}>
                  Create Key
                </Button>
              </div>

              {/* Notice */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--warning-soft)",
                  border: "1px solid rgba(245,158,11,0.15)",
                }}
              >
                <AlertCircle size={16} color="var(--warning)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: "12px", color: "var(--warning)" }}>
                  API keys are only displayed once after creation. Store them securely.
                </p>
              </div>

              {DEMO_API_KEYS.map((key) => (
                <Card key={key.id} padding="16px">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "var(--radius-md)",
                          background: "var(--accent-glow)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Key size={16} color="var(--accent-start)" />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 500 }}>{key.name}</span>
                          <Badge variant={key.prefix.includes("live") ? "success" : "warning"}>
                            {key.prefix.includes("live") ? "Live" : "Test"}
                          </Badge>
                        </div>
                        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                            {key.prefix}...
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {key.lastUsed ? `Last used: ${new Date(key.lastUsed).toLocaleDateString()}` : "Never used"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="danger" size="sm" icon={<Trash2 size={12} />}>
                      Revoke
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>Profile Settings</h3>
                <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Update your personal information.
                </p>
              </div>

              <Card padding="24px">
                <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <Input label="Full Name" defaultValue="John Doe" />
                    <Input label="Email" type="email" defaultValue="john@example.com" disabled />
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "4px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 500, marginBottom: "12px" }}>Change Password</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <Input label="Current Password" type="password" placeholder="••••••••" />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <Input label="New Password" type="password" placeholder="Min. 8 characters" />
                        <Input label="Confirm Password" type="password" placeholder="••••••••" />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "8px" }}>
                    <Button variant="ghost">Cancel</Button>
                    <Button>Save Changes</Button>
                  </div>
                </form>
              </Card>

              {/* Danger zone */}
              <Card padding="24px" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 500, color: "var(--error)", marginBottom: "8px" }}>
                  Danger Zone
                </h4>
                <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "16px" }}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="danger" icon={<Trash2 size={14} />}>
                  Delete Account
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Add Provider Modal */}
      <Modal open={showAddProvider} onClose={() => setShowAddProvider(false)} title="Connect AI Provider">
        <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Select
            label="Provider"
            options={[
              { value: "ANTHROPIC", label: "Anthropic" },
              { value: "OPENAI", label: "OpenAI" },
              { value: "GOOGLE", label: "Google AI" },
              { value: "MISTRAL", label: "Mistral" },
              { value: "COHERE", label: "Cohere" },
            ]}
          />
          <Input label="API Key" type="password" placeholder="Paste your API key..." />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--info-soft)",
              border: "1px solid rgba(59,130,246,0.15)",
            }}
          >
            <Shield size={14} color="var(--info)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: "11px", color: "var(--info)" }}>
              Your key will be encrypted with AES-256-GCM before storage. We never store plaintext keys.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
            <Button variant="ghost" onClick={() => setShowAddProvider(false)}>Cancel</Button>
            <Button icon={<Check size={14} />}>Verify & Save</Button>
          </div>
        </form>
      </Modal>

      {/* Create API Key Modal */}
      <Modal open={showCreateKey} onClose={() => setShowCreateKey(false)} title="Create API Key">
        <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label="Key Name" placeholder="e.g. Production App" required />
          <Select
            label="Key Type"
            options={[
              { value: "live", label: "Live (Production)" },
              { value: "test", label: "Test (Development)" },
            ]}
          />
          <Select
            label="Expiration"
            options={[
              { value: "0", label: "Never expires" },
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
              { value: "365", label: "1 year" },
            ]}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
            <Button variant="ghost" onClick={() => setShowCreateKey(false)}>Cancel</Button>
            <Button icon={<Key size={14} />}>Generate Key</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
