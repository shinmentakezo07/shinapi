# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yapapa (DRA Platform) is a Universal LLM Gateway: an OpenRouter-style platform that proxies AI requests to OpenAI, Anthropic, Gemini, Groq, NVIDIA NIM, and other model providers. Monorepo with a Next.js 16 frontend and a Go 1.25 backend.

## Quick Start

```bash
npm install
cp apps/web/.env.local.example apps/web/.env.local
cp apps/backend/.env.example apps/backend/.env
bash scripts/dev.sh   # Installs deps, starts Postgres + Redis, pushes schema, seeds, launches both apps
```

Services: Frontend `:3000`, Backend `:8080`, Postgres `:5432`, Redis `:6379`.

## Common Commands

### Root

```bash
npm run dev          # Start both apps via Turborepo
npm run build        # Build all workspaces
npm run lint         # Run workspace lint tasks
npm run format       # Prettier on TS/TSX/MD
npm run test         # Run all tests
npm run test:web     # Frontend tests only
npm run test:backend # Backend tests only
```

### Frontend (`apps/web`)

```bash
npm run dev          # Next.js dev server on :3000
npm run build        # Production build
npm run lint         # next lint
npm run test         # Vitest run
npm run test:watch   # Vitest watch mode
npm run db:push      # Push Drizzle schema
npm run db:seed      # Seed demo data
npm run db:setup     # Push schema then seed
npm run test -- --run tests/lib/api/sdk.test.ts  # Run one Vitest file
```

### Backend (`apps/backend`)

```bash
make build             # go build -o api ./cmd/api
make dev               # go run ./cmd/api
make test              # go test -race -cover on packages with tests
make test-unit         # go test -v -short ./... (skips integration)
make test-integration  # Handler + integration tests; requires TEST_DATABASE_URL
make test-coverage     # Write coverage.out and print summary
make vet               # go vet ./...
make lint              # go vet + staticcheck if installed
make fmt               # go fmt + goimports if installed

go test -race -cover ./pkg/llm/provider/...            # Run one Go package
go test -race -cover -run TestName ./pkg/llm/tools/... # Run one Go test
```

### Full-stack scripts

```bash
bash scripts/dev.sh          # Install deps, start Postgres, push schema, seed DB, start both apps
bash scripts/dev.sh --check  # Dependency and environment check only
bash scripts/dev.sh --logs   # Show logs from the last dev.sh run
bash scripts/smoke-test.sh   # Wiring verification after significant changes
```

### Docker

```bash
docker compose up -d postgres        # Start local Postgres only
docker-compose --profile mongo up -d  # Start Postgres + Mongo profile
```

## Architecture

### Monorepo structure

- `apps/web`: Next.js 16 canary frontend — App Router, React 19, Tailwind CSS v4, NextAuth v5, Drizzle, React Query.
- `apps/backend`: Go 1.25 API — chi, pgx, JWT/API-key auth, layered service/repository architecture.
- Root `package.json` workspaces include `packages/*`, but no `packages/` directory is checked in yet.
- `scripts/dev.sh`: Full-stack launcher (deps, Postgres, schema, seed, both apps).
- `scripts/smoke-test.sh`: Repo-specific wiring audit (dashboard mock data, SDK imports, route coverage, SSE wiring).
- `AGENTS.md`, `apps/web/AGENTS.md`, `apps/backend/AGENTS.md`, `apps/backend/pkg/llm/AGENTS.md`: App/layer guidance.
- `ops.md`: Operational debt and known issues (P0–P3). Canonical source for "what's broken or missing."
- `osa.md` / `FIXES_APPLIED.md`: Security and bug-audit history.
- `UPDATE.md`: Mandatory per-change log — append an entry for every edit (see Hard Constraints).

### Frontend architecture

