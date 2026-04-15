"use client";

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "anthropic" | "openai" | "google";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({ children, variant = "default", size = "sm", dot = false }: BadgeProps) {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    default:   { bg: "var(--bg-surface)",    text: "var(--text-secondary)", dot: "var(--text-tertiary)" },
    success:   { bg: "var(--success-soft)",  text: "var(--success)",        dot: "var(--success)" },
    warning:   { bg: "var(--warning-soft)",  text: "var(--warning)",        dot: "var(--warning)" },
    error:     { bg: "var(--error-soft)",    text: "var(--error)",          dot: "var(--error)" },
    info:      { bg: "var(--info-soft)",     text: "var(--info)",           dot: "var(--info)" },
    anthropic: { bg: "rgba(217,119,6,0.1)",  text: "var(--anthropic)",      dot: "var(--anthropic)" },
    openai:    { bg: "rgba(16,185,129,0.1)", text: "var(--openai)",         dot: "var(--openai)" },
    google:    { bg: "rgba(59,130,246,0.1)", text: "var(--google)",         dot: "var(--google)" },
  };

  const c = colors[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        fontSize: size === "sm" ? "11px" : "12px",
        fontWeight: 500,
        borderRadius: "var(--radius-full)",
        background: c.bg,
        color: c.text,
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: c.dot,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
