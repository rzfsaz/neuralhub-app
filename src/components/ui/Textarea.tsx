"use client";

import React, { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, style, ...props }, ref) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {label && (
          <label
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--text-secondary)",
              letterSpacing: "0.02em",
            }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "12px 14px",
            background: "var(--bg-surface)",
            border: `1px solid ${error ? "var(--error)" : "var(--border)"}`,
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontSize: "13px",
            lineHeight: 1.6,
            transition: "var(--transition)",
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
            ...style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = error ? "var(--error)" : "var(--accent-start)";
            e.target.style.boxShadow = `0 0 0 3px ${error ? "var(--error-soft)" : "var(--accent-glow)"}`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? "var(--error)" : "var(--border)";
            e.target.style.boxShadow = "none";
          }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: "11px", color: "var(--error)" }}>{error}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
