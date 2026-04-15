# NeuralHub

A production-grade AI SaaS platform built with Next.js 15, Node.js, PostgreSQL, Redis, and Stripe.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App Router                 │
│  ┌───────────────┐   ┌───────────────────────────┐  │
│  │  Frontend UI  │   │   API Routes (/api/*)      │  │
│  │  (React 19)   │   │   Auth · Prompts · Usage   │  │
│  └───────────────┘   └──────────────┬────────────┘  │
└─────────────────────────────────────│───────────────┘
                                      │
         ┌────────────────────────────┼─────────────────┐
         │                            │                  │
  ┌──────▼──────┐           ┌─────────▼──────┐   ┌──────▼──────┐
  │  PostgreSQL │           │     Redis       │   │   Stripe    │
  │  (Prisma)   │           │  Cache + Rate   │   │  Billing    │
  │             │           │  Limit + Queue  │   │             │
  └─────────────┘           └────────────────┘   └─────────────┘
         │
  ┌──────▼──────────────────────────────────────────────┐
  │              AI Provider Abstraction Layer           │
  │  ┌───────────┐  ┌───────────┐  ┌─────────────────┐  │
  │  │ Anthropic │  │  OpenAI   │  │  Google Gemini  │  │
  │  │  Claude   │  │  GPT-4o   │  │  1.5 Pro/Flash  │  │
  │  └───────────┘  └───────────┘  └─────────────────┘  │
  └─────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Prerequisites
- Node.js 20+
- Docker & Docker Compose
- pnpm (recommended) or npm

### 2. Clone & Install

```bash
git clone https://github.com/yourorg/neuralhub
cd neuralhub
pnpm install
```

### 3. Environment Setup

```bash
cp .env.example .env.local
# Fill in your values (see comments in .env.example)

# Generate encryption master key
openssl rand -hex 32  # → paste as ENCRYPTION_MASTER_KEY

# Generate NextAuth secret
openssl rand -base64 32  # → paste as NEXTAUTH_SECRET
```

### 4. Start Infrastructure

```bash
# Start PostgreSQL + Redis
docker compose -f docker/docker-compose.yml up -d

# Optional: start PgAdmin + RedisInsight
docker compose -f docker/docker-compose.yml --profile tools up -d
```

### 5. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with model pricing data
pnpm db:seed
```

### 6. Run Dev Server

```bash
pnpm dev
# → http://localhost:3000
```

## Project Structure

```
neuralhub/
├── prisma/
│   ├── schema.prisma          # Full data model
│   └── seed.ts                # Model config + pricing seed
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── prompts/       # POST (execute), GET (history)
│   │   │   ├── projects/      # CRUD
│   │   │   ├── usage/         # Aggregated analytics
│   │   │   ├── billing/       # Checkout, portal, webhook
│   │   │   ├── apikeys/       # Generate, list, revoke
│   │   │   └── providers/     # Connect, test, rotate keys
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── prompts/
│   │   ├── usage/
│   │   ├── billing/
│   │   └── settings/
│   │
│   ├── components/
│   │   ├── ui/                # Button, Input, Card, Badge...
│   │   ├── charts/            # UsageChart, CostChart, ProviderPie
│   │   └── layout/            # Sidebar, Topbar, Shell
│   │
│   └── lib/
│       ├── ai/
│       │   ├── providers.ts   # ← Multi-provider abstraction
│       │   └── execution.ts   # ← Prompt runner + token tracking
│       ├── auth/
│       │   ├── middleware.ts  # ← API key + session auth
│       │   └── options.ts     # NextAuth config
│       ├── billing/
│       │   └── stripe.ts      # ← Stripe integration
│       ├── cache/
│       │   └── redis.ts       # ← Redis client + rate limiter
│       ├── crypto/
│       │   └── aes.ts         # ← AES-256-GCM key encryption
│       └── db/
│           └── prisma.ts      # ← Prisma singleton
│
└── docker/
    └── docker-compose.yml     # PostgreSQL + Redis
```

## Key Features

### Multi-Provider AI Abstraction
Every provider (Anthropic, OpenAI, Google) implements the same `AIProviderClient` interface. Adding a new provider requires only implementing `complete()`, `stream()`, `listModels()`, and `validateKey()`.

```typescript
const client = createProvider(AIProvider.ANTHROPIC, apiKey);

// Batch
const result = await client.complete({ model, messages });

// Streaming
for await (const chunk of client.stream({ model, messages, stream: true })) {
  if (chunk.type === "delta") process.stdout.write(chunk.delta!);
}
```

### Token Tracking & Cost Calculation
Every prompt run records exact token counts. Cost is calculated using a configurable pricing table (`MODEL_PRICING`). Usage is aggregated daily and monthly in two Postgres tables (`usage_daily`, `usage_monthly`) via a single transaction — consistent and fast to query.

### AES-256-GCM Key Encryption
Provider API keys are never stored in plaintext. The master encryption key lives only in the environment:

```typescript
const encrypted = encryptKey(userApiKey);   // stored in DB
const plaintext = decryptKey(encrypted);    // only at call time, cached 5min
```

### Sliding-Window Rate Limiting
Atomic Lua script in Redis prevents thundering-herd abuse without a distributed lock.

### Stripe Billing
Full subscription lifecycle via webhooks:
- `checkout.session.completed` → upgrade plan + set token/cost limits
- `customer.subscription.updated` → handle plan changes
- `customer.subscription.deleted` → downgrade to Free

## API Reference

### Execute a prompt
```bash
curl -X POST https://api.neuralhub.dev/api/prompts \
  -H "Authorization: Bearer nhub_sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "ANTHROPIC",
    "model": "claude-sonnet-4-6",
    "userPrompt": "Summarize this in 3 bullet points: ...",
    "stream": false
  }'
```

### Stream a response
```bash
curl -X POST https://api.neuralhub.dev/api/prompts \
  -H "Authorization: Bearer nhub_sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{ "provider": "OPENAI", "model": "gpt-4o", "userPrompt": "...", "stream": true }' \
  --no-buffer
```

## Production Checklist

- [ ] Set `ENCRYPTION_MASTER_KEY` in your secrets manager (never in source)
- [ ] Configure PgBouncer for connection pooling (`DATABASE_URL` → pooler URL)
- [ ] Set Redis `maxmemory-policy allkeys-lru` and persistence
- [ ] Register Stripe webhook endpoint for `/api/billing/webhook`
- [ ] Configure Sentry DSN for error monitoring
- [ ] Set up pg_cron (or Inngest) for `usage_daily/monthly` rollup jobs
- [ ] Enable Row Level Security on the `users` table if using Supabase
- [ ] Rate limit `/api/prompts` by user plan tier

## License
MIT
