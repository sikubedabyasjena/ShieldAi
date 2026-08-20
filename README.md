# ShieldAI

ShieldAI is an explainable threat-triage workspace for suspicious messages, email content, and URLs. It turns deterministic security signals into a risk score, classification, evidence, and recommended next steps.

## What is included

- Responsive ShieldAI web application at `/`
- Scanner for message, URL, and email content
- Deterministic weighted threat-analysis engine
- Dashboard metrics, risk distribution, and recent activity
- Searchable analysis history
- Product, methodology, and capability pages
- Typed OpenAPI contract and generated React Query client
- Express API service with validation, CORS configuration, and health check

## Run locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
# in another terminal
pnpm --filter @workspace/shieldai run dev
```

The managed workflows provide the required `PORT` and `BASE_PATH` values. The browser app calls the API through the shared `/api` path.

## API

- `GET /api/healthz`
- `POST /api/analyze` with `{ "type": "text|url|email", "content": "..." }`
- `GET /api/history`
- `GET /api/dashboard`

The analyzer is intentionally modular. Replace `services/analyzer.ts` with an ML/LLM-backed implementation later without changing the frontend contract.

## Environment

API:

```env
DATABASE_URL=
CORS_ORIGINS=http://localhost:3000
```

Frontend:

```env
VITE_API_URL=/api
```

No secrets are committed.

## Validation

```bash
pnpm run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/shieldai run typecheck
PORT=26093 BASE_PATH=/ pnpm --filter @workspace/shieldai run build
curl http://localhost:80/api/healthz
```

## Architecture note

The supplied workspace is a pnpm + React/Vite + Express + Drizzle monorepo, so ShieldAI follows those existing conventions rather than introducing a second Next.js/Python runtime. The first release keeps scan history in the API process so it is immediately runnable; persistent PostgreSQL history and managed authentication are the next production hardening step.