"use client";

import React from "react";

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface ProviderPieProps {
  data: Slice[];
  size?: number;
  title?: string;
}

export function ProviderPie({ data, size = 160, title }: ProviderPieProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let cumulativePercent = 0;

  // Build conic-gradient stops
  const stops = data
    .map((d) => {
      const start = cumulativePercent;
      const end = cumulativePercent + (d.value / total) * 100;
      cumulativePercent = end;
      return `${d.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div>
      {title && (
        <h4 style={{ fontSize: "13px", fontWeight: 500, marginBottom: "16px", color: "var(--text-secondary)" }}>
          {title}
        </h4>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {/* Donut */}
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: data.length > 0
              ? `conic-gradient(${stops})`
              : "var(--bg-surface)",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: size * 0.2,
              borderRadius: "50%",
              background: "var(--bg-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: 700 }}>
              {total.toLocaleString()}
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
              requests
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "3px",
                  background: d.color,
                  flexShrink: 0,
                }}
              />
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {d.label}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)", marginLeft: "6px" }}>
                  {((d.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