- **Next.js 16 canary is NOT your training data.** Breaking changes from v14/15 — APIs, conventions, and file structure differ. Read `node_modules/next/dist/docs/` before writing any code and heed deprecation notices. `"use cache"` replaces old `revalidate`/`dynamic` — implicit caching is gone. `fetch()` is no longer cached by default.
- **App Router routes**: Product/auth surfaces — `app/dashboard/` (protected), `app/playground/`, `app/pricing/`, `app/models/`, `app/gateway/`, `app/admin/`, `app/login/`, `app/signup/`, `app/docs/`, `app/forgot-password/`, `app/enterprise/`, `app/status/`. Marketing/shell surfaces — `app/about/`, `app/blog/`, `app/changelog/`, `app/contact/`, `app/legal/`, `app/roadmap/`. API routes in `app/api/*` proxy to Go backend through `lib/api/proxy.ts`.
- **Auth**: NextAuth v5 in `auth.ts`/`auth.config.ts`. JWT HS256 secrets must match the backend. OAuth: GitHub + Google. Fallback: `AUTH_SECRET || NEXTAUTH_SECRET`.
- **Proxy middleware** (`proxy.ts`): redirects unauthenticated `/dashboard/*` to login, authenticated `/login`/`/signup` to dashboard.
- **Dashboard is SDK-driven.** Components use `getSDK()` / `DraSDK` from `lib/api/sdk.ts`. `tests/wiring-verification.test.ts` enforces no mock data.
- **Data fetching**: `lib/api/hooks.ts` wraps the SDK with React Query. Prefer the SDK and hooks layer over direct `fetch()` from UI components.
- **Drizzle** schema in `db/schema.ts`. Uses `@neondatabase/serverless` against both cloud Neon and local Postgres.
- **`next.config.ts` has `typescript: { ignoreBuildErrors: true }`** — `next build` will NOT catch type errors. Use `tsc --noEmit` or the LSP for type checking.
- **Admin panel** (`app/admin/`) uses a separate auth flow from the main NextAuth dashboard. The first-time admin bootstrap is handled by `internal/handler/setup.go` (exposes `GET /api/setup/status` and `POST /api/setup/bootstrap` when no admin exists).
- **Styling**: Tailwind CSS v4 — CSS-first config (`globals.css @theme`), NOT `tailwind.config.ts`. Uses `cva` + `tailwind-merge` for variants.
- **Charts**: Recharts. **Animations**: Framer Motion (components) + GSAP (scroll-triggered).
- **Frontend API layer** (`lib/api/`): `sdk.ts` (~2240 lines, typed client), `admin-sdk.ts` (admin endpoints), `hooks.ts` (~900 lines, React Query wrappers), `errors.ts`, `proxy.ts`, `types.ts`, `key-auth.ts`, `rate-limit.ts`, `require-auth.ts`.
- **Legacy SDK**: backend `pkg/llmsdk/` — avoid for new code.

### Backend architecture

- **Layered**: `cmd/api/main.go` → `internal/handler/` → `internal/service/` → `internal/repository/` → `internal/domain/`. Handlers own HTTP only; services own business logic (never import `net/http`); repositories own raw SQL (all parameterized via pgx).
- **Route registration**: `cmd/api/main.go` (server setup, metrics), `cmd/api/routes.go` (~475 lines, all route definitions with middleware), `cmd/api/services.go` (~494 lines, dependency injection via `initServices()`).
- **Standard API responses** via `internal/pkg/response` — consistent envelope: `success`, `data`, `error`, optional `meta`.
- **Errors** flow through `domain.AppError`, not ad-hoc HTTP errors. Admin handlers use `adminError()` / `adminErrorWithStatus()` from `admin_errors.go` — logs full error, returns generic message to client (never leak `err.Error()` directly).
- **Middleware** (`internal/middleware/`, 14 files): JWT/API-key auth, rate limiting, quota (in-memory + Redis), request logging, tracing, metrics, body limits, token blacklist, transform.
- **Three auth modes**: `Authorization: Bearer <jwt>`, `authjs.session-token` cookie, `x-api-key`.
- **Go module path**: `dra-platform/backend`.
- **Raw SQL migrations** in `migrations/`, numbered `001_*.sql`–`025_*.sql` (some numbers collide / are disabled, e.g. `022_enterprise_features.sql.disabled`, dual `008_*`, `022_*`, `024_*`). Hand-applied, no auto-migrator.
- **First-time admin bootstrap** via `internal/handler/setup.go` (`SetupHandler`). Exposes unauthenticated `GET /api/setup/status` and `POST /api/setup/bootstrap` when no admin exists. Gated by `service.SetupService` / `repository.ErrFirstAdminAlreadyExists`.
- **Key internal packages**: `config/` (env-based config loader), `db/` (pgx pool + auto-migrate/seed + SQLite lite schema), `middleware/`, `pkg/logger/` (slog), `pkg/response/`, `pkg/token/` (JWT), `testutil/` (integration test harness with `NewTestServer()`).

