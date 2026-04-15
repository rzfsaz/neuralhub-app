"use client";

import React from "react";
import {
  Check, Zap, Crown, Building2, ArrowRight,
  CreditCard, ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const PLANS = [
  {
    key: "FREE",
    label: "Starter",
    price: "$0",
    period: "forever",
    icon: <Zap size={20} />,
    features: ["1M tokens/month", "2 AI providers", "5 projects", "2 API keys", "Community support"],
    current: true,
    color: "var(--text-secondary)",
  },
  {
    key: "PRO",
    label: "Pro",
    price: "$29",
    period: "/month",
    icon: <Crown size={20} />,
    features: ["20M tokens/month", "All AI providers", "Unlimited projects", "10 API keys", "Priority support", "Advanced analytics"],
    popular: true,
    color: "var(--accent-start)",
  },
  {
    key: "TEAM",
    label: "Team",
    price: "$99",
    period: "/month",
    icon: <Building2 size={20} />,
    features: ["100M tokens/month", "All providers", "Unlimited everything", "50 API keys", "SLA + SSO", "Dedicated account manager"],
    color: "var(--accent-mid)",
  },
];

export default function BillingPage() {
  return (
    <AppShell title="Billing" subtitle="Manage your subscription and payment methods">
      <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Current Plan */}
        <Card padding="24px">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600 }}>Current Plan</h3>
                <Badge variant="info">Starter (Free)</Badge>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>
                1M tokens/month · 5 projects · 2 API keys
              </p>
            </div>
            <Button variant="outline" icon={<ExternalLink size={14} />}>
              Manage Subscription
            </Button>
          </div>

          {/* Usage bars */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Token Usage</span>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>230K / 1M</span>
              </div>
              <div style={{ height: "6px", borderRadius: "3px", background: "var(--bg-surface)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "23%", borderRadius: "3px", background: "linear-gradient(90deg, var(--accent-start), var(--accent-mid))" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Cost Budget</span>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>$1.89 / $5.00</span>
              </div>
              <div style={{ height: "6px", borderRadius: "3px", background: "var(--bg-surface)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "38%", borderRadius: "3px", background: "linear-gradient(90deg, var(--success), var(--warning))" }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Plan Comparison */}
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>
            Choose Your Plan
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {PLANS.map((plan) => (
              <div
                key={plan.key}
                style={{
                  position: "relative",
                  borderRadius: "var(--radius-xl)",
                  padding: "1px",
                  ...(plan.popular && {
                    background: "linear-gradient(135deg, var(--accent-start), var(--accent-end))",
                  }),
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      padding: "3px 12px",
                      borderRadius: "var(--radius-full)",
                      background: "linear-gradient(135deg, var(--accent-start), var(--accent-mid))",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "#fff",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      zIndex: 1,
                    }}
                  >
                    Most Popular
                  </div>
                )}
                <div
                  style={{
                    background: plan.current ? "var(--glass-bg)" : "var(--bg-elevated)",
                    borderRadius: plan.popular ? "calc(var(--radius-xl) - 1px)" : "var(--radius-xl)",
                    border: plan.popular ? "none" : "1px solid var(--glass-border)",
                    padding: "28px 24px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "var(--radius-md)",
                        background: `${plan.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: plan.color,
                      }}
                    >
                      {plan.icon}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "16px", fontWeight: 600 }}>{plan.label}</h4>
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <span style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.03em" }}>
                      {plan.price}
                    </span>
                    <span style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>
                      {plan.period}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, marginBottom: "20px" }}>
                    {plan.features.map((f) => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Check size={14} color="var(--success)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={plan.current ? "outline" : plan.popular ? "primary" : "secondary"}
                    size="lg"
                    style={{ width: "100%", justifyContent: "center" }}
                    disabled={plan.current}
                    icon={plan.current ? undefined : <ArrowRight size={14} />}
                  >
                    {plan.current ? "Current Plan" : "Upgrade"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <Card padding="24px">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "28px",
                  borderRadius: "var(--radius-sm)",
                  background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard size={16} color="var(--text-tertiary)" />
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 500 }}>No payment method</p>
                <p style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                  Add a payment method to upgrade your plan
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Add Payment Method
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
