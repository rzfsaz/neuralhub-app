"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
  padding?: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  hover = false,
  glow = false,
  padding = "20px",
  style,
  className,
  onClick,
}: CardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
      style={{
        background: isHovered ? "var(--glass-hover)" : "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-lg)",
        padding,
        transition: "var(--transition)",
        cursor: onClick ? "pointer" : "default",
        backdropFilter: "blur(12px)",
        ...(glow && {
          boxShadow: isHovered ? "var(--shadow-glow)" : "none",
        }),
        ...(isHovered && hover && {
          borderColor: "var(--border-hover)",
          transform: "translateY(-1px)",
        }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Stat card variant
interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

export function StatCard({ label, value, change, changeType = "neutral", icon }: StatCardProps) {
  const changeColors = {
    positive: "var(--success)",
    negative: "var(--error)",
    neutral: "var(--text-tertiary)",
  };

  return (
    <Card hover glow>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "8px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {label}
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {value}
          </p>
          {change && (
            <p style={{ fontSize: "12px", color: changeColors[changeType], marginTop: "8px", fontWeight: 500 }}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-glow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-start)",
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
