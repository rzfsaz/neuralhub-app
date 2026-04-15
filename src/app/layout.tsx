import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuralHub · AI SaaS Platform",
  description: "Production-grade multi-provider AI platform. Execute prompts across Anthropic, OpenAI, and Google Gemini with unified billing, usage tracking, and API management.",
  keywords: ["AI", "SaaS", "LLM", "Anthropic", "OpenAI", "Gemini", "API"],
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
