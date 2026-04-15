"use client";

import React from "react";

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: number;
}

export function Avatar({ name, src, size = 36 }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "avatar"}
        style={{
          width: size,
          height: size,
          borderRadius: "var(--radius-full)",
          objectFit: "cover",
          border: "2px solid var(--border)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-full)",
        background: "linear-gradient(135deg, var(--accent-start), var(--accent-mid))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 600,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
