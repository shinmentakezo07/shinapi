# Bug Hunt Report — Yapapa (DRA Platform) — Full-Stack

> **Date**: 2026-07-06
> **Scope**: Whole monorepo — Go backend (`apps/backend/`, ~45k LOC, 228 files) + Next.js frontend (`apps/web/`, ~65k LOC, 296 files)
> **Method**: 6 parallel finder agents (Go error-handling, Go security, Go LLM/SDK parity, TS frontend correctness, TS CLAUDE.md conventions, cross-stack wiring/auth) → each candidate verified by direct source read → 1-vote verify (recall-biased). All findings below were **confirmed by reading the actual code**.
> **Branch**: `feature/dashboard-ui-avant-garde` (HEAD `026c327`)

Severity: 🔴 High (security / data integrity / full-feature breakage), 🟡 Medium (correctness / availability), 🟢 Low.

---

## 🔴 H1 — Cross-tenant cache leak / poisoning (responses + billing)

**Files**: `apps/backend/pkg/llm/helper.go:24` (CacheKey) + `apps/backend/internal/service/provider.go:408` (`toLLMChatRequest`)

- `CacheKey(req)` hashes `tenant|` + `req.Metadata["user_id"]` first, with an explicit comment warning that without it identical prompts across users share a cache entry (cross-tenant poisoning + wrong user's quota not decremented).
- `toLLMChatRequest` builds `&llm.ChatRequest{Model, Messages, System}` and **never sets `Metadata`**. Nothing in the pipeline (`pkg/llm/pipeline/pipeline.go`) populates `user_id` either — `RunBefore` only reads it (and the only writer sets `_telemetry_start`). So `req.Metadata` is `nil` for every request.
- Consequence: the `tenant|` + `user_id|` + `virtual_key_id|` + `tenant_id|` prefix is empty for all users. Two different users sending the same prompt hash to the **same cache key** → User B gets User A's cached completion, and only User A's quota/billing is ever charged. Confirmed `ProviderService.Chat` (service/provider.go:147) calls `toLLMChatRequest(req)` then `p.Chat` → `llm.CacheKey(req)` (provider.go:216/261).

**Fix**: populate `req.Metadata["user_id"]` (and virtual/api key ids) in the chat path before `CacheKey` — e.g. in `toLLMChatRequest` from `domain.ChatRequest.UserID` or in `ProviderService.Chat/ChatStream` from the auth context.

---

## 🔴 H2 — SSRF in admin provider fetch: `0.0.0.0` bypass + DNS rebinding + no `CheckRedirect`

**Files**: `apps/backend/internal/handler/admin_providers.go:359` (`validateNotPrivateURL`) + `:309` (`fetchModelsFromUpstream`)

- `validateNotPrivateURL` resolves the host once with `net.LookupIP` then checks `IsPrivate/IsLoopback/IsLinkLocalUnicast`. It **omits `IsUnspecified()`**, so `baseUrl=http://0.0.0.0:8080` (and `::`) passes → client connects to localhost, reaching internal services (Redis/Postgres/admin).
- **TOCTOU / DNS rebinding**: the hostname is resolved at validation time but the HTTP client re-resolves at connect time; an attacker flips DNS to `169.254.169.254` after the check passes → cloud metadata exfiltration.
- **No `CheckRedirect`**: `fetchModelsFromUpstream` uses a default `http.Client` that follows 302 redirects. An attacker-controlled public upstream can 302 to `http://169.254.169.254/...` or `http://127.0.0.1:6379`, defeating the guard entirely. (Confirmed: no `CheckRedirect` anywhere in `pkg/llm/provider`.)

**Fix**: block `IsUnspecified()`; pin the resolved IP and dial it directly (or deny re-resolution); set `CheckRedirect: func(*Request, []*Request) error { return ErrUseLastResponse }` (or validate each hop).

---

## 🔴 H3 — SSRF via user-supplied webhook URLs

**File**: `apps/backend/pkg/webhook/webhook.go:206` (`ValidateWebhookURL`)

- Shares the **same** flaws as H2: missing `IsUnspecified()` (so `0.0.0.0` passes) and **validate-once, resolve-again-at-delivery** (H2's TOCTOU). Any authenticated user can POST `/api/webhooks` with `url=http://meta.attacker.com`; at delivery time the domain resolves to `169.254.169.254` and the outbound POST exfiltrates IAM credentials. Confirmed `service/webhook.go` dispatches deliveries to the stored URL.

**Fix**: same as H2 (unspecified-address block + IP pinning + no-redirect).

---

## 🔴 H4 — Privilege escalation: any `users.write` admin can grant `superadmin`

**File**: `apps/backend/internal/handler/admin_users_full.go:61` (`AdminUpdateUserRole`)

- `AdminUpdateUserRole` decodes `role` from the body and calls `UpdateUserRole` (`internal/repository/admin_user_repo.go:104`) which runs `UPDATE users SET role=$2 WHERE id=$1` with **no allowlist / authorization check**. An admin holding only the `users.write` permission (not a superadmin) can POST `{"role":"superadmin"}` and promote themselves/any user to full superadmin (`IsAdmin()` and `HasPermission` treat `role=='superadmin'` as all-access).

**Fix**: validate `role` against an allowlist (`admin`/`user`/etc.), and require superadmin to grant superadmin.

---

## 🔴 H5 — Go SDK cannot read any OpenAI-proxy response (envelope vs raw)

**File**: `apps/backend/pkg/sdk/client.go:1007` (`OpenAIChatCompletions`) — backend `internal/handler/openai_proxy.go:152`

- The Go SDK decodes every response into `var r envelope` then returns `r.Data`. But the backend OpenAI proxy handlers `json.NewEncoder(w).Encode(openaiResp)` — a **raw** OpenAI response (`id/choices/usage`), not an envelope with a `data` key. So `r.Data` stays `nil` and `OpenAIChatCompletions` / `OpenAIEmbeddings` / `OpenAIListModels` always return empty. The Go SDK is non-functional against the real backend for the OpenAI-compatible surface.

**Fix**: either have the backend wrap proxy responses in the `envelope` (`{data: ...}`) shape the SDK expects, or change the SDK to decode the raw response directly (and update the `envelope` type). Same mismatch affects `Chat()` (client.go:479) which POSTs to `/api/chat` but `ChatProxy` always streams SSE.

---

## 🔴 H6 — Frontend dashboard features 404: no Next proxy route + SDK `baseUrl=''`

**Files**: `apps/web/app/dashboard/fine-tuning/page.tsx:65`, `apps/web/app/dashboard/exports/page.tsx:144`, `apps/web/app/dashboard/inbox/page.tsx:51`

- `getSDK()` is a singleton with `baseUrl=''` (`new DraSDK()` at sdk.ts:2169; only `configureSDK` (playground) sets a URL). So SDK calls hit the Next origin `/api/...`.
- Only a subset of backend routes have a Next proxy route under `apps/web/app/api/` (`admin, analytics, auth, batch, chat, conversations, credits, embeddings, files, invites, keys, logs, messages, models, notifications, organizations, promos, prompts, providers, transactions, validate, webhooks`). **Missing proxy routes**: `/api/fine-tuning/*`, `/api/exports/*`, `/api/announcements`.
- `fine-tuning/page.tsx` calls `getSDK().listFineTuningJobs()` → `GET /api/fine-tuning/jobs` → **404** (no Next route). `inbox/page.tsx` calls `getSDK().getUserAnnouncements()` → `GET /api/announcements` → **404**.
- `exports/page.tsx` is worse: `createExport.mutate` is a pure **mock** — `setTimeout` + `Math.random()` fabricates a "completed" job with `downloadUrl=/api/exports/exp_…/download` that was never created backend-side (violates the AGENTS.md "no mock data" rule too). The download 404s.

**Fix**: add Next catch-all proxy routes for `/api/fine-tuning`, `/api/exports`, `/api/announcements` (or set a global SDK `baseUrl` from `NEXT_PUBLIC_BACKEND_URL`), and replace the exports mock with a real `createExportJob`/`downloadExport` SDK call.

---

## 🔴 H7 — Circuit breaker opens on healthy streams (false outage)

**File**: `apps/backend/pkg/llm/circuitbreaker/circuitbreaker.go:201` (`wrapStream`)

- A stream is marked **FAILED** unless the final chunk's `FinishReason` is exactly `stop` or `tool_calls`. A perfectly healthy response that hits `max_tokens` (`length`), `content_filter`, or carries **no recognized finish_reason** (common with upstream Anthropic chunks) leaves `success=false` → `recordResult(failure)`. After `FailureThreshold` (5) such responses, `beforeCall` returns "circuit breaker open" and **all** traffic to that provider is rejected for the timeout window. Ordinary successful (just truncated/filtered) completions cause a false-positive total outage.

**Fix**: treat `length`/`content_filter`/unknown-but-complete streams as success (or only fail on transport/5xx errors), and add an `end_turn`/`unknown` finish reason to the success set.

---

## 🟡 M1 — Playground multi-turn context is broken (follow-ups ignore assistant replies)

**File**: `apps/web/app/playground/page.tsx:298`

- Each model request is built from `sharedMessages.filter(m => m.role==="user" || m.role==="assistant").map(...)` **`.concat({role:"user", content: inputMessage})`**. But `sharedMessages` only ever contains the user's own turns (the assistant reply is stored only in `sessions[m].messages`, never in `sharedMessages`). So on a second prompt the assistant's prior answer is dropped from the request → "now summarize that" fails. The per-model history is maintained but never sent.

**Fix**: include the assistant replies from `sessions[model].messages` (or maintain `sharedMessages` to include assistant turns) when building the request payload.

---

## 🟡 M2 — MultiKeyProvider has no failover: one bad key fails the whole request

**File**: `apps/backend/pkg/llm/provider/multikey.go:58` (`Chat`)

- `Chat` picks exactly one `KeyInstance` via `nextInstance()` then `return inst.Provider.Chat(ctx, req)` immediately on error. If the selected key is rate-limited (429), expired (401), or transiently failing, the request errors instead of retrying with the next key in the pool. Operators expect key-rotation/failover semantics ("load-balancing across keys") but a single transient key failure produces a user-visible 5xx with no rotation. (`ChatStream` has the same issue at :72.)

**Fix**: on `err`, retry with the next healthy instance (up to N, skipping the failed key).

---

## 🟡 M3 — Analytics: NaN total + wrong time-range slice

**File**: `apps/web/app/dashboard/analytics/AnalyticsClient.tsx:87` and `:103`

- `totalCost = recentLogs.reduce((sum, log) => sum + log.cost, 0)` propagates `NaN` if any `log.cost` is `null`/`undefined` (e.g., a failed/errored request still in `recentLogs`) → renders `$NaN`. Same unguarded reduce on `log.latency`.
- `filteredDaily = dailyUsage.slice(0, days).reverse()` slices the **first** `days` entries. If `dailyUsage` is oldest→newest (the ordering `DashboardOverviewClient` relies on via `.slice().reverse()`), the 7d/30d/90d tabs show the **oldest** data, not the last N days. The two analytics components assume opposite orderings, so at least one is wrong for any given backend ordering.

**Fix**: guard with `Number(log.cost) || 0`; slice the **last** `days` entries (`dailyUsage.slice(-days)`) consistently, and standardize the array ordering assumption across analytics components.

---

## (Additional confirmed, capped at 10 — worth tracking)

- 🟡 **KeysClient shows the wrong Request ID** — `apps/web/app/dashboard/keys/KeysClient.tsx:132` reads `sdk.lastRequestId()`, but `_lastRequestId` is a module-singleton mutated on **every** SDK response (sdk.ts:450-451). Concurrent refetching queries (credits, analytics, provider-health) overwrite it, so the displayed ID is from an unrelated request — misleading for support.
- 🟡 **`admin-sdk.listUserUsage` wrong cast** — `apps/web/lib/api/admin-sdk.ts:378` casts `/api/admin/users/{id}/usage` result (`response.Paginated(w, records, ...)`) as `UsageRecord[]` (a UsageDaily shape), so usage charts render blank/NaN despite a 200.
- 🟡 **Swallowed billing error** — `apps/backend/internal/handler/handler.go:568` `go eg.Wait()` discards the errgroup error; `LogAndDeduct` failures are logged but never surface, so chat can return 200 while billing is silently lost.
- 🟡 **SQLite bootstrap race** — `apps/backend/internal/repository/setup_repo.go:43` uses a DEFERRED `BeginTx` (no `BEGIN IMMEDIATE`); concurrent `POST /api/setup/bootstrap` can both pass the `COUNT=0` check and create multiple superadmin accounts under `DB_TYPE=sqlite`.
- 🟢 **`/api/setup/status` is public** — `cmd/api/routes.go:154` mounts `GET /api/setup/status` outside any auth group, leaking whether an admin exists (`needsSetup`) for instance enumeration.
- 🟡 **Streaming over-billing on disconnect** — `apps/backend/internal/handler/openai_proxy.go:230` / `anthropic_messages.go` still call `LogAndDeduct` with estimated tokens when the client disconnects mid-stream, charging for an aborted/partial response.
- 🟢 **Missing `rows.Err()` checks** — `pkg/llm/stores/postgres.go:89`, `internal/handler/admin_messages.go:60`, `admin_operations.go:77` (and others) loop `for rows.Next()` without checking `rows.Err()`, so a mid-iteration DB error silently truncates results returned as HTTP 200.
- 🟢 **`rows.Err()` + `continue` on scan error** — `admin_messages.go` / `admin_operations.go` `continue` past scan errors, so partial/empty lists are returned as success on query failures.

## (Two additional findings surfaced by the late-arriving error-handling audit — not in the top 10 above)

- 🟡 **SSE notifications silently dropped when buffer is full** — `apps/backend/internal/handler/sse.go:113` (`SendToUsers`/`Broadcast`/`Send`) use `select { case ch <- ev: default: }` against a 100-buffered channel. Under a burst (many connected clients or a flood of webhook/credit events), the buffer fills and new `SSEEvent`s hit the `default` branch and are discarded. The targeted user never receives the `new_message` notification even though the message was created and persisted — so admin announcements get silently lost.

- 🟡 **Data race on cached credential structs** — `apps/backend/pkg/llm/credentials/vault.go:195` (`RecordSuccess`/`RecordFailure`) mutate shared cached `Credential` fields (`HealthStatus`, `FailureCount`, …) under `v.mu`, but `GetBestKey`/`selectBest` read the same cached slice elements **without** holding `v.mu`. Two concurrent chat requests to the same provider can race: one writes `HealthStatus='degraded'` while the other reads a partially-written struct, leading to nondeterministic key selection (an unhealthy key chosen over a healthy one). Flagged by the race detector; under `-race` this is a hard failure.

---

## Methodology notes

- All 8 finder angles ran; the 6 strongest, best-evidenced, and most severe findings were verified by reading the exact source (function bodies, call sites, route registrations, SDK decode logic).
- Cross-referenced against `ops.md`, `osa.md`, `FIXES_APPLIED.md`, and the prior `bug_hunt_report.md` — none of the above are already tracked there.
- Items intentionally NOT reported (verified clear): SQL injection via `paginatedQuery` (column/table names come from a hardcoded allowlist, no user input reaches the format string); JWT HS256 verification (correct, auto-validates exp); password-reset tokens (`crypto/rand`, single-use, expiring).
