# Repository Guidelines

Universal LLM Gateway (Yapapa / DRA Platform) — an OpenRouter-style proxy for OpenAI, Anthropic, Gemini, Groq, NVIDIA NIM, and more. **Next.js 16 canary + Go 1.25** monorepo.

> **Canonical guidance lives in `CLAUDE.md`.** That file holds the full project overview, build/test/dev commands, the mandatory `UPDATE.md` logging rule, the layered Go architecture, the LLM pipeline map, hard constraints, pre-commit checklist, and known testing gaps. Read it first. This file only adds the per-app pointers and lookup tables that are tedious to derive.

## App-specific guidance (read before touching that layer)

- `apps/web/AGENTS.md` — frontend rules: Next.js 16 breaking changes, the SDK-driven dashboard enforcement (`getSDK()` / no mock data), Zod v4, Tailwind v4.
- `apps/backend/AGENTS.md` — backend rules: layered architecture, auth methods, migrations, the Anthropic `/v1/messages` proxy.
- `apps/backend/pkg/llm/AGENTS.md` — LLM pipeline stages (validator → router → cache → guardrails → moderation → translator → provider → telemetry → circuit breaker → watcher) and the 35+ subpackage map.

## Reference files

| File               | Use it for                                                      |
| ------------------ | --------------------------------------------------------------- |
| `CLAUDE.md`        | Full guidance: commands, constraints, architecture, pre-commit. |
| `ops.md`           | Operational debt and known issues (P0–P3).                      |
| `osa.md`           | Comprehensive security/bug audit (Round 2, 2026-05-26).         |
| `FIXES_APPLIED.md` | Recent security/bug fix record (OLLA audit, 2026-05-25).        |
| `UPDATE.md`        | Mandatory per-change log — append an entry for EVERY edit.      |

## Environment variables

| Variable            | Required | Description                                        |
| ------------------- | :------: | -------------------------------------------------- |
| `DATABASE_URL`      |    ✅    | PostgreSQL connection string                       |
| `AUTH_SECRET`       |    ✅    | JWT signing secret (must match frontend+backend)   |
| `NEXTAUTH_SECRET`   |    ✅    | NextAuth session secret                            |
| `NEXTAUTH_URL`      |    ✅    | Public base URL (e.g. `http://localhost:3000`)     |
| `BACKEND_URL`       |    ✅    | Go backend URL (e.g. `http://localhost:8080`)      |
| `OPENAI_API_KEY`    |    ❌    | OpenAI API key                                     |
| `ANTHROPIC_API_KEY` |    ❌    | Anthropic API key                                  |
| `GROQ_API_KEY`      |    ❌    | Groq API key                                       |
| `GEMINI_API_KEY`    |    ❌    | Google Gemini API key                              |
| `NVIDIA_API_KEY`    |    ❌    | NVIDIA NIM API key                                 |
| `REDIS_URL`         |    ❌    | Redis connection URL (optional, for rate limiting) |
| `STRIPE_SECRET_KEY` |    ❌    | Stripe secret key (for billing)                    |
| `DB_TYPE`           |    ❌    | `postgres` (default), `neon`, `mongodb`, `sqlite`  |

## Quick reference

| Service     | URL                                | Description              |
| ----------- | ---------------------------------- | ------------------------ |
| Frontend    | `http://localhost:3000`            | Next.js 16 App Router    |
| Backend API | `http://localhost:8080`            | Go chi router API server |
| API Docs    | `http://localhost:3000/docs`       | Interactive OpenAPI docs |
| Playground  | `http://localhost:3000/playground` | Multi-model AI chat      |

CI: `.github/workflows/ci.yml` (lint, frontend tests, backend tests, build) and `e2e.yml` (Playwright E2E), both on push/PR to `main`.
