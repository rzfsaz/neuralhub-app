"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/auth/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
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
          Create your account
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>
          Start building with NeuralHub for free
        </p>
      </div>

      <div
        className="apple-glass"
        style={{
          borderRadius: "var(--radius-xl)",
          padding: "28px",
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User size={14} />}
            required
          />
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
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={14} />}
            minLength={8}
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
            Create Account
          </Button>
        </form>

        <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "16px", lineHeight: 1.5 }}>
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-tertiary)", marginTop: "20px" }}>
        Already have an account?{" "}
        <Link
          href="/auth/login"
          style={{
            color: "var(--accent-mid)",
            fontWeight: 500,
            transition: "var(--transition)",
          }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