### LLM gateway architecture

- OpenAI-compatible proxy (`/v1/chat/completions`, `/v1/embeddings`, `/v1/models`) built on `pkg/llm/`.
- 10-stage pipeline: **validator → router → cache → guardrails → moderation → translator → provider → telemetry → circuit breaker → watcher**. Orchestrated by `pkg/llm/pipeline/pipeline.go`. Full map in `apps/backend/pkg/llm/AGENTS.md`.
- ~30 subpackages under `pkg/llm/` (not just the stage names): core stages (`provider/`, `router/`, `cache/`, `guardrails/`, `moderation/`, `translator/`, `pipeline/`, `validator/`, `circuitbreaker/`, `watcher/`, `openai/`, `anthropic/`, `tools/`) plus supporting packages (`embeddings/`, `batch/`, `tokens/`, `streaming/`, `loadbalancer/`, `budget/`, `registry/`, `virtualkeys/`, `security/`, `thinking/`, `ws/`, `otel/`, `usage/`, `audit/`, `credentials/`, `stores/`, `interfaces/`, `util/`, etc.). The package root (`pkg/llm/`) holds `types.go`, `helper.go`, and `llm_test.go` — there is no `sdk.go` facade at this level despite the old reference to one; entry points live in the per-stage subpackages and `pkg/sdk/` (the Go SDK) is a separate client.
- Anthropic compatibility at `/v1/messages` via `internal/handler/anthropic_messages.go` + `pkg/llm/anthropic/`, reusing the same auth/quota/billing pipeline. Streaming uses Anthropic SSE events (`message_start`, `content_block_delta`, `message_delta`, `message_stop`).
- Official Go SDKs: `github.com/openai/openai-go/v3`, `github.com/anthropics/anthropic-sdk-go`, `github.com/sashabaranov/go-openai`.
- `X-Sandbox: true` on `/v1/chat/completions` bypasses billing/quota/logging **only for admin callers**. Non-admins get `403 permission_error` — do not document or use sandbox as a free-usage escape hatch.

### Important architecture quirks

- `pkg/llm/provider/` is the canonical provider registry. Legacy `internal/provider/` was **eliminated** (2026-05-15 — see `ops.md` / `UPDATE.md`).
- **SDK parity matters.** Backend API changes need matching updates in Go SDK (`pkg/sdk/client.go`, ~1860 lines) then TypeScript SDK (`apps/web/lib/api/sdk.ts`, ~2240 lines), in that order.
- Webhook delivery: `pkg/webhook/` + `internal/service/webhook.go` + `internal/repository/webhook.go` (exponential backoff retry, DLQ, delivery logs).
- `pkg/email/` (SMTP), `pkg/trace/` (distributed tracing).
- Batch jobs, SSE notifications, uploads, telemetry, credits/billing, fine-tuning, and embeddings all have dedicated handlers/services — check for existing subsystems before adding parallel logic.
- `internal/pkg/` contains shared packages (`logger/`, `response/`, `token/`). Use these instead of rolling your own.

## Hard Constraints

