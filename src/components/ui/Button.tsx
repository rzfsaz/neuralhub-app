"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: 500,
    borderRadius: "var(--radius-md)",
    transition: "var(--transition)",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.5 : 1,
    whiteSpace: "nowrap",
    border: "1px solid transparent",
    position: "relative",
    overflow: "hidden",
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: "12px", height: "32px" },
    md: { padding: "8px 16px", fontSize: "13px", height: "38px" },
    lg: { padding: "10px 24px", fontSize: "14px", height: "44px" },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, var(--accent-start), var(--accent-mid))",
      color: "#fff",
      boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
    },
    secondary: {
      background: "var(--bg-surface)",
      color: "var(--text-primary)",
      border: "1px solid var(--border)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
    },
    danger: {
      background: "var(--error-soft)",
      color: "var(--error)",
      border: "1px solid rgba(239,68,68,0.2)",
    },
    outline: {
      background: "transparent",
      color: "var(--text-primary)",
      border: "1px solid var(--border)",
    },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{ ...baseStyle, ...sizeStyles[size], ...variantStyles[variant], ...style }}
      {...props}
    >
      {loading && (
        <span
          className="animate-spin"
          style={{
            width: "14px",
            height: "14px",
            border: "2px solid transparent",
            borderTopColor: "currentColor",
            borderRadius: "50%",
            display: "inline-block",
          }}
        />
      )}
      {!loading && icon}
      {children}
    </button>
  );
}
