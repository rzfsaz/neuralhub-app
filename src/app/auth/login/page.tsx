"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Github, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Lazy-load next-auth/react to avoid localStorage SSR crash
async function signInDynamic(...args: Parameters<typeof import("next-auth/react")["signIn"]>) {
  const { signIn } = await import("next-auth/react");
  return signIn(...args);
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signInDynamic("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div
      className="animate-fadeIn"
      style={{
        width: "100%",
        maxWidth: "420px",
        padding: "0 20px",
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <Logo size={48} />
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "6px" }}>
          Welcome back
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>
          Sign in to your NeuralHub account
        </p>
      </div>

      <div
        className="apple-glass"
        style={{
          borderRadius: "var(--radius-xl)",
          padding: "28px",
        }}
      >
        {/* OAuth buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          <Button
            variant="outline"
            size="lg"
            icon={<Github size={16} />}
            onClick={() => signInDynamic("github", { callbackUrl })}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Continue with GitHub
          </Button>
          <Button
            variant="outline"
            size="lg"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            }
            onClick={() => signInDynamic("google", { callbackUrl })}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Continue with Google
          </Button>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            or
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={14} />}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={14} />}
            required
          />

          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--error-soft)",
                borderRadius: "var(--radius-md)",
                fontSize: "12px",
                color: "var(--error)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            icon={<ArrowRight size={16} />}
            style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}
          >
            Sign In
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-tertiary)", marginTop: "20px" }}>
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          style={{
            color: "var(--accent-mid)",
            fontWeight: 500,
            transition: "var(--transition)",
          }}
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="animate-spin" style={{ width: "24px", height: "24px", border: "2px solid var(--border)", borderTopColor: "var(--accent-start)", borderRadius: "50%" }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
