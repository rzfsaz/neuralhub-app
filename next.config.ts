import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Server External Packages ────────────────────────────────────────────────
  serverExternalPackages: [
    "@anthropic-ai/sdk",
    "@google/generative-ai",
    "openai",
    "bcryptjs",
    "ioredis",
  ],

  // ── Experimental ──────────────────────────────────────────────────────────
  experimental: {},

  // ── Security Headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",          value: "DENY"                            },
          { key: "X-Content-Type-Options",   value: "nosniff"                         },
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",       value: "camera=(), microphone=()"        },
          {
            key:   "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key:   "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "frame-src https://js.stripe.com",
              "connect-src 'self' https://api.stripe.com https://*.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com",
            ].join("; "),
          },
        ],
      },

      // SSE routes — must not be cached
      {
        source:  "/api/prompts",
        headers: [
          { key: "Cache-Control",   value: "no-store, no-cache, must-revalidate" },
          { key: "X-Accel-Buffering", value: "no" },
        ],
      },

      // Stripe webhook — raw body needed
      {
        source: "/api/billing/webhook",
        headers: [
          { key: "x-no-body-parse", value: "1" },
        ],
      },
    ];
  },

  // ── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      { source: "/",        destination: "/dashboard", permanent: false },
      { source: "/login",   destination: "/auth/login",  permanent: true  },
      { source: "/signup",  destination: "/auth/signup", permanent: true  },
    ];
  },

  // ── Image domains ─────────────────────────────────────────────────────────
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"],
  },

  // ── Bundle analysis ───────────────────────────────────────────────────────
  ...(process.env.ANALYZE === "true" && {
    webpack(config: { plugins: unknown[] }) {
      const { BundleAnalyzerPlugin } = require("@next/bundle-analyzer")();
      config.plugins.push(new BundleAnalyzerPlugin());
      return config;
    },
  }),
};

export default nextConfig;
