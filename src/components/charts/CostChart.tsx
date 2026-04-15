"use client";

import React from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface CostChartProps {
  data: DataPoint[];
  height?: number;
  title?: string;
}

export function CostChart({ data, height = 160, title }: CostChartProps) {
  const max = Math.max(...data.map((d) => d.value), 0.01);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
            {title}
          </h4>
          <span style={{ fontSize: "18px", fontWeight: 700 }}>
            ${total.toFixed(2)}
          </span>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const colors = [
            "var(--accent-start)",
            "var(--accent-mid)",
            "var(--success)",
            "var(--warning)",
            "var(--info)",
            "var(--anthropic)",
          ];
          const color = colors[i % colors.length];

          return (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{d.label}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, fontFamily: "monospace" }}>
                  ${d.value.toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  borderRadius: "3px",
                  background: "var(--bg-surface)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    borderRadius: "3px",
                    background: color,
                    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
