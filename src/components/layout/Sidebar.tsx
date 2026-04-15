"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  BarChart3,
  CreditCard,
  Settings,
  Key,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

// Safe dynamic signout to avoid Next.js 15 SSR issues
const handleSignOut = async () => {
  const { signOut } = await import("next-auth/react");
  signOut({ callbackUrl: "/auth/login" });
};

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/projects",   label: "Projects",   icon: FolderKanban },
  { href: "/prompts",    label: "Playground",  icon: Sparkles },
  { href: "/usage",      label: "Usage",       icon: BarChart3 },
  { href: "/billing",    label: "Billing",     icon: CreditCard },
  { href: "/settings",   label: "Settings",    icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="apple-glass"
      style={{
        width: "var(--sidebar-width)",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        borderRight: "1px solid var(--glass-border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: "var(--topbar-height)",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <Logo size={28} />
        <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Neural<span className="gradient-text">Hub</span>
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--accent-glow)" : "transparent",
                  transition: "var(--transition)",
                  textDecoration: "none",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--glass-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "3px",
                      height: "20px",
                      borderRadius: "0 3px 3px 0",
                      background: "linear-gradient(180deg, var(--accent-start), var(--accent-end))",
                    }}
                  />
                )}
                <Icon size={18} style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "12px",
            borderRadius: "var(--radius-md)",
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <Key size={12} color="var(--accent-mid)" />
            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)" }}>
              Free Plan
            </span>
          </div>
          <div style={{ height: "4px", borderRadius: "2px", background: "var(--bg-surface)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: "23%",
                borderRadius: "2px",
                background: "linear-gradient(90deg, var(--accent-start), var(--accent-end))",
              }}
            />
          </div>
          <span style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "4px", display: "block" }}>
            230K / 1M tokens used
          </span>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "12px",
            padding: "9px 12px",
            width: "100%",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-secondary)",
            background: "transparent",
            transition: "var(--transition)",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--glass-hover)";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <LogOut size={18} style={{ opacity: 0.8 }} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
