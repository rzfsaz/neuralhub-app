"use client";

import React from "react";
import { Bell, Search, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header
      className="apple-glass"
      style={{
        height: "var(--topbar-height)",
        borderBottom: "1px solid var(--glass-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: Title */}
      <div>
        <h1 style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em" }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "1px" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Search */}
        <button
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-tertiary)",
            transition: "var(--transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-surface)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-tertiary)";
          }}
        >
          <Search size={16} />
        </button>

        {/* Notifications */}
        <button
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-tertiary)",
            transition: "var(--transition)",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-surface)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-tertiary)";
          }}
        >
          <Bell size={16} />
          <span
            style={{
              position: "absolute",
              top: "7px",
              right: "8px",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--accent-start)",
            }}
          />
        </button>

        {/* Divider */}
        <div style={{ width: "1px", height: "24px", background: "var(--border)", margin: "0 4px" }} />

        {/* User */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 8px",
            borderRadius: "var(--radius-md)",
            transition: "var(--transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-surface)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Avatar name="User" size={28} />
          <ChevronDown size={14} color="var(--text-tertiary)" />
        </button>
      </div>
    </header>
  );
}
