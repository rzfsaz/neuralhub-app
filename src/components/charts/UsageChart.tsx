"use client";

import React from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface UsageChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  title?: string;
}

export function UsageChart({ data, height = 200, color = "var(--accent-start)", title }: UsageChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div>
      {title && (
        <h4 style={{ fontSize: "13px", fontWeight: 500, marginBottom: "16px", color: "var(--text-secondary)" }}>
          {title}
        </h4>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "3px",
          height,
          padding: "0 0 24px",
          position: "relative",
        }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <div
            key={pct}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: `${pct * (height - 24) + 24}px`,
              borderBottom: "1px solid var(--border)",
              opacity: 0.3,
            }}
          />
        ))}

        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                title={`${d.label}: ${d.value.toLocaleString()}`}
                style={{
                  width: "100%",
                  maxWidth: "32px",
                  height: `${Math.max(pct, 2)}%`,
                  background: `linear-gradient(180deg, ${color}, ${color}88)`,
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.8";
                  e.currentTarget.style.boxShadow = `0 0 12px ${color}44`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <span
                style={{
                  fontSize: "9px",
                  color: "var(--text-muted)",
                  position: "absolute",
                  bottom: "0",
                  whiteSpace: "nowrap",
                  transform: "translateY(100%)",
                }}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
