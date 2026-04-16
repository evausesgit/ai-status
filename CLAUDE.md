# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (all workspaces)
pnpm install

# Start infrastructure (PostgreSQL on 5433, Redis on 6379)
docker compose up -d postgres redis

# Run DB migrations
DATABASE_URL=postgresql://aistatus:aistatus@localhost:5433/aistatus pnpm --filter @ai-status/db migrate

# Regenerate migrations after schema changes
DATABASE_URL=postgresql://aistatus:aistatus@localhost:5433/aistatus pnpm --filter @ai-status/db generate

# Start API (port 3001)
node_modules/.bin/dotenv -e .env -- node_modules/.bin/tsx apps/api/src/index.ts

# Start worker
node_modules/.bin/dotenv -e .env -- node_modules/.bin/tsx apps/worker/src/index.ts

# Start web dashboard (port 3000)
cd apps/web && node_modules/.bin/next dev --port 3000

# Typecheck a specific package
pnpm --filter @ai-status/db typecheck
pnpm --filter @ai-status/api typecheck
```

## Architecture

Monorepo with pnpm workspaces. Three apps, two shared packages.

```
packages/db        — Drizzle ORM schema + PostgreSQL client (CommonJS, no "type":"module")
packages/checkers  — HTTP and chat_completion check runners (CommonJS)
apps/api           — Fastify REST API (CommonJS, no top-level await)
apps/worker        — BullMQ scheduler that polls models on a cron (CommonJS)
apps/web           — Next.js 15 dashboard with Server Components
config/providers.yml — Single source of truth for what gets monitored
```

### Data flow

1. `config/providers.yml` defines providers and models with their check config
2. On startup, the **worker** reads the YAML, upserts providers/models into PostgreSQL, then schedules a BullMQ repeat job per model
3. Each job runs a **checker** (HTTP ping or chat_completion call) and writes a row to `checks` + aggregates into `uptime_hourly`
4. The **API** reads from PostgreSQL and exposes `/status`, `/uptime/:modelId`, `/incidents`
5. The **web** fetches from the API at build/request time (Next.js `revalidate: 30`)

### Key schema tables

- `providers` / `models` — seeded from YAML on every worker start
- `checks` — raw check results (one row per execution)
- `uptime_hourly` — pre-aggregated hourly uptime (used for 90-day bar chart)
- `incidents` + `incident_updates` — manual or auto-detected incidents

### Check types

`CheckConfig` is a discriminated union in `packages/db/src/schema/providers.ts`:
- `http` — generic HTTP request with expected status code
- `chat_completion` — sends `{"messages":[{"role":"user","content":"ping"}],"max_tokens":1}` to an OpenAI-compatible endpoint; auto-detects Anthropic API and adjusts headers accordingly

### Module system

All backend packages use **CommonJS** (no `"type":"module"`). This is intentional: drizzle-kit requires CJS-resolvable imports (no `.js` extension on relative imports). The web app is standard Next.js (ESM handled by Next internally).

### Environment variables

Copy `.env.example` to `.env`. The worker reads `CONFIG_PATH` to locate `providers.yml`. Env vars referenced in YAML headers (e.g. `${ANTHROPIC_API_KEY}`) are resolved at runtime from `process.env`.

### Adding a new check type

1. Add a new config type to the `CheckConfig` union in `packages/db/src/schema/providers.ts`
2. Create `packages/checkers/src/<type>.ts` implementing `CheckResult`
3. Add the case in `packages/checkers/src/index.ts`
4. The `config satisfies never` exhaustiveness check will catch missing cases at compile time