- **UPDATE.md is MANDATORY.** After completing ANY code change (no matter how small), you MUST append an entry to `UPDATE.md` following the exact template defined in that file. The entry must include: timestamp, **session name/ID**, conventional-commit title, "Why" explanation, files-changed table with line ranges, and Before/After code blocks showing the exact old and new code. **No task is "done" until the UPDATE.md entry is written.** Use the same session name across all entries from the same session so later agents can group changes by session. This is non-negotiable — skipping this step is a violation of project rules.

**UPDATE.md Entry Template:**
```markdown
## [N]. [Short Title]

**Session**: [Session Name/ID]
**Date**: [YYYY-MM-DD HH:MM]

### Why
[Problem or motivation — not just what changed]

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| path/to/file.ts | L10-25 | modified |
| path/to/new.ts | L1-50 | created |

### Before
```code
// exact old code with file path and line number
```

### After
```code
// exact new code with file path and line number
```

### Notes
[Optional: side effects, follow-ups, migration steps]
```

- **No `as any` or `@ts-ignore`** in TypeScript — enforced at review
- **No mock data** in dashboard components — must use `getSDK()`. Enforced by `tests/wiring-verification.test.ts` and `scripts/smoke-test.sh`.
- **Zod v4** — breaking changes from v3. Do not use v3 patterns
- **Tailwind CSS v4** — PostCSS plugin `@tailwindcss/postcss`, not v3 CLI. Config is CSS-first (`globals.css @theme`), NOT `tailwind.config.ts`
- **Go 1.25** — features may differ from training data (`iter.Seq`, `unique`, `slog` improvements). Run `go vet ./...` before committing
- **CI workflows** in `.github/workflows/`: `ci.yml` (lint, frontend tests, backend tests, build) and `e2e.yml` (Playwright E2E). Both run on push/PR to `main`.
- **Branch naming**: `feature/*`, `fix/*`, `refactor/*`, `docs/*`
- **Conventional commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:` (scope optional: `refactor(docs):`)

## Pre-Commit Checklist

Before committing, run these checks:

```bash
# Backend
make vet               # Go vet
make fmt               # Go format + goimports

# Frontend
npm run format         # Prettier on TS/TSX/MD

