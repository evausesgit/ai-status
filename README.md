# AI Status

Open-source status monitoring for AI providers and models.

Monitor availability, latency, and incidents for any AI API — your own or third-party providers (Anthropic, OpenAI, Mistral, etc.).

## Features

- **Real-time status** per provider and model
- **90-day uptime history** with hourly aggregation
- **Incident management** (auto-detected + manual)
- **Two check types**: simple HTTP health check or real chat_completion call
- **Env variable interpolation** in headers — keep API keys out of config
- **Self-hostable** via Docker Compose
- **REST API** to integrate status into your own tools

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-org/ai-status
cd ai-status

# 2. Configure your providers
cp config/providers.yml.example config/providers.yml
# Edit config/providers.yml with your endpoints

# 3. Set your secrets
cp .env.example .env
# Edit .env (DATABASE_URL, REDIS_URL, API_SECRET, your API keys)

# 4. Start everything
docker compose up -d

# 5. Run migrations
docker compose exec api pnpm db:migrate
```

Dashboard: http://localhost:3000  
API: http://localhost:3001

## Configuration

Edit `config/providers.yml`:

```yaml
providers:
  - name: MyCompany AI
    slug: mycompany
    models:
      - id: my-model-v1
        name: MyModel v1
        check:
          type: chat_completion
          endpoint: https://api.mycompany.com/v1/chat/completions
          headers:
            Authorization: "Bearer ${MY_API_KEY}"   # reads from .env
          model: my-model-v1
          intervalSeconds: 60
          timeoutMs: 10000
          latencyWarnMs: 2000
          latencyCriticalMs: 5000
```

### Check types

| Type | Use case |
|------|----------|
| `http` | Simple health endpoint (`GET /health`) |
| `chat_completion` | Real OpenAI-compatible API call |

### Status values

| Status | Meaning |
|--------|---------|
| `operational` | All good |
| `degraded` | High latency but responding |
| `partial_outage` | Intermittent failures |
| `major_outage` | Not responding |
| `unknown` | No check yet |

## API

```
GET  /status                      Current status of all providers
GET  /uptime/:modelId?days=90     Hourly uptime history
GET  /checks/:modelId?limit=50    Raw check results
GET  /incidents                   Open incidents
GET  /incidents/:id               Incident detail with timeline
POST /incidents                   Create incident (requires X-Api-Secret)
POST /incidents/:id/updates       Add update to incident
```

## Architecture

```
ai-status/
├── apps/
│   ├── web/        Next.js dashboard
│   ├── api/        Fastify REST API
│   └── worker/     BullMQ check scheduler
├── packages/
│   ├── db/         Drizzle schema + PostgreSQL client
│   └── checkers/   HTTP + chat_completion check runners
└── config/
    └── providers.yml   Your provider configuration
```

## Adding a new check type

Create `packages/checkers/src/my-check.ts` implementing `CheckResult`, export it from `index.ts`, and add the type to `CheckConfig` in `packages/db/src/schema/providers.ts`.

## License

MIT
