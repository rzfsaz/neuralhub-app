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

## Panduan Pemasangan (Instalasi)

NeuralHub berjalan menggunakan **PostgreSQL**, **Redis**, dan **Node.js** di belakang layar. Ikuti panduan ini sesuai sistem operasi Anda:

### 1. Kebutuhan Sistem (Prerequisites)
- [Node.js 24 LTS+](https://nodejs.org/en) – Dibutuhkan untuk menjalankan framework server UI.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) – Untuk menyalakan Database secara instan, pastikan aplikasi ini menyala di latar belakang komputer Anda!

### 2. Unduh & Persiapkan (Mac / Windows)

Buka aplikasi **Terminal** (di macOS) atau **Git Bash / PowerShell** (di Windows) lalu jalankan:

```bash
# Clone repository
git clone https://github.com/rzfsaz/neuralhub-app.git
cd neuralhub-app

# Install dependencies (packages)
npm install
```

### 3. Konfigurasi Rahasia (Environment)
Anda harus membuat file konfigurasi `.env.local`:

**Di macOS:**
```bash
cp .env.example .env.local
```
**Di Windows (PowerShell):**
```powershell
Copy-Item .env.example .env.local
```
*Catatan: Isi nilai-nilai API Key di dalam `.env.local` (*misalnya kredensial Stripe/OpenAI, dll*).*

### 4. Nyalakan Database Induk (Semua OS)

Pastikan aplikasi **Docker Desktop** sudah dibuka dan logo pausnya berwarna hijau! Lalu eksekusi:

```bash
docker compose -f docker/docker-compose.yml up -d
```
*(Perintah ini akan secara otomatis mengunduh & menyalakan PostgreSQL dan Redis di memori mesin Anda secara tersembunyi/daemon)*.

### 5. Bangun Pondasi & Jalankan (Run)

Tarik skema database Prisma dan luncurkan aplikasi Desktop server Anda:

```bash
# Eksekusi migrasi tabel awal
npx prisma db push

# Menjalankan server aplikasi NeuralHub
npm run dev
```

Selamat! 🚀 Aplikasi sekarang bisa diakses di peramban web pada alamat `http://localhost:3000` atau Anda bisa menggunakan _Shortcut Mac App_ khusus yang otomatis kita buat!

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
