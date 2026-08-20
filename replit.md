# ShieldAI

ShieldAI helps people triage suspicious messages, emails, and URLs with explainable risk analysis.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/shieldai/src/App.tsx` — frontend routes and workspace UI
- `artifacts/shieldai/src/index.css` — visual tokens and responsive styling
- `artifacts/api-server/src/services/analyzer.ts` — deterministic threat rules
- `lib/api-spec/openapi.yaml` — API contract source of truth

## Architecture decisions

- Follow the existing pnpm React/Vite + Express workspace rather than introducing a second runtime.
- Use OpenAPI-generated React Query hooks for the frontend/API boundary.
- Keep the analyzer pure and deterministic so a future ML provider can replace it behind the same response shape.
- Store only short previews in the current in-process history; raw scan content is not persisted.

## Product

- Public landing page and product education pages
- Message, URL, and email threat scanner
- Dashboard risk distribution and recent activity
- Searchable analysis history

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
