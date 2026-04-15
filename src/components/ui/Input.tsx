"use client";

import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, style, ...props }, ref) => {
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
        <div style={{ position: "relative" }}>
          {icon && (
            <span
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-tertiary)",
                display: "flex",
                pointerEvents: "none",
              }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            style={{
              width: "100%",
              height: "40px",
              padding: icon ? "0 14px 0 38px" : "0 14px",
              background: "var(--bg-surface)",
              border: `1px solid ${error ? "var(--error)" : "var(--border)"}`,
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontSize: "13px",
              transition: "var(--transition)",
              outline: "none",
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
        </div>
        {error && (
          <span style={{ fontSize: "11px", color: "var(--error)" }}>{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