# Full-stack verification
bash scripts/smoke-test.sh  # Wiring verification after significant changes
```

## Tests and Verification

- Frontend: Vitest in `apps/web/tests/` plus co-located files.
- Backend: standard Go tests with `-race` expected.
- `scripts/smoke-test.sh` checks repo-specific invariants after cross-stack work.
- `internal/testutil.NewTestServer()` is the Go integration-test harness.

### Known testing gaps (from ops.md)

- **Frontend**: No component tests, no SDK error-handling tests, no E2E tests, no accessibility tests.
- **Backend**: No repository tests, no LLM provider failover/circuit-breaker tests. Handler tests exist but don't cover openai_proxy, billing, or admin handlers.
- Integration tests require `TEST_DATABASE_URL` — see `apps/backend/.env.example`.

### Key test files

**Frontend:**

- `tests/wiring-verification.test.ts` — enforces no mock data in dashboard
- `tests/lib/api/sdk.test.ts` — SDK unit tests
- `tests/lib/api/errors.test.ts` — error handling tests
- `tests/lib/api/hooks.test.ts` — React Query hook wiring verification

**Backend:**

- `internal/handler/handler_test.go` — auth, CRUD handler tests
- `internal/handler/admin_providers_test.go` — AdminFetchModels handler tests
- `internal/middleware/auth_test.go`, `quota_test.go` — middleware tests
- `internal/domain/domain_test.go` — domain model tests
- `pkg/llm/llm_test.go` — LLM package tests
- `pkg/sdk/client_test.go` — Go SDK client tests
- `tests/integration/integration_test.go` — full integration (requires `TEST_DATABASE_URL`)

## Environment and Repo Quirks

- `AUTH_SECRET` must be identical in frontend and backend. Fallback: `AUTH_SECRET || NEXTAUTH_SECRET`.
- Local env templates: `apps/web/.env.local.example`, `apps/backend/.env.example`. Root/Docker compose may use Docker network URLs (`BACKEND_URL=http://backend:8080`); local dev needs `BACKEND_URL=http://localhost:8080`.
- Backend Makefile prepends `$(HOME)/.local/go/bin` to `PATH`.
- `apps/web/tsconfig.json` excludes `db/seed*.ts` and `scripts/**/*` from type checking.
- Provider API keys (`ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, etc.) are runtime-only — not build-time turbo env.
- `next.config.ts` enables `output: 'standalone'` and `typescript.ignoreBuildErrors: true`. Production Docker entry: `apps/web/server.js` inside `.next/standalone/`.
- Backend Makefile uses `go list -f` filter to only test packages with test files (Go 1.26+ compat since `covdata` removed).
- `.npmrc` sets `legacy-peer-deps=true` — do not remove.
- **Frontend `@/` path alias** maps to `apps/web/` root. Example: `@/lib/api/sdk` → `apps/web/lib/api/sdk.ts`.
- **Backend `ENV=development`** enables `slog.LevelDebug` logging. `ENV=production` in Docker.
- **`DB_TYPE` modes**: `postgres` (default), `neon` (cloud, skips local container), `mongodb` (backend auto-setup), `sqlite` (lite runtime with embedded schema + seed in `internal/db/lite_schema.go`).
- **MongoDB** in `docker-compose.yml` is behind a `mongo` profile — NOT started by default.
- **`opencode.json`** configures an OpenAI-compatible provider at `http://localhost:20128/v1` (a `ptcider` provider with models `mimo-v2.5-pro` / `GLM-5.1` and the `oh-my-openagent` plugin) for the OpenCode tool — note this is a generic localhost endpoint, not the app's own backend (`:8080`).
- **Package overrides** in root `package.json`: dompurify, esbuild, postcss, uuid — pinned across all workspaces.
- **Frontend dual DB driver**: Uses `@neondatabase/serverless` for cloud Neon databases, `pg` for local Postgres. Check `DATABASE_URL` for `neon.tech` to determine which driver is active.
- **Docker entrypoint** is `start.sh` with supervisord. In production, the backend binary is `/app/backend/server` and the frontend runs `apps/web/server.js` in standalone mode.
- **API Sandbox Mode**: `X-Sandbox: true` on `/v1/chat/completions` disables quota/cost/logging **for admins only**. Non-admin sandbox requests are rejected.

## Files Worth Checking Before Non-Trivial Changes

- `AGENTS.md` — short repo index + env var table (points at this file as canonical)
- `apps/web/AGENTS.md` — frontend rules (Next.js 16, SDK enforcement, component layers)
- `apps/backend/AGENTS.md` — backend rules (layers, auth, migrations, Anthropic proxy)
- `apps/backend/pkg/llm/AGENTS.md` — LLM pipeline stages and subpackage map
- `ops.md` — operational debt and known issues
- `osa.md` — comprehensive security and bug audit (Round 2, 2026-05-26)
- `FIXES_APPLIED.md` — recent security and bug fix record (OLLA audit, 2026-05-25)
- `UPDATE.md` — mandatory per-change log
- `apps/backend/cmd/api/main.go` — dependency wiring
- `apps/backend/cmd/api/routes.go` — all route definitions (100+ endpoints)
- `apps/backend/cmd/api/services.go` — dependency injection factory
- `apps/backend/internal/handler/admin_errors.go` — safe error handling for admin handlers
- `apps/backend/internal/handler/setup.go` — first-time admin bootstrap handler
- `apps/backend/internal/db/lite_schema.go` — SQLite runtime schema and seed
- `apps/web/lib/api/sdk.ts` — TypeScript SDK
- `apps/web/lib/api/hooks.ts` — React Query hooks
- `apps/web/lib/api/proxy.ts` / `apps/web/proxy.ts` — backend proxy vs NextAuth route middleware
- `apps/web/db/schema.ts` — Drizzle ORM schema
- `apps/web/auth.ts` / `apps/web/auth.config.ts` — NextAuth v5 config
