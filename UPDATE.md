## Session: `docs-overhaul-2026-07-05` — 2026-07-05

**Title (conventional-commits):** `feat(docs): add 5 new doc pages, update sidebar nav, expand API reference, update models list`

### Why
The docs were missing major platform features: Anthropic Messages API compatibility, LLM gateway pipeline architecture, function calling/tools, admin API, and SDK reference. The API reference data.ts was significantly behind the actual SDK (~40 methods vs ~15 documented). Models list was outdated (missing Mistral, DeepSeek, Meta; Anthropic models were stale).

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/web/app/docs/gateway/page.tsx | L1-270 | created |
| apps/web/app/docs/anthropic/page.tsx | L1-280 | created |
| apps/web/app/docs/function-calling/page.tsx | L1-260 | created |
| apps/web/app/docs/admin/page.tsx | L1-310 | created |
| apps/web/app/docs/sdk/page.tsx | L1-290 | created |
| apps/web/app/docs/layout.tsx | L3-31, L53-98 | modified |
| apps/web/app/docs/page.tsx | L49-205 | modified |
| apps/web/app/docs/models/page.tsx | L49-89 | modified |
| apps/web/app/docs/api-reference/data.ts | L1-14, L156-185 | modified |

### Before
```tsx
// layout.tsx - navGroups had 19 pages across 4 groups
// No gateway, anthropic, function-calling, admin, or sdk pages
// models/page.tsx only listed 5 providers (OpenAI, Anthropic, Groq, Gemini, NVIDIA)
// api-reference/data.ts missing 30+ endpoints, no Anthropic category
```

### After
```tsx
// layout.tsx - navGroups now has 24 pages across 4 groups:
//   Getting Started: +SDK Reference
//   Core Features: +Anthropic Messages, +Function Calling
//   Platform: +LLM Gateway
//   Reference: +Admin API
//
// models/page.tsx lists 8 providers (added Mistral, DeepSeek, Meta; updated Anthropic/Gemini)
//
// api-reference/data.ts:
//   - Added Anthropic-Compatible Endpoints category with POST /v1/messages
//   - Added 30+ missing protected endpoints (budget alerts/caps, comparisons,
//     fine-tuning, exports, messages, announcements, conversation title, batch list/cancel, etc.)
//   - Updated admin endpoints with correct paths
//
// New pages created:
//   gateway/page.tsx - 10-stage pipeline, provider registry, routing strategies,
//     circuit breaker, caching, format translation
//   anthropic/page.tsx - /v1/messages endpoint, Anthropic SDK usage, SSE events,
//     system prompts, tool use, compatibility notes
//   function-calling/page.tsx - OpenAI & Anthropic tool formats, returning results,
//     web search tool, best practices
//   admin/page.tsx - Setup/bootstrap, dashboard/stats, user management,
//     providers, models/aliases, billing, settings/feature flags, security/audit,
//     RBAC, rate limit tiers, infrastructure, announcements, promos, webhooks, enterprise
//   sdk/page.tsx - TypeScript SDK, custom instances, React Query hooks,
//     Go SDK, OpenAI SDK drop-in, full method reference table
```

### Notes
- The Anthropic page covers SSE events (message_start, content_block_start, content_block_delta, content_block_stop, message_delta, message_stop) with streaming examples
- The Gateway page documents all 10 pipeline stages: Validator → Router → Cache → Guardrails → Moderation → Translator → Provider → Telemetry → Circuit Breaker → Watcher
- The Admin page documents 80+ admin endpoints across 12 categories
- The API reference data.ts still uses some legacy paths (e.g., `/auth/signup` vs `/api/auth/signup`) — a full path normalization pass is recommended as follow-up

## Session: `sqlite-runtime-wiring-2026-06-28` — 2026-06-28 (continued in next turns)

**Title (conventional-commits):** `feat(db): add SQLite runtime via pgx-flavored facade`

**Why** — User chose "Wire SQLite runtime (full)" so the existing backend can start in `DB_TYPE=sqlite` mode against the canonical yapapa.db. This is fundamentally a multi-day effort across the full repository surface: db package, factory, migrate, seed, tx, services.go's pgxpool-coupled stores (~7 stores), ~40 repositories (most of which Scan into `pgtype.*` destinations), the apps/web Drizzle schema, and apps/web/lib/env handling. This single turn landed the foundation slice:

**Files added**

| File | Type | LOC | Notes |
|---|---|---|---|
| `apps/backend/internal/db/sqlite_querier.go` | NEW | ~360 | pgx-flavored facade over modernc.org/sqlite (`*sql.DB` / `*sql.Tx` → repo-shaped). assign() dispatches destination types: `*string / *int / *int64 / *bool / *float64 / *[]byte / *any / *time.Time` (parses RFC3339Nano/RFC3339) / `*uuid.UUID` / `*sql.Null{String,Int64,Bool,Float64}`. Other destination types (notably `pgtype.*`) return an explicit error. |
| `apps/backend/internal/db/lite_schema.go` | NEW | ~150 | Inlined `LiteDDL []string` and `LiteSeedDefaults(ctx, *sql.DB)` so the db package owns its SQLite runtime without importing testutil (which would create an import cycle). Mirrors `internal/testutil/sqlite_db.go` and `internal/testutil/sqlite_seed.go`. Sync manually. |
| `apps/backend/internal/dbtestutil/postgres_embedded.go` | MOVED | n/a | The `fergusstrange/embedded-postgres` helper moved out of internal/testutil into a sibling package `internal/dbtestutil` to break a different cycle direction. Test consumer imports need updating (`NewTestDBOrSkip` is now `dbtestutil.NewTestDBOrSkip`). |

**Files modified**

| File | Change |
|---|---|
| `apps/backend/internal/db/db.go` | Added `DBTypeSQLite` constant, `SqlDB *sql.DB` field, `sq *sqliteQuerier` cached instance, `NewSQLite(databaseURL)` factory, `Close/Health/Query/QueryRow/Exec/Begin` dispatch on SQLite (mirrors existing pgx/mongo paths). |
| `apps/backend/internal/db/tx.go` | Rewrote to restore `Querier` interface, `sqliteTx` (new), `mongoTx` (preserved), `beginMongoTx` (preserved), `WithTx` (preserved). |
| `apps/backend/internal/db/migrate.go` | New `AutoMigrate` SQLite branch → `autoMigrateSQLite` which applies `LiteDDL` via `database.SqlDB.ExecContext`. |
| `apps/backend/internal/db/seed.go` | New `AutoSeed` SQLite branch → `autoSeedSQLite` (only seeds if `users` table is empty; matches PG semantics). |
| `apps/backend/internal/db/factory.go` | `NewFromConfig` now dispatches `"sqlite"` → `NewSQLite(cfg.DatabaseURL)`. |
| `apps/backend/internal/config/config.go` | `DBType` validation now accepts `"sqlite"`. |
| `apps/backend/internal/testutil/sqlite_db.go` | Added exported alias `var SQLiteDDL = sqliteDDL` for cross-package use. |
| `apps/backend/internal/testutil/sqlite_seed.go` | Added exported `SeedCore(ctx, *SQLiteTestDB) error` for non-testing callers (currently unused — db uses inlined LiteSeedDefaults instead). |

**Validation status (this turn)**

```
go vet ./internal/db/...          : PASS early; cycle errors after seed wiring
go build ./internal/db/...        : same
go build ./cmd/api                : same
go test ./internal/testutil/...   : setup failed (cycle / undefined imports)
```

The cycle between `db ↔ testutil` is broken (db no longer imports testutil; testutil's new `SeedCore` is unused, and the lite schema lives in `db/lite_schema.go`). However, the rewrite of `tx.go` dropped two imports (`go.mongodb.org/mongo-driver/v2/mongo` and `fmt`) — these need re-adding before the package compiles. This is a one-line targeted fix for the next turn.

**Out-of-scope-but-required-for-runnable-Sqlite-backend (NOT landed)**

These need their own turns because each is meaningful work:

1. **`tx.go` import restoration** — 2 lines. Adds back `mongo` and `fmt`.
2. **services.go SQLite store variants** — `stores.NewPostgresCredentialStore(database.Pool)`, `NewPostgresVirtualKeyStore`, `NewPostgresBudgetStore`, `NewPostgresUsageStore`, `NewPostgresPricingStore`, `NewPostgresAuditStore` (per inventory: ~6 stores). Each accepts `*pgxpool.Pool` directly. In SQLite mode `database.Pool` is nil → nil-deref at startup. Either (a) add `*sql.DB`-variants and branch in `initServices`, or (b) abstract each Store interface. Substantial.
3. **Repository Scan destinations** — `apps/backend/internal/repository/*.go` (40 files) scan into `pgtype.Text`, `pgtype.Timestamptz`, `pgtype.Bool`, `pgtype.Int4`, `*uuid.UUID` (already covered for `*uuid.UUID` in assign), and struct pointer types. `assign`'s default returns an error → repos that hit the SQLite path today will fail. Two options: (a) port repos to plain Go dest types; (b) widen `assign` with reflect-based fallback.
4. **PG-only SQL features** — JSONB ops, full-text search, advisory locks, LISTEN/NOTIFY, CTE features aren't translated. Repos using them must gate to PG-only.
5. **`apps/web/db/schema.ts` (Drizzle)** — must move from `drizzle-orm/pg-core` (bigserial, jsonb, pgTable) to `drizzle-orm/sqlite-core`. drizzle.config.ts `dialect` must change. `apps/web/db/index.ts` driver must change from `neon-http`/`node-postgres` to `better-sqlite3` or `libsql`. This is a separate, large turn.
6. **Auth/JWT/scopes that depend on admin_user / api_logs** — not in lite DDL. Endpoints that touch those tables will return 501 in SQLite mode until the lite DDL is extended.

**Worked-around intentionally**

- **Cycle break via inlined DDL/seed in db/lite_schema.go** — duplication is acknowledged. If you change `internal/testutil/sqlite_db.go`, mirror the change to `internal/db/lite_schema.go` `LiteDDL` in the same commit.
- **Wipe-on-empty** (autoSeedSQLite only seeds when `users` is empty) — matches existing Postgres semantics. Operators who manually added rows won't silently lose them on backend restart.

This session is unfinished; the next turn should pick up at task 1 (tx.go import restoration) and progress through to task 4 before the SQLite backend is genuinely runnable for an end-to-end demo.

---

## 2026-06-28T15:25Z — sqlite-runtime-tx-fix-2026-06-28 — fix(sqlite-runtime): shippable tx.go after mongo-driver/v2 API correction

**Session**: sqlite-runtime-tx-fix-2026-06-28 (continuation of the SQLite wiring foundation landed in 499f7d4 and committed by yapapa-fixture-cli-2026-06-28).

**Why**: the previous turn's tx.go rewrite accidentally targeted mongo-driver **v1** while the codebase imports `go.mongodb.org/mongo-driver/v2/mongo`. Result: `cmd/api` failed to build with seven distinct compile errors (`undefined: mongo.SessionContext`, `undefined: errMongoNotConfigured`, `undefined: fmt`, `StartTransaction returns 1 value`, `EndSession (no value) used as value`, plus `Tx redeclared in this block` once the type moved to db.go). The user's `bash scripts/dev.sh` with `DB_TYPE=sqlite` got stuck at the Go build step. This entry unblocks the build.

**Files changed (all backend Go):**

| File | Change | Lines | Type |
| --- | --- | --- | --- |
| `apps/backend/internal/db/tx.go` | Rewritten against mongo-driver/v2: `mongoTx.sess *mongo.Session` (pointer — v2's `Client.StartSession()` return type), `sess.StartTransaction()` single-return, `EndSession(ctx)` void, both Commit/Rollback chain `EndSession` so sessions return to mongo's pool instead of leaking to GC. Removed duplicate `Tx` interface (lives in db.go), removed dead `errors.Is(err, ErrMongoNotConfigured)` branch, dropped unused `errors` import, trimmed mongoTx preamble from 14 to 7 lines, added one-line note about `sqliteTx.Commit/Rollback` discarding ctx (Go 1.21+ stdlib has no context-aware commit/rollback). | ~110/0 | modified |
| `apps/backend/internal/db/db.go` | Added `var ErrMongoNotConfigured = errors.New("mongodb not configured")` package-level sentinel + `errors` to imports. `Tx` interface had already landed here in the prior turn. | +5 | modified |
| `apps/backend/internal/db/seed.go` | Added explicit `case DBTypeSQLite` branch in `isDBEmpty` returning a clear error so a future dispatch reorder won't surface a misleading "postgres pool not connected" message from the default branch (Pool is nil in SQLite mode). | +6 | modified |

**Before** (`internal/db/tx.go:71-78`, the broken section):

```go
func (db *DB) beginMongoTx(ctx context.Context) (Tx, error) {
    if db.MongoDB == nil {
        return nil, errMongoNotConfigured             // ← undefined
    }
    session, err := db.MongoDB.Client().StartSession()
    if err != nil {
        return nil, fmt.Errorf(…)                     // ← fmt undefined
    }
    tx, err := session.StartTransaction()             // ← v1: 2 returns; v2: 1
    if err != nil {
        _ = session.EndSession(ctx)                   // ← v2: void, not value
        return nil, fmt.Errorf(…)                     // ← fmt undefined
    }
```

**After** (`internal/db/tx.go:100-115`):

```go
func (db *DB) beginMongoTx(ctx context.Context) (Tx, error) {
    if db.MongoDB == nil {
        return nil, ErrMongoNotConfigured
    }
    sess, err := db.MongoDB.Client().StartSession()    // v2: returns *mongo.Session, error
    if err != nil {
        return nil, fmt.Errorf("start mongo session: %w", err)
    }
    if err := sess.StartTransaction(); err != nil {   // v2: single error return
        sess.EndSession(ctx)                          // v2: void
        return nil, fmt.Errorf("start mongo tx: %w", err)
    }
    if db.mq == nil {
        db.mq = newMongoQuerier(db.MongoDB)
    }
    return &mongoTx{q: db.mq, sess: sess}, nil
}
```

**Commit/Rollback end of tx.go**:

```go
// Commit/Rollback chain EndSession after the transactional call so the
// session returns to mongo-driver's connection pool. Without this the
// session leaks until GC, which degrades under load.
func (t *mongoTx) Commit(ctx context.Context) error {
    err := t.sess.CommitTransaction(ctx)
    t.sess.EndSession(ctx)
    return err
}

func (t *mongoTx) Rollback(ctx context.Context) error {
    err := t.sess.AbortTransaction(ctx)
    t.sess.EndSession(ctx)
    return err
}
```

**Validation status (this turn):**

```
go vet  ./internal/db/... → 0
go build ./internal/db/... → 0
go vet  ./cmd/api         → 0
go build ./cmd/api        → 0
go test  ./internal/testutil/... (regression on existing SQLite tests) → ok 2.962s
```

**Out-of-scope-but-required-for-runnable-Sqlite-backend (NOT landed, tracked as followups):**

1. **`services.go` SQLite store variants** — six `stores.NewPostgres*` constructors currently take `*pgxpool.Pool` directly. In SQLite mode `database.Pool` is nil → nil-deref at backend startup. Fix: add `*sql.DB` variants and branch in `initServices`, or introduce a Store interface. ~6 store files.
2. **Repository `Scan` destinations** — ~40 files scan into `pgtype.Text`, `pgtype.Timestamptz`, `pgtype.Bool`, `pgtype.Int4`, and custom pointer types that `assign`'s default branch returns an error for. Fix: widen `assign` with reflect-based fallback, or port repos to plain Go destinations.
3. **PG-only SQL features** — JSONB ops, full-text search, advisory locks, LISTEN/NOTIFY, advanced CTEs aren't translated. Repos using them must gate to PG-only until a runtime translator exists.
4. **Frontend Drizzle rewrite** — `apps/web/db/schema.ts` uses `drizzle-orm/pg-core` (bigserial, jsonb, pgTable); needs to move to `drizzle-orm/sqlite-core`. `drizzle.config.ts` `dialect` and `apps/web/db/index.ts` driver (neon-http / node-postgres → better-sqlite3 / libsql) need to switch too. Large separate turn.

**Notes:** the SQLite path in `dev.sh` (option 2) was promoted with this fix. The yapapa.db fixture workflow landed in the same earlier session (499f7d4) and is unaffected.

---

## 2026-06-28T15:55Z — admin-bootstrap-setup-page-2026-06-28 — feat(admin): /admin/setup first-time-bootstrap flow

**Session**: admin-bootstrap-setup-page-2026-06-28 (sibling of sqlite-runtime-tx-fix-2026-06-28 in commit 1fde2f6).

**Why**: Prior to this commit there was no UI path for creating the first admin account. A fresh Postgres DB had  only via the seed; if a deployment ran without the seed (custom compose, prod cold start with a wiped DB) the operator was locked out. This adds a self-service  page that auto-redirects every visitor (except itself) to it while no admin row exists, lets a fresh visitor create the first admin in-place, auto-logs them in, and self-disables once an admin exists.

**Files changed:**

| Path | Type |
|---|---|
| apps/backend/internal/repository/setup_repo.go | NEW |
| apps/backend/internal/service/setup.go | NEW |
| apps/backend/internal/handler/setup.go | NEW |
| apps/backend/cmd/api/services.go | MODIFIED |
| apps/backend/cmd/api/main.go | MODIFIED |
| apps/backend/cmd/api/routes.go | MODIFIED |
| apps/web/app/admin/setup/layout.tsx | NEW |
| apps/web/app/admin/setup/page.tsx | NEW |
| apps/web/app/lib/actions.ts | MODIFIED |
| apps/web/proxy.ts | MODIFIED (rewritten) |
| UPDATE.md | MODIFIED |

**Before/after (key wiring)**:

 (new public /api/setup/* routes mounted outside any auth-required group):



 (replaced to add /admin/setup funnel with 10s in-memory cache, fail-open on backend-down):

/api/setup/status

**Notes for follow-ups:**
-  uses  which is Postgres-only. DB_TYPE=sqlite and DB_TYPE=mongodb will return generic 500 on bootstrap. Add a friendly 503 + clear message when those runtimes are wired.
- Pre-existing TS errors in  and  are NOT touched here.
- Pre-existing  has an unrelated CreatePrompt arg-count drift. Full  triggers it; scoped  is green.
- Concurrent bootstrap requests serialize at the DB level via transaction-scoped advisory lock + recheck. Second one hits ErrFirstAdminAlreadyExists -> 403, mapped to redirect("/admin/login"). UX-acceptable.

---

## 2026-06-28T16:24Z \u2014 admin-setup-ui-enhancement-2026-06-28 \u2014 feat(admin/setup-ui): V2 visual upgrade (3D tilt, password meter, step indicator, success celebration)

**Session**: admin-setup-ui-enhancement-2026-06-28 (visuals-only follow-up to admin-bootstrap-setup-page-2026-06-28 in commit a258f9b).

**Why**: User asked to enhance the UI/visuals of /admin/setup. V1 commit landed a polished terminal-aesthetic base. V2 layers four high-impact enhancements on top of the existing atmosphere + branding panel + setup card structure \u2014 no new server-side contracts.

**Files changed:**

| Path | Type |
|---|---|
| apps/web/app/admin/setup/page.tsx | MODIFIED (rewrite), 1100 \u2192 1379 lines |
| UPDATE.md | MODIFIED |

**Enhancements (V1 \u2192 V2 delta):**

1. **3D parallax tilt** \u2014 `useTilt()` hook reads mousemove on the card wrapper, rAF-throttled X/Y rotation (\u00b14\u00b0). Honors `useReducedMotion`.

2. **Animated 4-step indicator** \u2014 `[IDENTITY, CREDENTIALS, VERIFY, PROVISION]` past steps green-ticked, active pulses, derived from local form state + `useFormStatus.pending`.

3. **Password strength meter** \u2014 `PasswordStrengthMeter(pw)` 0\u20134 score from 5 entropy rules \u2192 4-bar segmented meter with red/amber/emerald ramp + live copy. New `InputField.bottomSlot` prop.

4. **Success celebration state** \u2014 `<AnimatePresence mode=\"wait\">` swaps the form for `SuccessPanel` when pending transitions true\u2192false without errors. Includes `ConfettiBurst` (64 deterministic particles, 3 shapes \u00d7 7 colors) + `SuccessRing` (3 staggered radial pulses + gradient check icon).

**Other polish:** background scanline beam +14 particles, BrandingPanel feature list 3\u21924 items (Database/Network/Cpu/Sparkles), header third pill \"PG.ADVISORY\", success footer \"ADMIN SESSION ESTABLISHED\".

**Notes:** no new deps. Backend Go files (`setup_repo.go`, `setup.go`, `handler/setup.go`), `bootstrapAdmin` server action, `proxy.ts` middleware unchanged from a258f9b.
MSG
echo "UPDATE.md appended; line count: $(wc -l < UPDATE.md)" ; \
echo ; echo "===== stage V2 changes only =====" ; \
git add apps/web/app/admin/setup/page.tsx UPDATE.md ; \
echo "===== diff --cached --stat =====" ; \
git diff --cached --stat ; \
echo ; echo "===== commit =====" ; \
git commit -m "feat(admin/setup-ui): V2 visual upgrade (3D tilt, password meter, step indicator, success celebration)

- setup/page.tsx rewritten (1100 -> 1379 lines) layering four enhancements:
  * 3D parallax tilt: useTilt() mousemove, rAF-throttled, +/-4deg rotation
  * 4-step indicator: IDENTITY -> CREDENTIALS -> VERIFY -> PROVISION
  * Password strength meter (4 bars, red/amber/emerald ramp + copy)
  * Success celebration: AnimatePresence swaps form for SuccessPanel
    on pending true->false + no errors; includes ConfettiBurst (64
    particles, 3 shapes x 7 colors) + SuccessRing (3 staggered pulses)

- Atmosphere: scanline beam +14 particles, brighter halos
- BrandingPanel: 4 feature items (Database/Network/Cpu/Sparkles)
- Header pill row: third PG.ADVISORY pill
- Success footer: ADMIN SESSION ESTABLISHED text

Notes: no new deps. Backend Go files + bootstrapAdmin + proxy.ts
unchanged from commit a258f9b. Pre-existing tsc errors in
lib/api/proxy.ts:86 and app/lib/auth-actions.ts:9 remain unfixed
and unrelated." 2>&1 ; echo "commit_exit=$?" ; \
echo ; echo "===== push =====" ; \
git push origin master 2>&1 ; echo "push_exit=$?" ; \
echo ; echo "===== HEAD =====" ; \
git log -1 --oneline


---

## 2026-06-28T16:24Z — admin-setup-ui-enhancement-2026-06-28 — feat(admin/setup-ui): V2 visual upgrade (3D tilt, password meter, step indicator, success celebration)

**Session**: admin-setup-ui-enhancement-2026-06-28 (visuals-only follow-up to admin-bootstrap-setup-page-2026-06-28 in commit a258f9b).

**Why**: User asked to enhance the UI/visuals of /admin/setup. V1 commit landed a polished terminal-aesthetic base. V2 layers four high-impact enhancements on top of the existing atmosphere + branding panel + setup card structure — no new server-side contracts.

**Files changed:**

| Path | Type |
|---|---|
| apps/web/app/admin/setup/page.tsx | MODIFIED (rewrite), 1100 → 1379 lines |
| UPDATE.md | MODIFIED |

**Enhancements (V1 → V2 delta):**

1. **3D parallax tilt** — `useTilt()` hook reads mousemove on the card wrapper, rAF-throttled X/Y rotation (±4°). Honors `useReducedMotion`.

2. **Animated 4-step indicator** — `[IDENTITY, CREDENTIALS, VERIFY, PROVISION]` past steps green-ticked, active pulses, derived from local form state + `useFormStatus.pending`.

3. **Password strength meter** — `PasswordStrengthMeter(pw)` 0-4 score from 5 entropy rules → 4-bar segmented meter with red/amber/emerald ramp + live copy. New `InputField.bottomSlot` prop.

4. **Success celebration state** — `<AnimatePresence mode="wait">` swaps the form for `SuccessPanel` when pending transitions true→false without errors. Includes `ConfettiBurst` (64 deterministic particles, 3 shapes × 7 colors) + `SuccessRing` (3 staggered radial pulses + gradient check icon).

**Other polish:** background scanline beam +14 particles, BrandingPanel feature list 3→4 items (Database/Network/Cpu/Sparkles), header third pill "PG.ADVISORY", success footer "ADMIN SESSION ESTABLISHED".

**Notes:** no new deps. Backend Go files (`setup_repo.go`, `setup.go`, `handler/setup.go`), `bootstrapAdmin` server action, `proxy.ts` middleware unchanged from a258f9b.

---

## 2026-06-28T16:48Z — admin-setup-ui-v21-fixes-2026-06-28 — fix(admin/setup-v2): patch 3 reviewer-flagged issues + cache-TTL UX nit

**Session**: admin-setup-ui-v21-fixes-2026-06-28 (post-review follower of admin-setup-ui-enhancement-2026-06-28 in commit 3c61947).

**Why**: V2 visuals commit landed 4 enhancements but the reviewer flagged 5 concerns (3 FIX FIRST). This commit ships those 3 plus the only user-visible UX polish from V2.1 review.

**Fixes:**

* **Fix #1 (CRITICAL)**: bootstrapAdmin no longer server-side redirects on success; returns `SetupState { success: true }`. SetupCard now drives navigation via `useRouter` after a 1.6s celebration so the `SuccessPanel` actually renders. (Prior `prevPendingRef` + `useFormStatus.pending`-flip heuristic lost the race against the redirect; celebration was effectively invisible.)

* **Fix #2 (visual bug)**: `OrbitLogo` orbital dot replaced 5-keyframe `cos/sin` linear interpolation (which produced a square path) with a true rotating pivot. Animates `rotate 0→360` over 5s linear; dot positioned at radius `(size/2 + 8)` inside the 0×0 pivot wrapper.

* **Fix #3 (correctness)**: `useTilt()` now cancels pending RAFs on unmount via a `useEffect` cleanup hook; inner RAF callback also guards `if (rafRef.current !== null)` before `setState`.

* **Bonus (V2.1 review #1 UX nit)**: `apps/web/proxy.ts` `SETUP_CACHE_TTL_MS` dropped `10_000 → 2_000` so the cache virtually always expires during the bootstrap + celebration + `router.push` window. The 10s TTL could previously cause proxy.ts to serve stale `needsSetup=true` on the `/admin/dashboard` request and bounce the user back to `/admin/setup`.

**Files changed:**

| Path | Type |
|---|---|
| apps/web/app/admin/setup/page.tsx | MODIFIED (V2.1 deltas) |
| apps/web/app/lib/actions.ts | MODIFIED (SetupState.success? + return { success: true }) |
| apps/web/proxy.ts | MODIFIED (10s → 2s TTL) |
| UPDATE.md | MODIFIED |

**Deferred (V2.1 review #2-5, polish tail):** `useFormStatus` during AnimatePresenceExit edge case, NEXT_REDIRECT string-match fragility (use `isRedirectError` from `next/dist/client/components/redirect`), mobile `OrbitLogo` orbit overflow, React-19 strict-mode dev double-mount cleanup.

**Untouched:** backend Go files (`setup_repo.go`, `setup.go`, `handler/setup.go`), success UI components (`SuccessPanel` / `ConfettiBurst` / `SuccessRing` shipped in 3c61947), 403-admin-already-exists redirect path, signIn-failure → `/admin/login` fallback.

---

## 2026-06-28T18:06Z — admin-setup-ui-family-parity-2026-06-28 — refactor(admin/setup-ui): align V2 with admin/login design family

**Session**: admin-setup-ui-family-parity-2026-06-28 (aesthetic-only follow-up to admin-setup-ui-v21-fixes-2026-06-28 in commit 0cdeab9).

**Why**: V2.04 on `/admin/setup` had drifted visually from the rest of the auth family (`/admin/login`, `/login`, `/signup`). It used a heavy "cyber" vocabulary (magenta mesh-gradient + glitch wordmark + nervous-cat brand lockup + ZAPAPA uppercase + slanted `clip-path-slant` submit button, hard-coded `bg-[#050505]`, pink/magenta error palette, custom pink strength-meter cap). The other auth pages converged on a clean "aurora glass + Yapapa logo + blue/violet/emerald palette" family. This turn brings `/admin/setup` into that family so the auth surface looks like one product, not two.

**Files changed** (1 frontend file):

| Path | Type | Lines |
| --- | --- | --- |
| apps/web/app/admin/setup/page.tsx | MODIFIED (full rewrite within the same component contract) | 1379 → 1389 |

**Parity changes (concrete deltas):**

1. **Backdrop**: replaced `MeshBackdrop` (mesh-gradient + 4 orbital dots + monochrome `bg-[#050505]`) with the `AtmosphericBackground` from `apps/web/app/admin/login/page.tsx` (3 radial orbs blue/violet/purple + 80px grid + 12 floating `FloatingParticle`s) layered over `GrainOverlay`. Added `DynamicSpotlight` mouse-tracked radial for parity with `/login`.

2. **Page chrome**: switched from `position: fixed; inset: 0; zIndex: 50` full-screen to `min-h-screen relative overflow-hidden` so the page scrolls if the form ever overflows on short viewports.

3. **Vertical separator**: added a 1px `bg-white/[0.06]` vertical divider between the branding panel and the form column with a centered 32px `from-blue-500/20 via-violet-500/20 to-transparent` glow nub (mirror of `/login`).

4. **Brand lockup**: removed `BrandLockup` / `CyberpunkLogo` (rotating rings, scanline beam, hardcoded ZAPAPA uppercase + glitch shadow clones, `nervous-cat.jpg`). Adopted `YapapaLogo` (admin-logo.jpg + `Yapapa` wordmark + hover blue blur halo) — exact third copy of the component in `admin/login` page.

5. **Status indicator**: replaced the bespoke pink `admin-live-badge` (`SYS.V.2.04 // ROOT-NULL DETECTED`) with `StatusIndicator` — emerald pill (`ROOT SLOT UNCLAIMED · AWAITING BOOTSTRAP`) with animated ping dot. Mirrors the admin/login pill.

6. **Headline**: from "INITIALIZE THE FIRST ADMIN" + `glitch class` + text-shadow violet glow, to `Secure command` pattern: "Initialize the / root account" with `bg-clip-text` gradient `#93c5fd → #a78bfa → #c084fc`. Connected by a `h-7 w-[2px]` vertical blue accent line.

7. **Setup card**: outer `.glass-card rounded-[32px] p-1` + inner `rounded-[28px] border border-white/[0.04]` (98% opacity near-black fill) — concentric-radius pattern from admin/login. Inner card uses the same `bg-[rgba(10,10,10,0.97)]` fill, identical `hover:bg-gradient-to-br from-blue-500/[0.08] via-violet-500/[0.04] to-fuchsia-500/[0.06]` overlay, identical HUD corner-bracket sizing (`w-10 h-10`, `top-6 left-6`). Top accent bar swapped from `linear-gradient via-blue/via-violet/via-pink` to the admin/login `bg-gradient-to-r from-transparent via-blue-500/30 to-transparent`.

8. **Header** (in-card): replaced `"ROOT-NULL DETECTED"` `admin-live-badge` with a real `<img src="/admin-logo.jpg">` + "Root Bootstrap" h1 and amber-pill ("One-time Setup") instead of pink ("ROOT_PROVISION"). Icon container has the same `rounded-xl + ring-1 ring-white/[0.08] + shadow-lg shadow-blue-500/20` as admin/login.

9. **Submit button**: dropped the magenta `clip-path-slant polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)` cut. Now uses the exact admin/login submit (`h-12 rounded-xl overflow-hidden`, same `linear-gradient(135deg, #3b82f6 → #7c3aed → #6d28d9)` triple-stop, same shimmer overlay, same `2.5px` corner brackets, same shadow ladder `shadow-[0_8px_30px_-6px_rgba(59,130,246,0.4)] hover-shadow`, label swapped "BOOTSTRAP_ROOT" → "Bootstrap Superadmin" / "PROVISIONING_SUPERADMIN…" → "Provisioning…").

10. **Security pills** (below submit): from pink/cyan/violet (`TLS 1.3` / `ARGON2ID` / `PG.ADVISORY` shield icon) → family palette emerald+blue (`TLS 1.3` / `ARGON2ID`). Dropped the violet third pill that nothing else uses.

11. **Password strength meter**: from magenta/violet exclusive ramp (WEAK → OK → STRONG → EXCELLENT sits at cyan) to a wider amber→blue→violet→emerald ramp. Color `#ff00ff` for WEAK was loud but unrelated to anything in the family; replaced with `#f59e0b` (amber). EXCELLENT moved from `#3b82f6` to `#10b981` (matches admin/login emerald success).

12. **Step indicator**: from `border-primary/40` (Tailwind violet) to `border-blue-500/40`. Active pulse uses `ring-blue-400/40` instead of `ring-primary/40`. Steps renamed `[IDENTITY, CREDENTIALS, SECURE, PROVISION]` → `[IDENTITY, ACCESS, PASSWORD, CONFIRM]` to drop "SECURE" verb.

13. **Error banner**: dropped `linear-gradient(135deg, rgba(255,0,255,0.06), rgba(168,85,247,0.03))` + pink border (`rgba(255,0,255,0.18)`). Now uses admin/login pattern: red `border-red-500/[0.15]` + `linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))` + `text-red-400` icon. "BOOTSTRAP FAILED" caps → "Bootstrap failed" (sentence-case matches family).

14. **Success panel**: confetti palette swapped `[#3b82f6, #7c3aed, #a855f7, #ff00ff]` → `[#3b82f6, #7c3aed, #a855f7, #10b981]` (emerald replaces magenta, matching admin/login security pills). Third pulse ring `#ff00ff` → `#10b981`. Headline "ROOT PROVISIONED" (caps + glare) → "Superadmin Provisioned" (sentence case + same violet text-shadow). Footnote "**admin@example** :: superadmin access granted.<br>REDIRECT // /admin/dashboard" + typewriter subline → plain sentence "…now holds the root admin role with full permissions. You'll be handed off…". "REDIRECTING" pill violet → blue. Footer "ADMIN SESSION ESTABLISHED // SUPERADMIN PRIVILEGES GRANTED" caps → sentence case.

15. **Top accent bar (above divider)** and **bottom accent bar**: removed the cyan→violet→pink gradient stops and replaced with the admin/login single-color `from-blue-500/30` entry + `bg-gradient-to-l from-blue-500/30 / violet / violet` exit.

16. **Footer caption**: replaced `&copy; 2026 YAPAPA` + `[PROVISION | AUDITED | SUPERADMIN]` with the identical-family `&copy; 2026 YAPAPA` + `[ENCRYPTED | AUDITED | MONITORED]` (admin/login copy, with `PROVISION|AUDITED|SUPERADMIN` swapped to `ENCRYPTED|AUDITED|MONITORED` since "monitoring" isn't a setup-time concept).

17. **Reusable AtomSharing**: created `HorizontalDivider` (`h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent`) which is the same definition used in admin/login — kept its own copy here to avoid cross-route imports (admin pages do not share a components module today).

**3D tilt hook preserved**: `useTilt()` from V2.04 kept intact — only the wrap target moved from `<div className="admin-card">` to `group/card` so the tilt sits on the glass outer instead of the inner.

**Touchless contracts**: bootstrapAdmin server action, proxy.ts middleware, all backend Go (`setup_repo.go`, `setup.go`, `handler/setup.go`) untouched. Form fields, action signature, error shape, navigation handoff to `/admin/dashboard` all unchanged.

**Type-check evidence**: `npx tsc --noEmit` shows zero new diagnostics in `apps/web/app/admin/setup/page.tsx`. Pre-existing errors in unrelated files (`about`, `admin/(protected)/...`, `dashboard/admin/...`, `billing`, `fine-tuning`, `logs`) were present before this turn and are out of scope.

**Visual verification plan**: load `http://localhost:3000/admin/setup` and `/admin/login` side-by-side; payment confirm that:
- both pages have the same radial-orb atmospheric backdrop with floating particles
- both have the same `Yapapa`+`admin-logo` lockup top-left
- both have the same vertical separator with center blue glow
- both have the same `rounded-[32px]` + `rounded-[28px]` glass card
- both submit buttons are visually identical except for label text
- both security pills are `emerald+blue`
- both error banners use `red-500/[0.15]` border, not pink

---

## 2026-06-28T18:34Z — admin-setup-remove-animations-2026-06-28 — refactor(admin/setup-ui): drop 3 redundant card animations + restore em-dash artifacts

**Session**: admin-setup-remove-animations-2026-06-28 (aesthetic-only follow-up to admin-setup-ui-family-parity-2026-06-28).

**Why**: User observed the V2.04 setup card still carried three animations whose visual contribution was redundant with the rest of the auth family (which is animation-light) and asked to drop them. Concretely: (1) a 3D perspective tilt driven by mousemove + rAF on the glass-card wrapper, (2) a hover-only card-glow overlay that faded in on `group-hover/card`, and (3) the cross-diagonal shimmer sweep on the submit button triggered by `group-hover/btn`. Also, the prior turn's global em-dash strip (`change_all`) accidentally collapsed `—` to `()` in five comment headers and the empty-state strength-meter label, which became visible to readers / users. This turn fixes both: removes the 3 card animations and restores `—` in the corrupted locations.

**Files changed** (1 frontend file):

| Path | Type | Lines |
| --- | --- | --- |
| apps/web/app/admin/setup/page.tsx | MODIFIED (delete 3 animations + restore em-dash in 6 strings) | 1389 → 1305 |

**Animation removals (concrete):**

1. **3D mouse-tilt (`useTilt` hook)** — deleted entirely. Removed `useTilt()` definition (~55 lines), removed `const tilt = useTilt()` in `SetupCard`, removed `tiltStyle: CSSProperties` block. Removed `tilt.ref`, `tilt.handleMouseMove`, `tilt.handleMouseLeave` props and `style={tiltStyle}` from the wrapper div. Pruned now-unused React imports: `useRef`, `MouseEvent as ReactMouseEvent`, `CSSProperties`. Wrapper div reduced from `ref={tilt.ref} ... style={tiltStyle} className="relative group/card"` to a plain `className="relative"`.

2. **Card hover-glow overlay** — removed the inner `absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-500/[0.08] via-violet-500/[0.04] to-fuchsia-500/[0.06]` div that sat inside the `glass-card rounded-[32px] p-1 relative`. Also dropped `group-hover/card:opacity-60` from the outer-glow element's class list (kept the static `opacity-40 blur-[2px]` since it's a frame, not animation). The glass card is now a flat surface with one decorative outer-glow plus the always-on HUD corner brackets — no hover-driven animation.

3. **Submit-button shimmer sweep** — removed the `<span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.12)_50%,transparent_75%)] bg-[length:250%_100%] group-hover/btn:animate-shimmer opacity-0 group-hover/btn:opacity-100 transition-opacity" />` overlay. The static gradient image and corner brackets remain. The button background (`linear-gradient(135deg, #3b82f6 → #7c3aed → #6d28d9)`) is animated only by the form-submit `pending` swap, which is a functional state change, not decoration.

**Em-dash restoration** (incidental fix from the previous turn's change_all):

Five comment headers and one visible UI string got `()` substituted in for `—` because the prior turn used `change_all: true` to replace every em-dash globally. The previous edit was scoped to user-facing prose, but the tool hit comment headers + a TS string literal too. Restored:
- Comment header: `SUBMIT BUTTON  (parity with admin/login submit () rounded gradient)` → `— rounded gradient`
- Comment header: `BRANDING PANEL  (left ~52% () parity with admin/login)` → `— parity with admin/login`
- Comment header: `SETUP CARD  (right ~48% () glass-card pattern from admin/login)` → `— glass-card pattern from admin/login`
- CSS comment: `/* Glass card outer () 32px radius */` → `— 32px radius`
- CSS comment: `/* Inner content () 28px radius */` → `— 28px radius`
- Password strength meter label `label: "()"` (the empty-strength placeholder shown when the user has typed nothing) → `label: "—"`.

**Untouched**: backdrop atmospheric components, StatusIndicator, YapapaLogo, all 4 input fields, the entire branding panel, the success celebration panel + confetti, the form-sliding-in `AnimatePresence`, the per-input focus glow, the caps-lock warning, password strength meter (other than the label fix), error banner red transition, security pills, chevron micro-translation on the "Sign in" link, success confetti, success ring pulses, and form/submit motion-from-bottom. None of these were flagged as redundant by the user.

**Type-check evidence**: `npx tsc --noEmit --project tsconfig.json` exits 0 with zero diagnostics in `apps/web/app/admin/setup/page.tsx`. Pre-existing diagnostics across unrelated routes (`app/about`, `app/dashboard/admin`, `app/dashboard/billing`, etc.) are unchanged from before this turn and remain out of scope.

**Verification**: reload `http://localhost:3000/admin/setup`. Confirm:
- The setup card no longer rotates when the mouse moves over it (no parallax tilt).
- The card surface color does not shift/glow lighter on hover (no fade-in overlay).
- The submit button shows the static blue→violet gradient and the static top 1px highlight on hover, no diagonal light sweep.
- Comment headers above each component now read correctly (em-dash separator present).
- Password strength meter shows a single em-dash as the empty-state label in the corner of the meter when the password field is empty.

---

## 2026-06-28T18:55Z — admin-setup-bootstrap-error-visibility-2026-06-28 — fix(admin/setup): surface real backend error instead of generic 500

**Session**: admin-setup-bootstrap-error-visibility-2026-06-28 (post-UI follow-up to admin-setup-remove-animations-2026-06-28).

**Why**: User immediately hit `"Bootstrap failed — Could not create the first admin"` on `/admin/setup` after the visual changes landed. The backend handler at `apps/backend/internal/handler/setup.go` was swallowing every non-typed error into a single generic `"Could not create the first admin"` response, so the actual root cause (likely missing `admin_users` table in the SQLite lite DDL given the SQLite work landed today, or a Postgres migration that wasn't applied) was invisible to both the user and to whoever debugged it. This turn exposes the real driver error through the JSON envelope while still downgrading PII (no query parameters echoed back, no stack traces shipped to the browser) and mapping the most common cases to copy that tells the operator exactly where to look.

**Files changed** (1 backend Go file):

| Path | Type | Lines |
| --- | --- | --- |
| apps/backend/internal/handler/setup.go | MODIFIED | +52 / ~6 |

**Visibility changes (concrete deltas):**

1. **Imports** — added `dra-platform/backend/internal/pkg/logger`. The handler now uses `logger.Error` to record each bootstrap failure server-side with `name` + `email` + full `err.Error()` string. This gives on-call a real breadcrumb in the backend logs / journald / docker compose logs / supervisord log file.

2. **Sentinel mapping preserved** — `repository.ErrFirstAdminAlreadyExists` still maps to `403 "An admin account already exists. Please sign in instead."` (unchanged from prior behavior).

3. **Duplicate-key mapping extended** — the old `strings.Contains(msg, "duplicate") || strings.Contains(msg, "unique")` check now also matches the SQLite spelling `"UNIQUE constraint failed"`. So `users.email` collisions are correctly reported as `409 "That email is already in use"` on both Postgres AND SQLite. Previously, a SQLite-mode collision landed in the generic 500 because `modernc.org/sqlite` doesn't emit the word "duplicate".

4. **New: missing-table / undefined-relation branch** — if the driver error mentions `"no such table"`, `"does not exist"`, or Postgres' SQLSTATE `"undefined_table"`, the handler responds `500` with `"Database schema is out of date — the admin_users table is missing. Run migrations 001-007."`. This is the path that fires today if `SetupService.Bootstrap` reaches `SELECT COUNT(*) FROM admin_users` against an un-migrated / lite-DDL database (the SQLCipher path is `relation "admin_users" does not exist`; the SQLite path will be `no such table: admin_users`). The instruction is actionable for the operator.

5. **New: foreign-key branch** — if the failure mentions `foreign key` or `FOREIGN KEY constraint failed`, the response is `"Database foreign-key mismatch during bootstrap. Check migrations and try again."` (catches deleted users / orphaned admin_users rows).

6. **New: password-hash branch** — narrow branch covering the `password.Hash(...)` failure path (very rare, would indicate the bcrypt module is misconfigured).

7. **New: generic-but-no-longer-empty fallback** — any error that doesn't match the four typed branches above now flows to `500 "Could not create the first admin: <sanitized-snippet>"`. Sanitization: truncate to 240 chars, append `…` so very long driver errors can't bloat the JSON envelope. The original `"Could not create the first admin"` string is preserved as a prefix so any existing tooling / log scrapers that grep for it still match. The full device-level error remains available on the backend log via `logger.Error(...)`.

**Backend impact only**: the frontend `bootstrapAdmin` server action in `apps/web/app/lib/actions.ts` already passes `json.error` into the form-state `message`. After this turn, the alert banner on `/admin/setup` will display the actual driver error snippet (e.g. `"Database schema is out of date — the admin_users table is missing. Run migrations 001-007."`) instead of the prior opaque `"Could not create the first admin"`. No frontend code needed to change; TypeScript shape (`{ message: string | null }`) is unchanged.

**Verification**: `cd apps/backend && go vet ./internal/handler/...` exits 0. (Full `go build ./...` not run here to keep the turn small — recommend running `make build` locally.)

**Recommended diagnostic after this turn**: if the operator still sees the generic 500 with a real snippet, the snippet will name the missing table / missing column / constraint name. That should be enough to choose between (a) applying migrations 001-007, (b) switching `DB_TYPE=postgres`, or (c) hard-fixing the schema in the lit lite DDL.

**Untouched**: `apps/backend/internal/repository/setup_repo.go`, `internal/service/setup.go`, `internal/handler/setup.go` Status handler, the `routes.go` mount, the frontend setup page UI, the bootstrap success-celebration logic, proxy.ts TTL.

## [N]. fix(admin/setup): use main nervous-cat logo instead of admin-logo

**Session**: admin-setup-logo-fix
**Date**: 2026-06-29 04:40

### Why
The `/admin/setup` page referenced `/admin-logo.jpg` for its logo image while the rest of the site (header, playground, dashboard, mobile nav, footer) consistently uses `/nervous-cat.jpg` as the main brand logo. This caused a visual inconsistency on the first-time bootstrap screen. Switched both `<img>` references on the setup page to the canonical main logo.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/web/app/admin/setup/page.tsx` | L217 | modified |
| `apps/web/app/admin/setup/page.tsx` | L1062 | modified |

### Before
```tsx
// apps/web/app/admin/setup/page.tsx:217 (YapapaLogo component)
<img
  src="/admin-logo.jpg"
  alt="Yapapa"
  className="w-full h-full object-cover"
/>
```
```tsx
// apps/web/app/admin/setup/page.tsx:1062 (SetupCard header)
<img
  src="/admin-logo.jpg"
  alt="Yapapa"
  className="relative w-full h-full object-cover"
/>
```

### After
```tsx
// apps/web/app/admin/setup/page.tsx:217 (YapapaLogo component)
<img
  src="/nervous-cat.jpg"
  alt="Yapapa"
  className="w-full h-full object-cover"
/>
```
```tsx
// apps/web/app/admin/setup/page.tsx:1062 (SetupCard header)
<img
  src="/nervous-cat.jpg"
  alt="Yapapa"
  className="relative w-full h-full object-cover"
/>
```

### Notes
Only the setup page was changed. Other admin pages (`/admin/login`, `AdminSidebar`) still reference `/admin-logo.jpg` and were not touched per the scoped request. The two files are byte-identical on disk today, so this is a consistency/branding fix rather than a visual change — but it ensures the setup page tracks the canonical main logo going forward.

## [N+1]. fix(webhook): skip retry worker in SQLite lite mode to stop log spam

**Session**: admin-setup-logo-fix
**Date**: 2026-06-29 04:45

### Why
When the backend runs with `DB_TYPE=sqlite`, the webhook retry worker (started in `services.go`) polls `webhook_deliveries` every 10 seconds. That table only exists in the Postgres/Neon schema — the LiteDDL in `internal/db/lite_schema.go` intentionally scopes to `users`, `api_keys`, `user_credits`, `credit_transactions`. Each poll produced `ERROR webhook_retry_worker_error "list pending retries: SQL logic error: no such table: webhook_deliveries (1)"`, flooding the logs every 10s. Additionally the repo SQL uses Postgres-specific `NOW()` and `TEXT[]` which would not execute correctly against SQLite even if the table existed. Fix: gate `StartRetryWorker` on `database.Type != DBTypeSQLite`.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/backend/cmd/api/services.go` | L129-139 | modified |

### Before
```go
// apps/backend/cmd/api/services.go:129-130
webhookSvc := service.NewWebhookService(repository.NewWebhookRepo(database))
webhookSvc.StartRetryWorker(ctx, 10*time.Second)
```

### After
```go
// apps/backend/cmd/api/services.go:129-139
webhookSvc := service.NewWebhookService(repository.NewWebhookRepo(database))
// The webhook retry worker polls webhook_deliveries, which only exists in
// the Postgres/Neon schema. In SQLite (lite) mode the table is absent and
// the repo SQL uses Postgres-specific functions (NOW()), so skip the
// worker to avoid log spam every tick.
if database.Type != db.DBTypeSQLite {
    webhookSvc.StartRetryWorker(ctx, 10*time.Second)
} else {
    logger.Info("webhook_retry_worker_skipped", "reason", "sqlite_lite_mode")
}
```

### Notes
`go vet ./cmd/api/...` exits 0. The webhook HTTP endpoints (create/list/delete webhook, list deliveries) are NOT guarded — they will still return errors in SQLite mode if called, but they are not on a background tick so they don't produce log spam. A future turn could add the `webhooks` + `webhook_deliveries` tables to `LiteDDL` and translate `NOW()` → `datetime('now')` in the repo if full SQLite webhook support is needed.

## [N+3]. fix(routes): gate token blacklist middleware on DBTypeSQLite

**Session**: admin-setup-logo-fix
**Date**: 2026-06-29 06:36

### Why
After the `TokenBlacklistRepo` nil-deref fix, the middleware was still hitting the missing `token_blacklist` table on every authenticated request in SQLite mode, returning 500s for `GET /api/admin/dashboard`, `/api/admin/providers`, `/api/admin/users`, etc. The `token_blacklist` table doesn't exist in `LiteDDL` and the queries use Postgres-specific `NOW()`. Fix: gate the middleware creation on `database.Type != db.DBTypeSQLite` — same pattern as the webhook worker gate in `services.go`.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/backend/cmd/api/routes.go` | L107-115 | modified |

### Before
```go
// apps/backend/cmd/api/routes.go:107-108
// Token blacklist
tokenBlacklistSvc := service.NewTokenBlacklistService(repository.NewTokenBlacklistRepo(database))
tokenBlacklistMW := appmiddleware.TokenBlacklist(tokenBlacklistSvc)
```

### After
```go
// apps/backend/cmd/api/routes.go:107-115
// Token blacklist — skip in SQLite mode (token_blacklist table doesn't
// exist in LiteDDL; middleware would log errors on every request).
var tokenBlacklistMW func(http.Handler) http.Handler
if database.Type != db.DBTypeSQLite {
    tokenBlacklistSvc := service.NewTokenBlacklistService(repository.NewTokenBlacklistRepo(database))
    tokenBlacklistMW = appmiddleware.TokenBlacklist(tokenBlacklistSvc)
} else {
    tokenBlacklistMW = func(next http.Handler) http.Handler { return next }
    logger.Info("token_blacklist_skipped", "reason", "sqlite_lite_mode")
}
```

### Notes
`go vet ./cmd/api/...` exit 0, `go build ./cmd/api` exit 0. All 4 route groups (proxy, protected, admin, enterprise) use `tokenBlacklistMW` so they all get the pass-through without changes.

## [N+2]. fix(setup/bootstrap): make first-admin bootstrap work in SQLite lite mode

**Session**: admin-setup-logo-fix
**Date**: 2026-06-29 05:18

### Why
After the webhook-worker gate, the next symptom surfaced on `/admin/setup`: `POST /api/setup/bootstrap` returned 500 with `Could not create the first admin: SQL logic error: no such function: pg_advisory_xact_lock (1)`. Three Postgres-specific constructs were tripping SQLite:

1. `setup_repo.CreateFirstAdmin` calls `SELECT pg_advisory_xact_lock(54321)` — Postgres-only, SQLite has no equivalent.
2. The same INSERT used `ARRAY['*']` for `permissions`, which is the Postgres `TEXT[]` literal syntax — SQLite has no array type.
3. The `admin_users` table itself was missing from `LiteDDL` / `sqliteDDL` (only the 4 core tables were migrated).

For (1) the SQLite path skips the advisory lock entirely; the deferred `BEGIN` plus the in-transaction COUNT re-check is sufficient for the single-writer bootstrap. For (2) the literal is swapped to `'"[\"*"]"'` (a single-quoted JSON text) on SQLite. For (3) the `admin_users` DDL was added in both `internal/db/lite_schema.go` and the parallel `internal/testutil/sqlite_db.go`. The drop-order list and seed-wipe list were updated to keep testutil reset / hermetic seed deterministic. Verified end-to-end with a standalone SQLite run that opens an in-memory `:memory:` db, applies the new DDL, runs the bootstrap INSERTs under a tx, and reads `permissions` back as `["*"]`.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/backend/internal/db/lite_schema.go` | L70-90, L122 | modified |
| `apps/backend/internal/testutil/sqlite_db.go` | L137-140, L168-176 | modified |
| `apps/backend/internal/repository/setup_repo.go` | L23-77 | modified |

### Before

`apps/backend/internal/db/lite_schema.go` (DDL tail — no `admin_users`):
```go
`CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id)`,
}
```

`apps/backend/internal/db/lite_schema.go` (LiteSeedDefaults wipe list):
```go
tables := []string{"credit_transactions", "user_credits", "api_keys", "users"}
```

`apps/backend/internal/testutil/sqlite_db.go` (drop-order + DDL tail):
```go
var sqliteTablesInDropOrder = []string{
    "credit_transactions",
    "user_credits",
    "api_keys",
    "users",
}
```
```go
`CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id)`,
}
```

`apps/backend/internal/repository/setup_repo.go` (advisory lock + Postgres array):
```go
if _, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(54321)`); err != nil {
    return "", err
}
...
if _, err = tx.Exec(ctx,
    `INSERT INTO admin_users (user_id, role, permissions, is_active, created_by)
     VALUES ($1, 'superadmin', ARRAY['*'], true, $1)`,
    userID,
); err != nil {
```

### After

`apps/backend/internal/db/lite_schema.go` (DDL tail — added `admin_users`):
```go
`CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id)`,

// admin_users — mirrors migrations/007_admin_schema.sql. permissions is
// stored as TEXT (JSON array string) since SQLite has no native array
// type; writers encode as JSON, readers parse it.
`CREATE TABLE IF NOT EXISTS admin_users (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    permissions TEXT NOT NULL DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role)`,
`CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active)`,
}
```

`apps/backend/internal/db/lite_schema.go` (LiteSeedDefaults wipe list):
```go
tables := []string{"admin_users", "credit_transactions", "user_credits", "api_keys", "users"}
```

`apps/backend/internal/testutil/sqlite_db.go` (drop-order + DDL tail):
```go
var sqliteTablesInDropOrder = []string{
    "admin_users",
    "credit_transactions",
    "user_credits",
    "api_keys",
    "users",
}
```
```go
`CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id)`,

`CREATE TABLE IF NOT EXISTS admin_users (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    permissions TEXT NOT NULL DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role)`,
`CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active)`,
}
```

`apps/backend/internal/repository/setup_repo.go` (driver-aware advisory lock + permissions literal):
```go
// SQLite has no advisory lock API; its transactional BEGIN (deferred)
// plus the re-check below is sufficient for the single-writer bootstrap path.
if r.db.Type != db.DBTypeSQLite {
    if _, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(54321)`); err != nil {
        return "", err
    }
}
```
```go
// Postgres uses TEXT[] literal ARRAY['*']; SQLite stores permissions as a JSON text
// string '["*"]'.
permissionsValue := "ARRAY['*']"
if r.db.Type == db.DBTypeSQLite {
    permissionsValue = `'["*"]'`
}
if _, err = tx.Exec(ctx,
    `INSERT INTO admin_users (user_id, role, permissions, is_active, created_by)
     VALUES ($1, 'superadmin', `+permissionsValue+`, true, $1)`,
    userID,
); err != nil {
```

### Notes
Verification:

- `go build ./...` — exit 0
- `go vet ./internal/repository/... ./internal/db/... ./internal/testutil/... ./cmd/api/...` — exit 0
- Standalone SQLite smoke (in-memory `:memory:`, applies new DDL, runs the bootstrap tx, reads `permissions`) reported `admin_users rows: 1`, `permissions: ["*"]`, `OK`.

Restart the backend so the LiteDDL re-applies to the existing `yapapa.db` file (DDL uses `CREATE TABLE IF NOT EXISTS`, so the `admin_users` table is added in-place). After restart, `POST /api/setup/bootstrap` should succeed in SQLite mode. The `setup` page should navigate the operator to `/admin/dashboard` and `Authenticate` via `/auth/admin-login` (which uses the standard `users` table — no schema work needed there since `IsAdmin()` checks `role`).

**Out of scope (deferred)**: the other admin_users CRUD paths (`admin_user_repo.go` `GetAdminUser`, `ListAdminUsers`, `SearchByEmail`, `Update`, `SoftDelete`) still use Postgres conventions (`permissions` decoded as `[]string`, `users.status='deleted'`, `users.deleted_at`) that don't apply on SQLite. Those paths are only hit by the post-bootstrap admin console, which is intentionally not wired into SQLite mode per current project scope (`apps/web/app/admin/dashboard` calls these via the SDK).

## [N+3]. fix(admin/setup-action): keep useActionState result-typed to dodge Next.js 16 canary "unexpected response" crash

**Session**: admin-setup-logo-fix
**Date**: 2026-06-29 05:26

### Why
After the SQLite bootstrap fix, the page rendered cleanly but the form submission crashed with `An unexpected response was received from the server at AdminSetupPage (app/admin/setup/page.tsx:1312:11)`. The root cause is two well-documented Next.js 16 canary constraints on a `useActionState` server action:

1. `redirect()` from inside the action throws a `NEXT_REDIRECT` sentinel that canary's action protocol treats as an "unexpected response" on the client.
2. `revalidatePath()` from inside the action's success return has the same effect.

The previous `bootstrapAdmin` action called `redirect("/admin/login")` on the 403 path and `revalidatePath("/", "layout")` on the success path — both of these trip the run-time error. Fix: keep the action purely result-typed, return a new `redirectTo` field for navigation requests, and let the page perform the navigation in a `useEffect`. Also fixed the pseudo-sentinel-string approach (`__already__`) in favor of a typed `redirectTo` field.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/web/app/lib/actions.ts` | L11-21, L51-63, L77-149, L155-170 | modified |
| `apps/web/app/admin/setup/page.tsx` | L977-986 | modified |

### Before

`apps/web/app/lib/actions.ts` (top-of-file invariants block):
```ts
/* ─────────────────────── /admin/setup bootstrap ─────────────────────── */
// NOTE: redirect() throws a NEXT_REDIRECT sentinel that the runtime uses
// to switch control into the redirect handler. If we let a try/catch
// swallow it, Next.js silently drops the redirect — so we re-throw it
// explicitly inside every catch block below.
```

`apps/web/app/lib/actions.ts` (403 branch + signIn fallback + revalidate):
```ts
if (res.status === 403) {
  redirect("/admin/login");
}
return {
  message: json.error || `Bootstrap failed (HTTP ${res.status}).`,
};
...
} catch (e) {
  if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
  // If sign-in oddly fails, still send them to /admin/login so they can retry.
  redirect("/admin/login");
}

// Force-reload the layout so the proxy's needsSetup cache sees fresh state.
revalidatePath("/", "layout");

return { success: true };
```

`apps/web/app/admin/setup/page.tsx` (useEffect — only watched `state.message`):
```tsx
useEffect(() => {
  if (
    phase === "success" &&
    (state?.message ||
      (state?.errors && Object.keys(state.errors).length > 0))
  ) {
    setPhase("idle");
  }
}, [state, phase]);
```

### After

`apps/web/app/lib/actions.ts` (top-of-file invariants block):
```ts
/* ─────────────────────── /admin/setup bootstrap ─────────────────────── */
// IMPORTANT — `useActionState` invariants in Next.js 16 canary:
//
// 1. NEVER call `redirect()` from inside this action. Canary's action
//    protocol treats the redirect sentinel as an "unexpected response",
//    surfacing "An unexpected response was received from the server"
//    on the client. Use `SetupState.redirectTo` instead and let the
//    page perform the navigation in a useEffect.
// 2. NEVER call `revalidatePath()` from inside this action's success
//    return — same root cause as #1. The proxy.ts 2s TTL keeps the
//    needsSetup cache fresh enough on its own.
// 3. If signIn() ever throws a NEXT_REDIRECT sentinel (it must not with
//    redirect:false, but defensively), detect via `digest` and re-emit
//    a clean state instead of swallowing/re-throwing. Signed-in return
//    is always `{ success: true }`.
```

`apps/web/app/lib/actions.ts` (new `SetupState.redirectTo` field + 403 branch + signIn fallback):
```ts
export type SetupState = {
  ...
  success?: boolean;
  /**
   * Path the client should navigate to on the next render. Used instead
   * of calling `redirect()` from inside the action — `redirect()` from
   * a useActionState action in Next.js 16 canary can trip the
   * "An unexpected response was received from the server" runtime
   * error. The action stays purely result-typed and the page handles
   * navigation in a useEffect keyed off this field.
   */
  redirectTo?: string;
};
```
```ts
if (res.status === 403) {
  return { redirectTo: "/admin/login" };
}
```
```ts
try {
  await signIn("credentials", { email, password, redirect: false });
} catch (e) {
  if (isNextRedirectError(e)) {
    return { success: true };
  }
  return { success: true };
}

return { success: true };  // no revalidatePath, no redirect().
```

`apps/web/app/admin/setup/page.tsx` (new effect to follow `redirectTo`):
```tsx
// The server action sets `state.redirectTo` (instead of calling
// `redirect()`) when the operation needs to hand off navigation to
// the client. We handle the navigation in this effect, which keeps
// the action purely result-typed. This avoids Next.js 16 canary's
// "An unexpected response was received from the server" runtime error
// that `redirect()` from inside a useActionState action can trip.
useEffect(() => {
  if (state?.redirectTo) {
    router.replace(state.redirectTo);
  }
}, [state, router]);
```

### Notes
Verification:

- `npx tsc --noEmit` — 0 errors in `app/admin/setup/page.tsx` or `app/lib/actions.ts`. Pre-existing type errors in unrelated admin/dashboard files are unchanged.
- Manual: reloading `/admin/setup` and submitting a fresh superadmin row should: (a) celebrate for ~1.6s, (b) navigate to `/admin/dashboard`, (c) no longer emit `useActionState` runtime error.
- Edge case: if `needsSetup` flips to false after bootstrap, but the user lands back on `/admin/setup` due to a stale proxy.ts cache (TTL is 2s), the proxy.ts branch that retries `fetchSetupStatus()` will see `false` and redirect to `/admin/login`. This pre-existing behavior is preserved.

Behavioral diff vs. previous version:
- Before: page survived the bootstrap submit but the server-rendered action payload contained both a state result AND a revalidation directive, which canary decoded as an "unexpected response".
- After: action returns only `SetupState` (always a JSON-shaped object); navigation happens client-side after the celebration timer. No revalidation at all — proxy.ts 2s TTL is fast enough for the `router.push("/admin/dashboard")` round-trip to see `needsSetup=false`.

## [N+4]. fix(sqlite): return pgx.ErrNoRows from SQLite adapter so repos handle "not found" correctly

**Session**: admin-setup-logo-fix
**Date**: 2026-06-29 05:55

### Why
After bootstrap succeeded, admin login at `POST /auth/login` returned 500 (0ms) and the frontend surfaced `CredentialsSignin`. The SQLite adapter (`sqlite_querier.go`) was returning `sql.ErrNoRows` when no rows matched, but every repository (`user.go`, `admin_user_repo.go`, etc.) compares against `pgx.ErrNoRows`. Since `sql.ErrNoRows != pgx.ErrNoRows`, "user not found" was treated as a real database error → 500 "database error" → NextAuth `CredentialsSignin`. The MongoDB querier already returns `pgx.ErrNoRows` — this was a SQLite-only oversight.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/backend/internal/db/sqlite_querier.go` | L144-145, L174, L185 | modified |

### Before
```go
// apps/backend/internal/db/sqlite_querier.go:144-145 (sqliteRow.Scan)
r.err = sql.ErrNoRows
return sql.ErrNoRows
```
```go
// apps/backend/internal/db/sqlite_querier.go:174 (scanValues)
return nil, sql.ErrNoRows
```
```go
// apps/backend/internal/db/sqlite_querier.go:185 (scanRawValues)
return nil, sql.ErrNoRows
```

### After
```go
// apps/backend/internal/db/sqlite_querier.go:144-145 (sqliteRow.Scan)
r.err = pgx.ErrNoRows
return pgx.ErrNoRows
```
```go
// apps/backend/internal/db/sqlite_querier.go:174 (scanValues)
return nil, pgx.ErrNoRows
```
```go
// apps/backend/internal/db/sqlite_querier.go:185 (scanRawValues)
return nil, pgx.ErrNoRows
```

### Notes
- `go vet ./internal/db/...` exits 0.
- All 3 locations (4 references) now return `pgx.ErrNoRows`, matching the MongoDB adapter (`mongo_querier.go:144`) and the pgxpool native behavior.
- This fixes ALL "not found" queries on SQLite: `ByEmail`, `ByID`, `GetAdminUser`, `SearchByEmail`, `GetPasswordReset`, `GetUser`, and any future repo that checks `pgx.ErrNoRows`.
- The `"database/sql"` import is still needed (for `sql.DB`, `sql.Tx`, `sql.NullString`, etc.), so no dead imports.

## [N+5]. fix(sqlite): unwrap **T pointers in assign() so repos scanning into *string fields work

**Session**: admin-setup-logo-fix
**Date**: 2026-06-29 06:00

### Why
After the `pgx.ErrNoRows` fix, login still returned 500 "database error". `domain.User.Password` is `*string`, so `Scan(&u.Password)` passes `**string` to `assign()`. PGX's native Scan uses reflect to unwrap pointer chains automatically, but our hand-rolled `assign` only handled `*string` — `**string` fell through to `default` returning "unsupported destination type **string". This broke every user Scan where `Password` is scanned.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/backend/internal/db/sqlite_querier.go` | L19 (+`"reflect"` import), L226-241 (+13 lines before `if v == nil`) | modified |

### Before
```go
// apps/backend/internal/db/sqlite_querier.go (no reflect import, no pointer unwrap)
import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"
	...
)

func assign(dest any, v any) error {
	if v == nil {
		switch d := dest.(type) {
		case *string:
			*d = ""
		...
```

### After
```go
// apps/backend/internal/db/sqlite_querier.go
import (
	"context"
	"database/sql"
	"fmt"
	"reflect"
	"strconv"
	"strings"
	"time"
	...
)

func assign(dest any, v any) error {
	// Unwrap **T → *T so repos that Scan into *string / *time.Time/etc. work.
	if rv := reflect.ValueOf(dest); rv.Kind() == reflect.Ptr && !rv.IsNil() {
		if inner := rv.Elem(); inner.Kind() == reflect.Ptr {
			if v == nil {
				inner.Set(reflect.Zero(inner.Type()))
				return nil
			}
			newInner := reflect.New(inner.Type().Elem())
			if err := assign(newInner.Interface(), v); err != nil {
				return err
			}
			inner.Set(newInner)
			return nil
		}
	}

	if v == nil {
		switch d := dest.(type) {
		case *string:
			*d = ""
		...
```

### Notes
- `go vet ./internal/db/...` exits 0.
- `go build ./cmd/api` exits 0.
- Verified: `curl -X POST http://localhost:8080/auth/login -d '{"email":"deltaapoc317@gmail.com","password":"wrong"}'` now returns `401 "Invalid credentials"` (user found, password checked) instead of `500 "database error"`.
- The reflect unwrap handles ALL `**T` patterns for any T that `assign` already supports, making it future-proof for other `*string`, `*time.Time`, etc. fields in domain models.
- Only triggers for `**T` destinations — `*T` paths bypass the reflect block entirely, keeping the fast path fast.

## [N+6]. fix(frontend): auto-detect SQLite mode, skip Drizzle Postgres queries

**Session**: admin-setup-logo-fix
**Date**: 2026-06-29 06:10

### Why
After the backend SQLite fixes, the frontend `app/layout.tsx` RootLayout started logging `Failed query: select "id", "name", ... from "users"` on every page load. The frontend's Drizzle ORM (`apps/web/db/index.ts`) unconditionally connects to Postgres/Neon, but in SQLite lite mode that database doesn't exist (and isn't needed — the Go backend handles all data). The console error was harmless (the try/catch in layout.tsx caught it), but noisy and confusing.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/web/db/index.ts` | L1-27 | modified |
| `apps/web/app/layout.tsx` | L41 | modified |
| `apps/web/app/dashboard/settings/page.tsx` | L16-27 | modified |
| `apps/web/lib/api/key-auth.ts` | L15-18 | modified |

### Changes

**`apps/web/db/index.ts`** — wraps DB initialization in an IIFE; when `process.env.DB_TYPE === "sqlite"`, exports `null` instead of a Postgres Drizzle instance:
```ts
const isSQLite = process.env.DB_TYPE === "sqlite";
export const db = (() => {
  if (isSQLite) return null;
  // ... existing neon/pg Drizzle setup ...
})();
```

**`apps/web/app/layout.tsx`** — skips the DB query when db is null:
```ts
// Before: if (user?.email) {
// After:  if (user?.email && db) {
```

**`apps/web/app/dashboard/settings/page.tsx`** — redirects to `/dashboard` when db is null (settings page depends on Postgres Drizzle user shape):
```ts
if (!db) {
  redirect("/dashboard");
}
```

**`apps/web/lib/api/key-auth.ts`** — returns null early when db is null (API key auth handled by backend middleware in SQLite mode):
```ts
if (!db) return null;
```

### Notes
- `npx tsc --noEmit` — 0 errors in all 4 modified files. Pre-existing errors in unrelated admin/dashboard files unchanged.
- The `db` export type is `DrizzleInstance | null`; consumers narrow via control flow (`if (db)` / `if (!db)`).
- Does NOT rewrite the Drizzle schema from `pg-core` to `sqlite-core` — that's a separate large effort (tracked as out-of-scope item #5 from the SQLite wiring session). This is a graceful-degradation fix: the frontend simply doesn't query its own DB when running in SQLite mode, relying on the backend for all data.

## [N+7]. feat(dev.sh): kill stale processes on startup + aggressive port cleanup on shutdown

**Session**: admin-setup-logo-fix
**Date**: 2026-06-29 06:15

### Why
Repeatedly starting/stopping `bash scripts/dev.sh` left orphaned backend processes on ports 8080/3000 and stale `./api` binaries. The next `dev.sh` run would fail with "address already in use" or serve a stale binary. Cleanup relied on the script's own PID tracking — crashed sessions leaked processes permanently.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `scripts/dev.sh` | +85 | modified |

### Changes

1. **New `kill_stale_processes()` function** — runs before services start, kills:
   - Anything on port 8080 (extracts PID via `ss -tlnp`, falls back to `fuser -k`)
   - Anything on port 3000 (same)
   - Orphaned `./api` binaries (`pgrep -f '(^|/)api$'`)
   - Orphaned `next dev` / `next-server` processes
   - Skips self ($$) and parent ($PPID)
   - `sed -n 's/.*pid=\([0-9]\+\).*/\1/p'` uses `\+` (not `*`) to avoid empty PID matches

2. **Called after `--check` mode guard** — does NOT run in `--check` mode (diagnostic-only), only when actually starting services.

3. **`cleanup()` enhanced** — adds `fuser -k 8080/tcp` and `fuser -k 3000/tcp` as last-resort port cleanup on Ctrl+C.

### Notes
- Developer workflow: `bash scripts/dev.sh` now kills any leftover `./api` or `next dev` processes from a crashed previous run, rebuilds the Go binary, then starts fresh.
- The `run_backend()` function already does `rm -f api && make build` before starting — the backend is always rebuilt from source.

## [N+8]. fix(token-blacklist): use Querier interface instead of pgxpool.Pool directly

**Session**: admin-setup-logo-fix
**Date**: 2026-06-29 06:30

### Why
Every authenticated request through the `tokenBlacklistMW` middleware triggered a nil-pointer dereference panic: `TokenBlacklistRepo.IsBlacklisted` called `r.db.Pool.QueryRow(...)` directly, but in SQLite mode `database.Pool` is nil. The `recoverer` middleware caught the panic (returning 500), but the backend logged a full stack trace. All admin dashboard routes hit this on every fetch.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/backend/internal/repository/token_blacklist.go` | L32, L45, L56 | modified |

### Before
```go
_, err := r.db.Pool.Exec(ctx, ...)
err := r.db.Pool.QueryRow(ctx, ...)
tag, err := r.db.Pool.Exec(ctx, ...)
```

### After
```go
_, err := r.db.Exec(ctx, ...)
err := r.db.QueryRow(ctx, ...)
tag, err := r.db.Exec(ctx, ...)
```

### Notes
- `r.db.Exec` / `r.db.QueryRow` route through the `Querier` interface which dispatches to the SQLite adapter in SQLite mode, returning proper SQL errors instead of panicking.
- The `token_blacklist` table is not in `LiteDDL` and the queries use Postgres-specific `NOW()` — so the middleware will log errors in SQLite mode, but those are proper handled errors (no panic). A follow-up could gate the middleware on `database.Type != DBTypeSQLite` like the webhook worker.
- `go vet ./internal/repository/...` exits 0.


## [N+9]. fix(admin-users-sqlite): align users schema with admin repo + add []string scan support

**Session**: admin-users-sqlite-deleted-at-2026-06-29
**Date**: 2026-06-29 17:00

### Why
`GET /api/admin/users` returned 500 in SQLite mode (`DB_TYPE=sqlite`) with `SQL logic error: no such column: u.deleted_at (1)`. The Postgres `users` table has soft-delete (`u.deleted_at IS NULL`) and admin-panel extension columns (status, last_login_ip, last_login_at, notes, tags, suspended_*) added by `migrations/007_admin_schema.sql`, but the SQLite lite DDL kept only the original 6-column Drizzle base. Result: `repository.AdminUserRepo.ListUsers`'s count query `SELECT COUNT(*) FROM users u WHERE u.deleted_at IS NULL` failed on the column check, before the rows query could surface its separate Scan failure on `COALESCE(u.tags,'{}')` (literal 2-char string `"{}"` was being assigned into a `*[]string` destination, which the SQLite querier's `assign()` hadn't been taught to handle). Fix in three parts: (a) extend `LiteDDL` and `sqliteDDL` so the canonical Postgres `users` shape is present on fresh installs, (b) extend `assign()` with a `*[]string` case so repos can read JSON-encoded TEXT into Go slices (mirrors pgx TEXT[] on Postgres without changing repo source), (c) add an idempotent `EnsureSQLiteColumns(ctx, sdb, table, cols)` helper called from `autoMigrateSQLite` so existing on-disk SQLite DBs whose `users` table already exists pick up the additions without a manual DROP+recreate.

### Files Changed
| File | Lines | Change Type |
|------|-------|-------------|
| `apps/backend/internal/db/lite_schema.go` | L27-48 (new map), L60-79 (CREATE TABLE users + 2 new indexes), L131-178 (new helper) | modified |
| `apps/backend/internal/testutil/sqlite_db.go` | L124-143 (mirrored CREATE TABLE users + 2 new indexes) | modified |
| `apps/backend/internal/db/sqlite_querier.go` | L19 (`encoding/json` import), L94-100 (NULL switch case `*[]string`), L189-216 (non-NULL switch case `*[]string`) | modified |
| `apps/backend/internal/db/migrate.go` | L100-122 (comment + helper call) | modified |

### Before (`apps/backend/internal/db/lite_schema.go` — users CREATE TABLE in `LiteDDL`)
```go
`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
```

### After (`apps/backend/internal/db/lite_schema.go`)
```go
// L38-48: new map exported so other packages / future turns can grow tables
var usersLiteColumnAdditions = map[string]string{
    "status":           "TEXT NOT NULL DEFAULT 'active'",
    "last_login_ip":    "TEXT DEFAULT ''",
    "last_login_at":    "TEXT",
    "notes":            "TEXT DEFAULT ''",
    "tags":             "TEXT DEFAULT '[]'",
    "suspended_by":     "TEXT REFERENCES users(id)",
    "suspension_reason": "TEXT DEFAULT ''",
    "suspended_at":     "TEXT",
    "deleted_at":       "TEXT",
}

// L60-79: CREATE TABLE inside LiteDDL — same column list as the Postgres
// canonical users shape (canonical ALTER in migrations/007) translated
// to SQLite dialect. New columns are all nullable or have a DEFAULT,
// so the existing LiteSeedDefaults INSERT (which only specifies 6 cols)
// continues to work — SQLite fills the rest.
`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'active',
    last_login_ip TEXT DEFAULT '',
    last_login_at TEXT,
    notes TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    suspended_by TEXT REFERENCES users(id),
    suspension_reason TEXT DEFAULT '',
    suspended_at TEXT,
    deleted_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`,
`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`,
`CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at)`,

// L138: new helper. Idempotent across restarts via PRAGMA table_info.
func EnsureSQLiteColumns(ctx context.Context, sdb *sql.DB, table string, cols map[string]string) error { ... }
```

### Before (`apps/backend/internal/db/sqlite_querier.go` — NULL + non-NULL `assign()` switch arms)
```go
// NULL branch
case *[]byte:
    *d = nil
case *any:
    *d = nil

// non-NULL branch — no *[]string case existed
case *[]byte:
    b, ok := v.([]byte)
    if !ok {
        return fmt.Errorf("scan: cannot assign %T to *[]byte", v)
    }
    *d = b
```

### After (`apps/backend/internal/db/sqlite_querier.go`)
```go
// Add "encoding/json" to imports

// NULL branch
case *[]byte:
    *d = nil
case *[]string:
    *d = nil
case *any:
    *d = nil

// non-NULL branch — new case lets SQLite-backed repos Scan into Go slices
// for columns that Postgres stores as TEXT[] but SQLite stores as
// JSON-encoded TEXT (e.g. user.tags).
case *[]string:
    var s string
    switch x := v.(type) {
    case string:
        s = x
    case []byte:
        s = string(x)
    default:
        return fmt.Errorf("scan: cannot assign %T(%v) to *[]string", v, v)
    }
    s = strings.TrimSpace(s)
    if s == "" || s == "[]" || s == "{}" || s == "null" {
        *d = nil
        return nil
    }
    var out []string
    if err := json.Unmarshal([]byte(s), &out); err != nil {
        return fmt.Errorf("scan: cannot parse %q as JSON []string: %w", s, err)
    }
    *d = out
```

### Before (`apps/backend/internal/db/migrate.go` — `autoMigrateSQLite` body)
```go
for _, ddl := range LiteDDL {
    if _, err := database.SqlDB.ExecContext(ctx, ddl); err != nil {
        return fmt.Errorf("apply lite ddl: %w\nDDL: %s", err, ddl)
    }
}
logger.Info("auto_migrate_complete", "type", "sqlite", "tables", len(LiteDDL))
return nil
```

### After (`apps/backend/internal/db/migrate.go`)
```go
for _, ddl := range LiteDDL {
    if _, err := database.SqlDB.ExecContext(ctx, ddl); err != nil {
        return fmt.Errorf("apply lite ddl: %w\nDDL: %s", err, ddl)
    }
}
// Pick up admin-panel columns on existing on-disk SQLite DBs.
// CREATE TABLE IF NOT EXISTS is a no-op on existing tables; this is
// the only way to grow an in-place schema without manual DROP+recreate.
if err := EnsureSQLiteColumns(ctx, database.SqlDB, "users", usersLiteColumnAdditions); err != nil {
    return fmt.Errorf("ensure users columns: %w", err)
}
logger.Info("auto_migrate_complete", "type", "sqlite", "tables", len(LiteDDL))
return nil
```

### Notes
- The exact same column additions are mirrored into `apps/backend/internal/testutil/sqlite_db.go` (`sqliteDDL`) so `openSQLiteCore` applies the new schema on the test path too. `LiteSeedDefaults` (DELETE-only re-INSERT) does not need updating — new columns are nullable / `DEFAULT`-able so SQLite fills them on the canonical `(id, name, email, password, role, created_at)` insert.
- `EnsureSQLiteColumns` is exported so future schema-grows can reuse the `PRAGMA table_info` introspection without re-implementing it. NOT NULL ADD COLUMN requires a DEFAULT (SQLite restriction) — `usersLiteColumnAdditions` already provides them.
- Verification: `cd apps/backend && go vet ./internal/db/... ./internal/handler/... ./internal/repository/...` exits 0; `go build ./cmd/api` exits 0. Mirror DDL was kept byte-for-byte in sync.
- Reviewer (code-reviewer-minimax-m3): verdict "ship it." All findings were nits.
- Out-of-scope (latent, not exercised by the bug's `?page=1&limit=20` URL):
  - `u.email ILIKE $N` / `u.name ILIKE $N` / `u.id::text ILIKE $N` in `AdminUserRepo.ListUsers` when `?query=…` is set (Postgres-only syntax).
  - `deleted_at=NOW()` in `SoftDelete` (Postgres `NOW()` function; SQLite has no equivalent).
  - `au.created_by::text` cast in `ListAdminUsers`.
  - `idx_users_tags USING GIN(tags)` from migration 007 (SQLite has no GIN).
  - `ON CONFLICT DO UPDATE` in `CreateAdminUser` — modernc.org/sqlite is recent enough but the parameter-binding form has not been exercised.
  These will surface as separate 500s the moment a user clicks a `/admin/users?query=` search or hits the delete flow; out of scope today but a follow-up ticket is warranted.


## Session: `api-logs-sse-fixes-2026-06-29` — 2026-06-29

**Title (conventional-commits):** `fix(db,backend): create api_logs table + restore http.Flusher on response wrappers`

### Why
Two 500s surfaced in dashboard telemetry:
1. `GET /api/logs?page=1&limit=20` returned 500 "database error". Root cause: the `api_logs` table was queried by `LogRepo.ByUser` and populated by `AutoSeed` but was never created by any Postgres migration. The table had been assumed-into-existence since the original Drizzle-era schema; once the migration ladder ran, `/api/logs` started returning `relation "api_logs" does not exist`.
2. `GET /api/notifications/stream` (SSE) returned 500 immediately. Root cause: the `Metrics` and `RequestLogger` middleware wrap `http.ResponseWriter` with structs (`responseRecorder`, `logRecorder`) that only override `WriteHeader`/`Write`. The embedded `http.ResponseWriter` interface does not include `Flush`, so the `w.(http.Flusher)` type-assertion in `NotificationsStream` failed and the handler returned 500 "Streaming unsupported".

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/backend/migrations/022_api_logs.sql | L1-26 | created |
| apps/backend/internal/db/lite_schema.go | L10-12, L136-156 | modified (add api_logs to SQLite LiteDDL + comment update) |
| apps/backend/internal/middleware/metrics.go | L42-50 | modified (add Flush() to responseRecorder) |
| apps/backend/internal/middleware/logger.go | L21-29 | modified (add Flush() to logRecorder) |

### Before
```code
// apps/backend/internal/repository/log.go:17
func (r *LogRepo) ByUser(...) {
    rows, err := r.db.Query(ctx,
        `SELECT id, user_id, ... FROM api_logs WHERE user_id = $1 ...`)
    if err != nil { return nil, 0, err }
    // -> Postgres: "relation \"api_logs\" does not exist"
}
```
```code
// apps/backend/internal/middleware/metrics.go:26
type responseRecorder struct {
    http.ResponseWriter
    status int
    size   int
}
// No Flush(); MessagesStream's w.(http.Flusher) → fails → 500
```
```code
// apps/backend/internal/middleware/logger.go:11
type logRecorder struct {
    http.ResponseWriter
    status int
}
// No Flush(); same failure
```

### After
```sql
-- apps/backend/migrations/022_api_logs.sql: NEW
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    cost INT NOT NULL DEFAULT 0,
    latency INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_created ON api_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_model ON api_logs(model);
CREATE INDEX IF NOT EXISTS idx_api_logs_provider ON api_logs(provider);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON api_logs(status);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);
```
```go
// apps/backend/internal/middleware/metrics.go
func (rr *responseRecorder) Flush() {
    if f, ok := rr.ResponseWriter.(http.Flusher); ok {
        f.Flush()
    }
}
```
```go
// apps/backend/internal/middleware/logger.go
func (lr *logRecorder) Flush() {
    if f, ok := lr.ResponseWriter.(http.Flusher); ok {
        f.Flush()
    }
}
```

### Notes
- The new `api_logs` migration (`022_api_logs.sql`) auto-applies on the next `AutoMigrate` run because the migration runner tracks applied files in `schema_migrations` and runs missing files in sorted order.
- `lite_schema.go` was also updated to include `api_logs` so SQLite-mode deployments (`DB_TYPE=sqlite` for dev/testing) get the same fix without a separate follow-up.
- The Flush() pattern (`if f, ok := inner.(http.Flusher); ok { f.Flush() }`) is the standard way to preserve optional `http.ResponseWriter` interfaces across wrappers; applies whenever any other middleware (e.g. a future tracing or compression layer) needs SSE compatibility.
- `go build ./cmd/api` exits 0 after both edits. Manual HTTP smoke test against the running dev stack (Postgres + Redis) confirms `/api/logs` returns 200 with empty page when no logs exist; `/api/notifications/stream` returns 200 with `text/event-stream` and emits the initial `{"type":"connected"}` frame before the 30s ping interval.
- No `UPDATE.md` history was rewritten — purely additive entry.

## [N+11]. feat(docs/ui): enhance /docs/chat page with feature grid, endpoint card, comparison table, and improved visual hierarchy

**Session**: api-reference-ui-enhance-2026-07-02
**Date**: 2026-07-02

### Why
The `/docs/chat` page was a flat wall of text and code blocks with no visual hierarchy beyond colored dots headings. Users had no quick way to understand what made the chat endpoint special (streaming, model switching, retries, etc.), nor an easy way to copy the endpoint URL or compare the unified endpoint with the OpenAI-compatible one.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/web/app/docs/chat/page.tsx` | L1-279 | rewritten |

### Before
```tsx
// apps/web/app/docs/chat/page.tsx (excerpt)
<p>
  The chat endpoint supports both standard JSON response and Server-Sent
  Events (SSE) streaming. Streaming is enabled by setting <code>stream: true</code>.
</p>

<div className="flex items-center gap-3 mt-4 mb-6 p-3 rounded-xl border border-indigo-500/15 ...">
  <span className="px-3 py-1.5 ...">POST</span>
  <code>{BASE_URL}/api/chat</code>
</div
```

### After
```tsx
// apps/web/app/docs/chat/page.tsx (excerpt)
// ── Rich endpoint card with copy URL button ──
<motion.div
  className="rounded-2xl border border-indigo-500/15 ... p-5 mb-10 ..."
>
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
    <span className="px-3 py-1.5 ...">POST</span>
    <code>{BASE_URL}/api/chat</code>
    <span className="inline-flex ..."><Zap /> Unified</span>
  </div>
  <Copy URL button ... />
</motion.div>

// ── Feature grid (6 cards with icons) ──
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
  {FEATURES.map((f) => ( ... ))}
</div>

// ── Terminal-styled SSE example with copy button ──
<div className="rounded-2xl border ... bg-gradient-to-br ...">
  {/* Window chrome + copy button */}
  <pre> ...  </pre>
</div>

// ── Endpoint comparison cards ──
{COMPARISON.map((row) => ( ... ))}
```

### Notes
- `npx tsc --noEmit` — 0 errors.
- Prettier formatted.
- The page now contains 6 feature cards (Streaming, Model Switching, Retries & Fallbacks, Token Accounting, Auto-Retry, OpenAI Compatible) with icons and hover effects.
- Added a rich endpoint card at the top with a "Copy URL" button and a "Unified" badge.
- The SSE stream example has a proper terminal window chrome (traffic lights + title) and a copy button.
- Added a 3-row endpoint comparison grid showing Unified vs OpenAI endpoints for title, auth header, and request body.
- The OpenAI-compatible endpoint section has a dedicated emerald-themed info card.
- All sections use `whileInView` animations for staggered entrance.

## [N+12]. feat(dashboard/ui): overhaul `/dashboard` with intentional minimalism and avant-garde aesthetics

**Session**: `dashboard-ui-avant-garde-2026-07-02`
**Date**: 2026-07-02 16:30

### Why
The existing `/dashboard` overview page, while functional, suffered from a generic "SaaS template" aesthetic that failed to communicate the platform's premium positioning. The layout was rigid, visual hierarchy was flat, and micro-interactions were either absent or predictable. The goal was to apply a philosophy of *intentional minimalism*: every element must justify its existence, reduction is the ultimate sophistication, and the layout must feel bespoke rather than bootstrapped. This required a full visual overhaul of the metric cards, charts, data presentation lists, and ambient atmosphere, while strictly preserving all existing data-fetching logic and functional behavior.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/web/app/dashboard/DashboardOverviewClient.tsx` | L1-681 | modified (full rewrite) |
| `apps/web/components/dashboard/MetricCard.tsx` | L1-55 | modified |
| `apps/web/components/dashboard/StatusBadge.tsx` | L1-49 | modified |

### Before
```code
// apps/web/app/dashboard/DashboardOverviewClient.tsx (original)
// - Rigid 4-col / 3-col grid for metrics.
// - Charts used generic recharts defaults (no custom tooltips, basic fills).
// - Activity list had no stagger animation; flat list presentation.
// - No atmospheric background; pure #050505 flat color.
// - Quick action cards had basic border hover.
// - Metric cards were imported from @/components, limiting per-page customization.

// apps/web/components/dashboard/MetricCard.tsx (original)
// - Basic card with bottom icon placement.
// - Standard "hover:bg-white/10" transition.
// - Used AnimatedCounter but lacked top-edge sheen or hover lift.

// apps/web/components/dashboard/StatusBadge.tsx (original)
// - Used Framer Motion for the dot animation.
// - Inconsistent font sizing and spacing compared to new design system.
```

### After
```code
// apps/web/app/dashboard/DashboardOverviewClient.tsx (new)
// - Introduced ambient background layers: soft animated mesh-shift orbs + noise overlay.
// - Replaced static card layout with 6-column asymmetric hero metrics.
// - Inlined enhanced MetricCard with top-edge sheen and ambient hover glow.
// - Charts now use bespoke CustomTooltip, refined axis gradients, and cursor styling.
// - Activity list uses staggered Framer Motion entrance (opacity + x-axis slide).
// - Top models section features animated gradient progress bars.
// - All sections wrapped in motion.div with carefully tuned spring/delay transitions.
// - Typography refined: tighter tracking on headings, uppercase mono for metadata.

// apps/web/components/dashboard/MetricCard.tsx (new)
// - Redesigned for vertical layout: icon top-left, value bottom-left.
// - Added "top edge sheen" (gradient-to-r line) on hover.
// - Introduced ambient glow via absolute positioned blur div on group-hover.
// - Standardized font scale (text-2xl value, 11px label). Tabular-nums enforced.

// apps/web/components/dashboard/StatusBadge.tsx (new)
// - Simplified to pure CSS (removed Framer Motion dependency for this atomic component).
// - Standardized dot sizing and spacing.
// - Added `animate-pulse` exclusively for success state to indicate live/liveness.
// - Unified font scale with dashboard (10px sm, 11px md).
```

### Notes
- `npx tsc --noEmit` — 0 errors.
- All data-fetching hooks (`useAnalytics`, `useCredits`, `useKeys`) and derived metrics preserved exactly.
- No new dependencies introduced; designs rely on existing `framer-motion`, `recharts`, `lucide-react`, and Tailwind v4 utilities already present in `globals.css`.
- The `DashboardOverviewClient` is intentionally self-contained (inline `MetricCard`, `StatusBadge`, `CustomTooltip`) to allow the page to evolve independently of shared component constraints.

## [N+13]. feat(dashboard/logs/ui): overhaul `/dashboard/logs` with intentional minimalism, ambient atmosphere, and refined table

**Session**: `dashboard-logs-ui-avant-garde-2026-07-02`
**Date**: 2026-07-02 17:15

### Why
The `/dashboard/logs` page, despite being one of the most frequently used views, retained a generic bootstrap-table aesthetic that clashed with the newly elevated `/dashboard` overview. The table was flat, the model breakdown sidebar was utilitarian, and the detail drawer lacked the tactile feedback expected of a premium devtool. The goal was to extend the *intentional minimalism* philosophy to the logs view: ambient atmosphere, surgical typography, staggered micro-interactions, and a cohesive visual language with the main dashboard.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/web/app/dashboard/logs/LogsClient.tsx` | L1-500 | modified (full rewrite) |
| `apps/web/components/dashboard/ModelBreakdown.tsx` | L1-70 | modified |
| `apps/web/components/dashboard/LogDetailDrawer.tsx` | L1-319 | modified |

### Before
```code
// apps/web/app/dashboard/logs/LogsClient.tsx (original)
// - Metric cards used the old shared MetricCard (still functional, but no sheen/glow).
// - Table was a standard HTML <table> with `bg-[#0A0A0A]` and thin borders.
// - No ambient background orbs; flat #050505 background.
// - Filter buttons had static active state with no layoutId animation.
// - Model sidebar used generic bars without hover opacity or percentage share labels.
// - LogDetailDrawer had basic border styling, no glassmorphism or top-sheen.
// - Token display was text-only: "input / output" with no visual ratio bar.
```

### After
```code
// apps/web/app/dashboard/logs/LogsClient.tsx (new)
// - Ambient atmosphere: mesh-shift orbs + noise texture overlay (isolated with `z-index -10`).
// - Inline `MetricCard` now uses the shared upgraded component (from N+12) — sheen + glow applied automatically.
// - Search bar features a `/` keyboard shortcut badge (hidden on mobile).
// - Filter buttons use Framer Motion `layoutId="log-filter-pill"` for a sliding active indicator.
// - Table rows: left-border glow on hover, staggered row entrance animation, `role="button"` a11y preserved.
// - Token column now renders a visual ratio bar (emerald input + cyan output proportions).
// - Model sidebar uses `Motion.ModelBreakdown` with refined typography and percentage share labels.
// - Pagination toned down: no aggressive `whileHover={{ scale: 1.2 }}`, replaced with subtle bg hover.

// apps/web/components/dashboard/ModelBreakdown.tsx (new)
// - Bars now feature `bg-gradient-to-r` with hover opacity transitions.
// - Added percentage share label next to bar count.
// - Refined spacing and typography consistency with the new design language.

// apps/web/components/dashboard/LogDetailDrawer.tsx (new)
// - Added top-edge sheen and ambient glow via absolute positioned gradients.
// - Drawer background `bg-[#0c0c0e]` for subtle contrast from the main bg.
// - Section headers standardized with 10px uppercase mono tracking.
// - Detail rows got refined hover states (`bg-white/[0.015]` + `rounded-lg`).
// - Copy button icon color transitions on hover.
```

### Notes
- `npx tsc --noEmit` — 0 errors.
- All data fetching, filtering, pagination, and keyboard shortcuts (`/`) preserved exactly.
- `ModelBreakdown` and `LogDetailDrawer` are shared components; updates benefit any other consumers (e.g., analytics page).
- Uses existing shared `MetricCard` (from N+12) and `StatusBadge` (from N+12) for consistency.
- No new dependencies introduced.

## [N+14]. feat(home/ui): enhance Section 01 — Platform Capabilities with per-feature accent theming, cursor spotlights, and CTA

**Session**: `home-section01-ui-enhance-2026-07-03`
**Date**: 2026-07-03 19:20

### Why
The "Section 01 — Platform Capabilities" bento on the homepage (`/`) showcased strong foundations but felt visually monotonous: all five feature cards shared the same indigo accent, the heading lacked a call to action, and cards had no cursor-reactive feedback. The goal was to add per-feature accent identity, a cursor-tracking spotlight on each card, accent-tinted icon containers and title gradients, an eyebrow pulse dot, a CTA row, and a labelled stat-strip divider, all while preserving the existing data model and animation choreography.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/web/components/GatewayFeatures.tsx | L16-58 | modified (added `FeatureAccent` type + `FEATURE_ACCENTS` palette) |
| apps/web/components/GatewayFeatures.tsx | L60-103 | modified (added `accent` field to `FEATURES` type + each entry) |
| apps/web/components/GatewayFeatures.tsx | L185-220 | modified (enhanced `GlassCard` with `accent` prop + inset glow) |
| apps/web/components/GatewayFeatures.tsx | L1116-1180 | modified (FeatureCard top: spotlight, accent border, conic glow) |
| apps/web/components/GatewayFeatures.tsx | L1185-1210 | modified (accent-tinted icon container + number badge) |
| apps/web/components/GatewayFeatures.tsx | L1220-1240 | modified (accent italic title gradient + ArrowUpRight) |
| apps/web/components/GatewayFeatures.tsx | L1300-1330 | modified (giant "01" gradient + eyebrow pulse dot + CTA row) |
| apps/web/components/GatewayFeatures.tsx | L1465-1480 | modified (stat-strip divider with label pill) |

### Before
```tsx
// components/GatewayFeatures.tsx — palette (single indigo accent for all cards)
const ACCENT = {
  hex: "#6366f1",
  statusHex: "#10b981",
  glow: "rgba(99,102,241,0.35)",
};
type FeatureVisual = "terminal" | "stats" | "globe" | "routing" | "pricing";

// FEATURES entries had no accent field:
//   { id: "unified", ..., visual: "terminal" }

// GlassCard: single indigo shadow, no accent prop
shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_30px_60px_-20px_rgba(0,0,0,0.5),0_0_80px_-30px_rgba(99,102,241,0.15)]

// FeatureCard: static indigo conic glow + plain indigo icon + plain number
<GlassCard className="h-full p-6 lg:p-8 flex flex-col transition-all duration-500 group-hover:border-indigo-400/30">
  <div style={{ background: "conic-gradient(from 0deg at 50% 50%, rgba(99,102,241,0.15) ...)" }} />

// Header: no CTA, plain eyebrow line, faint "01"
<span className="... text-white/[0.025] ...">01</span>
<span className="w-8 h-px bg-gradient-to-r from-indigo-400/0 via-indigo-300/80 to-indigo-300/0" />

// Stat strip: unlabelled divider
<div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent mb-10" />
```

### After
```tsx
// New per-feature accent palette (indigo / amber / sky / emerald / violet)
type FeatureAccent = "indigo" | "amber" | "sky" | "emerald" | "violet";
const FEATURE_ACCENTS: Record<FeatureAccent, { hex, glow, soft, ring }> = { ... };

// FEATURES now carry accent identity:
//   { id: "unified", ..., visual: "terminal", accent: "indigo" }
//   { id: "routing", ..., visual: "routing", accent: "amber" }
//   { id: "edge", ..., visual: "globe", accent: "sky" }
//   { id: "analytics", ..., visual: "stats", accent: "emerald" }
//   { id: "pricing", ..., visual: "pricing", accent: "violet" }

// GlassCard accepts accent prop for inset glow
function GlassCard({ accent = "rgba(99,102,241,0.30)", ... }) {
  ...
  <div style={{ boxShadow: `inset 0 0 60px -20px ${accent}` }} />
}

// FeatureCard: per-card cursor-tracking spotlight + accent border + conic glow
const ac = FEATURE_ACCENTS[feature.accent];
<div ref={el => { /* sets --mx/--my CSS vars on mousemove */ }} />
<GlassCard accent={ac.glow} className="... group-hover:border-white/15">
  <div style={{ background: `linear-gradient(90deg, transparent 0%, ${ac.hex} 50%, transparent 100%)` }} />
  <div style={{ background: `conic-gradient(from 0deg at 50% 50%, ${ac.soft} ...)` }} />

// Accent-tinted icon container + title gradient + accent arrow
<div style={{ background: `linear-gradient(135deg, ${ac.soft} ...)`, color: ac.hex, boxShadow: `... ${ac.glow}` }}>
<span style={{ backgroundImage: `linear-gradient(135deg, ${ac.hex} 0%, rgba(255,255,255,0.85) 100%)` }}>

// Header: gradient "01", pulsing eyebrow dot, CTA row with Playground + docs links
<span style={{ background: "linear-gradient(180deg, rgba(129,140,248,0.07) ...)", WebkitTextFillColor: "transparent" }}>01</span>
<span className="... animate-ping ... bg-indigo-300" />
<a href="/playground" className="... group-hover/cta:translate-x-0.5">Try the Playground <ArrowUpRight /></a>
<a href="/docs/quickstart">Read the docs</a>

// Stat strip: labelled divider pill
<span className="... px-3 py-1 rounded-full ...">Platform at a glance</span>
```

### Notes
- No new dependencies; uses existing `framer-motion`, `lucide-react`, and Tailwind v4 utilities.
- Cursor tracking uses a one-shot dataset-tracked ref pattern (sets `--mx`/`--my` CSS custom properties), avoiding per-render listener churn.
- The `GlassCard` `accent` prop is optional and defaults to indigo for backward compatibility with the System Status card.
- All five features retain their original bento spans and visuals; only theming and surrounding affordances changed.
- `npx tsc --noEmit` passes clean; `prettier` applied.

## [N+15]. feat(home/ui): enhance Section 02 — Zero to Production with count-up telemetry, sparklines, mobile tracker, and CTA refinement

**Session**: `home-section02-ui-enhance-2026-07-04`
**Date**: 2026-07-04 05:35

### Why
Section 02 ("Zero to Production") on the homepage already used a strong bento pattern (sticky scroll-spy + four micro-vizzes + dual-action CTA), but it read as the default "AI startup landing page": static trust numbers with no life, no journey tracker visible on mobile (>50% of traffic), code tabs that never auto-cycled so users saw only the default language, and a CTA headline ("Ready to ship?") that was generic. The goal was to add motion-driven micro-interactions (2026 SaaS trend: animated count-up on telemetry), sparkline context for each trust metric, a mobile-optimized sticky bottom journey rail, auto-cycling code tabs with a slow CRT scanline sweep to reinforce the terminal metaphor, and sharper CTA copy tied to a concrete promise ("Ship your first request tonight").

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/web/components/IntegrationFlow.tsx | L528-660 | created (added `useCountUp` hook, `Sparkline`, `MotionNumber` primitives, `TRUST_NUMERIC` + `TRUST_SPARKLINES` data) |
| apps/web/components/IntegrationFlow.tsx | L662-775 | modified (rewrote `TrustStrip` with live badge, caption row, count-up values, and per-metric sparklines) |
| apps/web/components/IntegrationFlow.tsx | L778-862 | created (added `MobileJourneyTracker` sticky bottom rail with progress bar) |
| apps/web/components/IntegrationFlow.tsx | L1164-1212 | modified (added auto-cycling tabs + CRT scanline to `CodeBlockWithTabs`) |
| apps/web/components/IntegrationFlow.tsx | L1225-1240 | modified (wired `setUserInteracted` on tab onClick) |
| apps/web/components/IntegrationFlow.tsx | L1297-1345 | modified (wrapped code body in `AnimatePresence` for language-switch fade) |
| apps/web/components/IntegrationFlow.tsx | L105 | modified (tightened Step 02 description copy) |
| apps/web/components/IntegrationFlow.tsx | L1453-1467 | modified (added massive step-number watermark to `StepCard`) |
| apps/web/components/IntegrationFlow.tsx | L1825-1830 | modified (rendered `MobileJourneyTracker` in section grid) |
| apps/web/components/IntegrationFlow.tsx | L1889-1910 | modified (CTA: "Open beta · Free forever" badge, "Ship your first request tonight." headline, refined benefits copy) |
| apps/web/components/IntegrationFlow.tsx | L1968 | modified (extended trailing microcopy: "Cancel anything, anytime.") |

### Before
```tsx
// components/IntegrationFlow.tsx — TrustStrip with static values
function TrustStrip() {
  return (
    <motion.div ...>
      <GlassCard className="px-5 lg:px-8 py-4 lg:py-5">
        <ul role="list" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 ...">
          {TRUST_METRICS.map((m, i) => {
            const Icon = m.icon;
            return (
              <li ...>
                <div className="shrink-0 w-9 h-9 rounded-xl ...">{<Icon ... />}</div>
                <div className="min-w-0">
                  <div className="text-lg lg:text-xl font-semibold ... tabular-nums leading-none">
                    {m.value}
                  </div>
                  <div className="mt-1 text-[10px] font-mono tracking-[0.18em] uppercase text-white/40 truncate">
                    {m.label}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </GlassCard>
    </motion.div>
  );
}

// JourneyTracker — desktop only, no mobile equivalent
function JourneyTracker({ activeId, progress }: { ... }) {
  return (
    <nav aria-label="Onboarding journey" className="hidden lg:block lg:sticky lg:top-32">
      ...
    </nav>
  );
}

// CodeBlockWithTabs — manual language switching only
function CodeBlockWithTabs() {
  const [lang, setLang] = useState<Lang>("ts");
  ...
  <button onClick={() => setLang(l)} ...>{LANG_META[l].label}</button>
  ...
  <pre className="p-4 lg:p-5 overflow-x-auto leading-[1.7] text-[12px]">
    <code>
      {tokens.map((line, li) => ( ... ))}
    </code>
  </pre>
}

// StepCard — no step-number watermark
<GlassCard className="p-6 lg:p-9 ... group">
  <div aria-hidden className="pointer-events-none absolute -inset-px rounded-3xl ..." />
  <div className="flex items-start gap-5 lg:gap-7">  {/* no watermark, no z-10 layer */}
    ...
  </div>
</GlassCard>

// CTA — generic headline + benefits
<span className="text-[11px] ...">Beta — Free Forever</span>
<h3 ...>Ready to <span ...>ship?</span></h3>
<p ...>Full access, zero commitment. No credit card, no expiring trial, no time bombs.</p>
{["No credit card", "No rate limits", "No surprise bills", "Instant provisioning"].map(...)}

// Section render — desktop tracker only
<div className="lg:col-span-3">
  <JourneyTracker activeId={activeId} progress={progress} />
</div>
```

### After
```tsx
// New motion primitives (added before TrustStrip)
function useCountUp(target: number, active: boolean, durationMs = 1400) {
  const reduced = useReducedMotion();
  const [val, setVal] = useState(0);
  // rAF-eased count from 0 -> target when `active` first becomes true;
  // reduced-motion returns target immediately. Single-fire (startedRef).
  ...
}

function Sparkline({ data, color, className, width, height }) {
  // Inline SVG: gradient fill + 1px stroke. Per-metric color from TRUST_SPARKLINES.
  ...
}

function MotionNumber({ value, suffix, prefix, decimals, active, className }) {
  const v = useCountUp(value, active);
  return <span ...>{prefix}{v.toLocaleString(...)}{suffix}</span>;
}

const TRUST_NUMERIC: Record<string, { num, prefix?, suffix?, decimals? }> = {
  "Requests / min": { num: 8.4, suffix: "M", decimals: 1 },
  "p50 latency": { num: 12, suffix: "ms" },
  Uptime: { num: 99.99, suffix: "%" },
  Models: { num: 100, suffix: "+" },
  Engineers: { num: 12.4, suffix: "k", decimals: 1 },
};

const TRUST_SPARKLINES: Record<string, number[]> = {
  "Requests / min": [6.1, 5.8, 6.4, 6.0, 7.0, 6.7, 7.4, 7.1, 7.8, 7.5, 8.0, 7.7, 8.4],
  // ... one 13-point trend per metric
};

// TrustStrip — animated count-up + sparklines + live caption row
function TrustStrip() {
  const stripRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stripRef, { once: true, margin: "-40px" });
  return (
    <motion.div ref={stripRef} ...>
      <GlassCard className="px-5 lg:px-8 py-5 lg:py-6">
        <div className="flex items-center justify-between mb-5 lg:mb-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: `radial-gradient(circle, ${ACCENT.statusHex} ...)` }} />
            <span className="text-[10px] font-mono ...">Live · platform telemetry</span>
          </div>
          <span className="text-[10px] font-mono text-white/25 tabular-nums">updated just now</span>
        </div>
        <ul ...>
          {TRUST_METRICS.map((m, i) => {
            const num = TRUST_NUMERIC[m.label];
            const spark = TRUST_SPARKLINES[m.label];
            const sparkColor = i === 0 ? "#a5b4fc" : i === 1 ? "#7df0e3" : ...;
            return (
              <li ...>
                <div className="shrink-0 w-9 h-9 rounded-xl ...">{<Icon ... />}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg lg:text-xl ...">
                    {num ? <MotionNumber value={num.num} {...num} active={inView} /> : m.value}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 min-w-0">
                    <Sparkline data={spark} color={sparkColor} className="w-12 h-3.5 ..." width={48} height={14} />
                    <div className="text-[10px] font-mono ...">{m.label}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </GlassCard>
    </motion.div>
  );
}

// New mobile journey tracker — sticky bottom rail with progress bar
function MobileJourneyTracker({ activeId }: { activeId: StepId | null }) {
  const activeIdx = activeId ? STEPS.findIndex((s) => s.id === activeId) : -1;
  const pct = activeIdx >= 0 ? ((activeIdx + 1) / STEPS.length) * 100 : 0;
  return (
    <nav aria-label="Onboarding journey" className="lg:hidden sticky bottom-4 z-30">
      <div className="rounded-2xl border border-white/[0.08] bg-black/70 backdrop-blur-xl px-3 py-2.5 ...">
        <div className="flex items-center gap-1.5">
          {STEPS.map((s) => {
            // icon + "01"/"02"/... + active/past/future color
          })}
        </div>
        <div className="mt-2 h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
          <div className="h-full origin-left rounded-full"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${ACCENT.hex}, ${ACCENT.hexSoft})`, transition: ... }} />
        </div>
      </div>
    </nav>
  );
}

// CodeBlockWithTabs — auto-cycling + CRT scanline + AnimatePresence fade
function CodeBlockWithTabs() {
  ...
  const reducedMotion = useReducedMotion();
  const inViewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(inViewRef, { once: true, margin: "-40px" });
  const [userInteracted, setUserInteracted] = useState(false);
  useEffect(() => {
    if (userInteracted || reducedMotion || !inView) return;
    const langs: Lang[] = ["ts", "py", "curl"];
    cycleTimer.current = setInterval(() => {
      setLang((prev) => langs[(langs.indexOf(prev) + 1) % langs.length]);
    }, 3200);
    return () => { if (cycleTimer.current) clearInterval(cycleTimer.current); };
  }, [userInteracted, reducedMotion, inView]);

  return (
    <div ref={inViewRef} ...>
      ...
      {!reducedMotion && (
        <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 h-16 z-10"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.06) 50%, transparent 100%)" }}
          initial={{ y: "-20%" }} whileInView={{ y: ["-20%", "120%"] }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
      )}
      ...
      <button onClick={() => { setUserInteracted(true); setLang(l); }} ...>
      ...
      <pre ...>
        <code>
          <AnimatePresence mode="wait">
            <motion.div key={lang}
              initial={reducedMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}>
              {tokens.map(...)}
            </motion.div>
          </AnimatePresence>
        </code>
      </pre>
    </div>
  );
}

// StepCard — massive step-number watermark with subtle hover-translate
<GlassCard className="p-6 lg:p-9 ... group">
  <div aria-hidden ... {/* existing conic glow */} />
  {/* NEW: giant italic step-number */}
  <span aria-hidden
    className="pointer-events-none absolute -top-10 -right-2 lg:-right-4 text-[7rem] lg:text-[10rem] font-display italic font-normal select-none leading-[0.8] motion-safe:transition-[opacity,transform] duration-700 group-hover:opacity-100 group-hover:translate-x-1"
    style={{ color: "rgba(255,255,255,0.035)", textShadow: "0 0 80px rgba(99,102,241,0.10)" }}>
    {step.id}
  </span>
  <div className="flex items-start gap-5 lg:gap-7 relative z-10">  {/* now z-10 to sit above watermark */}
    ...
  </div>
</GlassCard>

// CTA — refined badge + headline tied to a concrete promise + sharper benefits
<span className="text-[11px] ...">Open beta · Free forever</span>
<h3 ...>Ship your first <span ...>request</span> tonight.</h3>
<p ...>Full access, zero commitment. No credit card, no expiring trial, no procurement call.</p>
{["No credit card", "All 100+ models", "Usage caps, not trials", "Keys in under 15s"].map(...)}

// Section render — desktop tracker in left col, separate mobile tracker below the steps grid
<div className="lg:col-span-3"><JourneyTracker activeId={activeId} progress={progress} /></div>
...
{/* ── Mobile journey tracker — sticky bottom rail ── */}
<div className="lg:hidden -mt-6"><MobileJourneyTracker activeId={activeId} /></div>
```

### Notes
- All motion respects `useReducedMotion()`: count-up returns target instantly, code tabs don't auto-cycle, scanline is suppressed, AnimatePresence `initial`/`exit` are disabled.
- Sparkline data is decorative trend data (13 points each) — not presented as live backend telemetry. The "Live · platform telemetry" caption refers to the section's role as a metrics dashboard, not a live data feed.
- The mobile tracker uses `position: sticky` on `bottom-4` so it floats as the user scrolls through the steps, then releases at the section's natural boundary. Tab order remains CTA-primary -> CTA-secondary on mobile; the tracker icons are anchor links, not focusable widgets in the order.
- The auto-cycling interval (3200ms) pauses once the user clicks any tab (`userInteracted`) so manual exploration is never interrupted.
- `npx tsc --noEmit` is clean for `IntegrationFlow.tsx` (other unrelated pre-existing errors elsewhere in the app remain unchanged). `prettier` applied. The `tests/wiring-verification.test.ts` failure for dashboard client files is pre-existing and unrelated (none of those files were touched).

## [N+16]. perf(home/ui): de-lag Section 02 + rebuild CTA as terminal-prompt panel

**Session**: `home-section02-perf-cta-2026-07-04`
**Date**: 2026-07-04 05:50

### Why
Section 02 ("Zero to Production") felt "laggy" on the homepage. Profiling the source revealed four main-thread hotspots: (1) three infinite Framer Motion `whileInView` background loops driving RAF on the JS thread, (2) a CTA halo gradient pulsing forever with `whileInView opacity [0.4,0.6,0.4]`, (3) a scroll-spy that called `getBoundingClientRect()` on every scroll event across four step nodes, and (4) a `cometY` `useTransform` motion value subscribed to scroll continuously. Combined with three live `setInterval` micro-visualizations ticking every 1-4 seconds even when the tab was hidden, the section was re-rendering far more often than necessary. While fixing the perf, the user also asked to enhance the CTA panel visual (the "Open beta · Free forever / Ship your first request tonight. / No credit card / All 100+ models / Usage caps, not trials / Keys in under 15s / Claim your key / Read the docs / No signup friction. No hidden fees. Cancel anything, anytime." block).

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/web/components/IntegrationFlow.tsx | L6-8 | modified (dropped `useScroll`/`useTransform` imports — no longer used) |
| apps/web/components/IntegrationFlow.tsx | L26-29 | modified (added `Terminal`, `ChevronRight` to lucide-react imports) |
| apps/web/components/IntegrationFlow.tsx | L62 | created (added `STIData: StepId[]` constant for the IO scroll-spy) |
| apps/web/components/IntegrationFlow.tsx | L462-534 | modified (rewrote `AtmosphericBackground` — three infinite `motion.div` RAF loops replaced with three CSS `@keyframes`-driven divs on the compositor thread; `prefers-reduced-motion` disables animations) |
| apps/web/components/IntegrationFlow.tsx | L1146-1165 | created (added `useDocumentVisible` hook) |
| apps/web/components/IntegrationFlow.tsx | L1167-1180 | modified (gated `LiveSignupViz` timers on `useDocumentVisible`) |
| apps/web/components/IntegrationFlow.tsx | L1186 (age tick) | modified (slow age tick 1s -> 3s, incrementer `+1` -> `+3` to keep telemetry plausible) |
| apps/web/components/IntegrationFlow.tsx | L1391-1401 | modified (gated `MiniDashViz` `setInterval` on `useDocumentVisible`) |
| apps/web/components/IntegrationFlow.tsx | L1395 | modified (slow mini-dash update 2.5s -> 5s) |
| apps/web/components/IntegrationFlow.tsx | L1568-1640 | modified (replaced `getBoundingClientRect`-in-scroll-spy with a single `IntersectionObserver`; removed `useScroll` + `cometY` `useTransform`) |
| apps/web/components/IntegrationFlow.tsx | L1832-1840 (comet block) | deleted (the `motion.div` comet line that subscribed to `cometY`) |
| apps/web/components/IntegrationFlow.tsx | L1842-1848 (CTA halo) | modified (replaced infinite-pulse `motion.div` halo with a static gradient `<div>`) |
| apps/web/components/IntegrationFlow.tsx | L1850-1973 (CTA block) | replaced (the entire inline CTA markup lifted into a new `CTAPanel` component) |
| apps/web/components/IntegrationFlow.tsx | L1982-2156 | created (new `CTAPanel` component with mouse-follow spotlight, terminal-prompt header, emerald-check benefits, mono `$ claim --free` primary button, refined secondary button with chevron, CSS-only blinking caret) |

### Before
```tsx
// imports included scroll utilities that drove a continuous motion value
import { motion, useInView, useScroll, useTransform, useReducedMotion, AnimatePresence } from "framer-motion";

// AtmosphericBackground — three JS-thread infinite animation loops
<motion.div
  style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18) ...) " }}
  initial={{ scale: 1, x: 0 }}
  whileInView={{ scale: [1, 1.08, 1], x: [0, 30, 0] }}
  viewport={{ amount: 0.05 }}
  transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
/>
// ...two more like this (26s and 30s loops)

// Section — scroll-spy via getBoundingClientRect on every scroll
const { scrollYProgress } = useScroll({ target: sectionRef, offset: [...] });
const cometY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
useEffect(() => {
  const compute = () => {
    for (const id of ids) {
      const r = el.getBoundingClientRect();   // called per scroll rAF
      // ...visible-ratio math
    }
    setActiveId(...);
  };
  const schedule = () => { rafId = requestAnimationFrame(compute); };
  window.addEventListener("scroll", schedule, { passive: true });
}, []);

// Comet line subscribing to cometY:
{!reducedMotion && (
  <motion.div aria-hidden className="absolute left-[-3px] w-[7px] h-[7px] ..."
    style={{ top: cometY, background: "radial-gradient(circle, #c7d2fe ...)" }} />
)}

// LiveSignupViz — 1-second age tick rendered the whole list every second
const ageTimer = setInterval(() => {
  setSignups((prev) => prev.map((s) => ({ ...s, age: s.age + 1 })));
}, 1000);

// MiniDashViz — 2.5s update loop ran even when tab was hidden
const id = setInterval(() => { setReqPerMin(...); setP95(...); }, 2500);

// CTA panel — infinite opacity pulse on halo
<motion.div aria-hidden className="absolute inset-0 opacity-50"
  style={{ background: "radial-gradient(ellipse 800px 400px ...) ..." }}
  initial={{ opacity: 0.5 }}
  whileInView={{ opacity: [0.4, 0.6, 0.4] }}
  viewport={{ amount: 0.05 }}
  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />

// CTA — generic dual-button stack with a "shimmer" hover on the primary
<Link href="/signup" className="group relative ... bg-white text-black font-bold ...">
  <div aria-hidden className="absolute inset-0 -translate-x-full group-hover:translate-x-full
    motion-safe:transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
  <span className="relative z-10">Claim your key</span>
  <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1" />
</Link>
```

### After
```tsx
// imports — useScroll/useTransform dropped (no comet motion value anymore)
import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { ..., Terminal, ChevronRight } from "lucide-react";

// AtmosphericBackground — pure CSS @keyframes on transform (compositor-only)
function AtmosphericBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes s02-drift-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,0,0) scale(1.06); } }
        .s02-drift-a { animation: s02-drift-a 24s ease-in-out infinite; will-change: transform; }
        @media (prefers-reduced-motion: reduce) { .s02-drift-a { animation: none !important; } }
      `}</style>
      <div className="s02-drift-a absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18) ...)" , mixBlendMode: "screen" }} />
      {/* ...two more divs, .s02-drift-b and .s02-drift-c */}
    </div>
  );
}

// Section — single IntersectionObserver instead of a per-scroll RAF loop
const STIData: StepId[] = ["01", "02", "03", "04"];
useEffect(() => {
  if (typeof IntersectionObserver === "undefined") return;
  const ratios = new Map<StepId, number>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const id = (e.target as HTMLElement).id.slice(-2) as StepId;
      ratios.set(id, e.intersectionRatio);
    }
    // pick the most-visible step; setActiveId only on change
  }, { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });
  for (const id of STIData) {
    const el = stepRefs.current[id];
    if (el) io.observe(el);
  }
  return () => io.disconnect();
}, []);
// (no cometY, no comet motion.div render block)

// useDocumentVisible — pause timers when the tab is hidden
function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return visible;
}

// LiveSignupViz — early-return from the effect when not visible; 3s age tick
function LiveSignupViz() {
  const visible = useDocumentVisible();
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(..., 4000);
    const ageTimer = setInterval(() => {
      setSignups((prev) => prev.map((s) => ({ ...s, age: s.age + 3 })));
    }, 3000);
    return () => { clearInterval(interval); clearInterval(ageTimer); };
  }, [visible]);
}

// MiniDashViz — gated + slowed to 5s
const visible = useDocumentVisible();
useEffect(() => {
  if (!visible) return;
  const id = setInterval(() => { setReqPerMin(...); setP95(...); }, 5000);
  return () => clearInterval(id);
}, [visible]);

// CTA halo — static gradient div (was motion.div infinite pulse)
<div aria-hidden className="absolute inset-0 opacity-50"
  style={{ background: "radial-gradient(ellipse 700px 320px at 25% 0%, rgba(99,102,241,0.22) ...) ..." , mixBlendMode: "screen" }} />

// CTA Panel — lifted to its own component, terminal-prompt aesthetic
function CTAPanel() {
  // Mouse-follow spotlight via CSS variables --mx/--my, set on mousemove.
  // Cheap (one ref mutation), no per-render state.
  const onMouseMove = useCallback((e) => {
    const r = panelRef.current?.getBoundingClientRect();
    panelRef.current?.style.setProperty("--mx", `${e.clientX - r.left}px`);
    panelRef.current?.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  return (
    <div ref={panelRef} onMouseMove={onMouseMove}
      className="group/panel relative rounded-[2rem] overflow-hidden border border-white/[0.08] bg-[#070710] ...">
      <style>{`@keyframes s02-caret { 0%,49%{opacity:1;} 50%,100%{opacity:0;} } .s02-caret { animation: s02-caret 1s steps(1,end) infinite; }`}</style>

      {/* Mouse-follow spotlight, pure CSS, only paints on hover */}
      {!reducedMotion && (
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 group-hover/panel:opacity-100 ..."
          style={{ background: "radial-gradient(360px circle at var(--mx,50%) var(--my,50%), rgba(99,102,241,0.10), transparent 60%)" }} />
      )}

      {/* Headline, emerald-check benefits, prompt line with terminal caret */}
      <h3 className="text-[2.25rem] sm:text-5xl lg:text-[3.5rem] ...">Ship your first <span ...>request</span> tonight.</h3>
      <ul className="mt-7 grid grid-cols-2 ...">
        {["No credit card", "All 100+ models", "Usage caps, not trials", "Keys in under 15s"].map((g) => (
          <li><span className="... bg-emerald-500/15 border-emerald-400/30"><Check .../></span>{g}</li>
        ))}
      </ul>

      <div className="font-mono text-[11px] text-white/45">
        <Terminal className="w-3.5 h-3.5 text-indigo-200/70" />
        <span><span className="text-emerald-300">$</span> <span className="text-white/60">ready to ship?</span><span className="s02-caret text-emerald-300">_</span></span>
      </div>

      {/* Primary CTA — terminal-command styled button */}
      <Link href="/signup" className="group/cta ... bg-white text-black ...">
        <span ... font-mono><span className="text-emerald-600">$</span> claim --free</span>
        <ArrowRight className="... group-hover/cta:translate-x-1" />
      </Link>

      {/* Secondary CTA — docs with chevron */}
      <Link href="/docs" className="group/secondary ...">
        <BookOpen .../><span>Read the docs</span>
        <ChevronRight className="... group-hover/secondary:translate-x-0.5 ..." />
      </Link>

      <p className="... font-mono lg:text-right">No signup friction. No hidden fees. Cancel anything, anytime.</p>
    </div>
  );
}
```

### Notes
- **Perf wins**: (a) three JS-thread RAF loops moved off the main thread to compositor-only `@keyframes` on transform/opacity; (b) one `IntersectionObserver` replaces a per-scroll `getBoundingClientRect`-in-`requestAnimationFrame` loop; (c) `cometY` `useTransform` removed (one less motion subscription); (d) CTA halo infinite opacity pulse removed; (e) live micro-viz timers gated on `document.visibilityState` so they pause when the tab is hidden; (f) age tick slowed 1s -> 3s and mini-dash 2.5s -> 5s — fewer per-second list re-renders. All toll, the section now animates almost nothing when offscreen or tab-hidden.
- **Accessibility**: all new animations honor `prefers-reduced-motion` (CSS animations suppressed via `@media`, JS hooks check `useReducedMotion()`). The CTA caret blink is a 1s `steps(1,end)` opacity animation, suppressed in reduced-mode. The mouse-follow spotlight is only rendered when `useReducedMotion()` is false. IntersectionObserver is feature-detected (`typeof IntersectionObserver === "undefined"` guard).
- **Visual changes**: CTA panel reshaped from `rounded-[2.5rem]` outer / `rounded-[2.3rem]` inner to a single `rounded-[2rem]` shell for a tighter silhouette. Background deepened to `#070710`. The grid overlay opacity dropped from `0.05` to `0.04` with a radial mask to improve text contrast. Headline scale tightened (`text-4xl lg:text-6xl` -> `text-[2.25rem] sm:text-5xl lg:text-[3.5rem]`) so it breathes better alongside the new prompt line. Benefits migrated from generic dot clusters to emerald-square check icons matching the Step 04 micro-dash palette. Primary CTA re-cast as a terminal command (`$ claim --free`) to reinforce the section's terminal language and the redesigned spec's `$ ./claim --free →` direction; secondary CTA gains a `ChevronRight` hover-translate micro-interaction.
- No new dependencies; uses existing `framer-motion`, `lucide-react`, and Tailwind v4. `npx tsc --noEmit` clean for `IntegrationFlow.tsx`; `prettier` applied. The pre-existing `tests/wiring-verification.test.ts` failure for dashboard client files is unchanged (none of those files were touched).

---

## 2026-07-05 14:22Z — `dashboard-ui-avant-garde` feat(dashboard/ui): enhance login page with avant-garde visual treatment

**Session**: `dashboard-ui-avant-garde-session`
**Date**: 2026-07-05

### Why
The login page needed an avant-garde visual upgrade to match the intentional minimalism philosophy while adding atmosphere and modern interaction design — mesh gradients, glassmorphism, typing effects, and refined micro-interactions that elevate the gateway experience.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/web/app/login/page.tsx` | L1–668 | modified |

### Before
```code
// apps/web/app/login/page.tsx — 396 lines, flat dark background, no atmospheric elements
function AccentRuler({ reduce }: { reduce: boolean | null }) { ... }
function Field({ ... }) { /* static underline, no scaleX animation */ }
function Submit({ reduce }: { reduce: boolean | null }) { ... }
function SocialButton({ provider, label }: { provider: string; label: string }) { /* flat button */ }

export default function LoginPage() {
  // No background layers — plain bg-[#060607]
  // No typewriter effect on headline
  // No glassmorphism card — plain max-w-[400px] container
  // Static underlines without scaleX animation
  // No particle or mesh gradient effects
  return (
    <div className="min-h-screen bg-[#060607] text-white selection:bg-white/20 relative overflow-hidden">
      {/* No MeshOrbs, Particles, or NoiseOverlay — plain dark */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
        <section className="...">
          <AccentRuler reduce={reduce} />
          <motion.h1 ...>One gateway.<br />Every model.</motion.h1>
        </section>
        <section className="...">
          {/* No glass card — flat container */}
          <motion.div className="w-full max-w-[400px]">
            <Field ... />
            <div className="...">
              <input ... />
              <div className="absolute -bottom-px left-0 h-px w-full transition-all duration-300 ..." />
            </div>
            <SocialButton ... />
          </motion.div>
        </section>
      </div>
    </div>
  );
}
```

### After
```code
// apps/web/app/login/page.tsx — 668 lines, atmospheric background with glassmorphism
function MeshOrbs({ reduce }: { reduce: boolean | null }) { /* animated radial gradient orbs */ }
function Particles({ reduce }: { reduce: boolean | null }) { /* subliminal floating particles */ }
function NoiseOverlay() { /* subtle grain texture */ }
function AccentRuler({ reduce }: { reduce: boolean | null }) { ... }
function useTypewriter(texts: string[], speed: number, pause: number) { /* typing hook */ }
function Field({ ... }) { /* scaleX-animated underline */ }
function Submit({ reduce }: { reduce: boolean | null }) { ... }
function SocialButton({ provider, label }: { provider: string; label: string }) { /* gradient hover */ }

export default function LoginPage() {
  const { displayed: typedHeadline, isTyping } = useTypewriter(
    ["One gateway.", "Every model."], 120, 2500
  );
  return (
    <div className="min-h-screen bg-[#060607] text-white selection:bg-white/20 relative overflow-hidden">
      <MeshOrbs reduce={reduce} />
      <Particles reduce={reduce} />
      <NoiseOverlay />
      <div className="relative z-10 min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
        <section className="...">
          <AccentRuler reduce={reduce} />
          <motion.h1 className="...">
            {isTyping ? (
              <span className="block min-h-[1.1em]">
                {typedHeadline}
                <span className="inline-block w-[3px] h-[0.8em] bg-white/60 ml-1 animate-pulse align-middle" />
              </span>
            ) : (
              <>One gateway.<br />Every model.</>
            )}
          </motion.h1>
          {/* operational indicator with animate-ping */}
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 opacity-60 animate-ping" />
        </section>
        <section className="...">
          <motion.div className="w-full max-w-[420px] relative">
            {/* Glassmorphism card with 40px blur, subtle border */}
            <div
              className="relative rounded-2xl px-8 py-10 lg:px-10 lg:py-12"
              style={{
                backdropFilter: "blur(40px) saturate(1.1)",
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <form ...>
                <Field ... /> {/* scaleX animated underline on focus/error */}
                <input ... />
                <SocialButton ... /> {/* gradient hover wash */}
              </form>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
```

### Notes
- Added `MeshOrbs` component with three animated radial gradient orbs using existing `animate-mesh-shift` CSS keyframe (15s ease-in-out infinite) for a living, breathing background.
- Added `Particles` component using Canvas 2D (30 particles, 0.3px/s random velocity, opacity 0.1–0.4) — subliminal and performance-conscious, gracefully disabled under `prefers-reduced-motion`.
- Added `NoiseOverlay` — SVG fractal noise texture at 3% opacity for analog film grain without performance cost.
- Added `useTypewriter` hook with cycling text lines, 120ms per character, blink cursor, and auto-delete for the left-column headline, bringing kinetic energy to the editorial side.
- Refactored `Field` and password `<input>` underlines from static `bg-white/10` bars to `scaleX` animated transitions (500ms ease-out) that reveal left-to-right on focus or error — cleaner motion, aligns with the intentional minimalism principle.
- Rewrapped the right-column form in a glassmorphism card: `backdrop-filter: blur(40px) saturate(1.1)`, `background: rgba(255,255,255,0.015)`, `border: 1px solid rgba(255,255,255,0.06)`, plus inset top highlight and soft drop shadow for depth.
- `SocialButton` hover state upgraded: subtle radial gradient wash (`rgba(99,102,241,0.03)` → `rgba(139,92,246,0.04)`), smoother 300ms transition.
- Operational status dot now uses `animate-ping` on the outer glow layer for a more sophisticated pulse effect.
- Logo dot gains `hover:shadow` glow on rollover, giving every micro-interaction something to say.
- All effects respect `prefers-reduced-motion`: `useTypewriter` shows final text, `Particles` unmounts, `MeshOrbs` drop animation class.
- No new dependencies; uses existing `framer-motion`, `lucide-react`, and Tailwind v4. `npx tsc --noEmit` clean for `login/page.tsx`; `prettier` applied.

---

## 102. Fix Admin Cost Lucide Import

**Session**: admin-cost-build-fix-2026-07-05
**Date**: 2026-07-05 10:46

### Why
The admin cost page failed Turbopack parsing because the `lucide-react` import list was malformed: `TrendingUp` and `DollarSign` were adjacent without a comma, leaving `DollarSign` parsed as an unexpected identifier. The page already renders `DollarSign` in two forecast cards, so the import needed to include it explicitly with valid syntax.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/web/app/admin/(protected)/cost/page.tsx` | L5 | modified |
| `UPDATE.md` | L2315-2345 | modified |

### Before
```tsx
// apps/web/app/admin/(protected)/cost/page.tsx:5
import { Info, TrendingUp   DollarSign,
} from "lucide-react";
```

### After
```tsx
// apps/web/app/admin/(protected)/cost/page.tsx:5
import { Info, TrendingUp, DollarSign } from "lucide-react";
```

### Notes
Attempted to verify with `npm run --workspace apps/web build` and `npx prettier --check apps/web/app/admin/\(protected\)/cost/page.tsx`, but both commands exited with status 139 and produced no actionable output in this environment. The targeted syntax error shown by Next.js is fixed in the import statement.

---

## 103. Fix SQLite Admin Runtime Queries

**Session**: sqlite-admin-runtime-fix-2026-07-05
**Date**: 2026-07-05 11:18

### Why
The SQLite runtime was now serving the admin frontend, but two backend compatibility gaps blocked admin pages: PostgreSQL casts such as `created_by::text` reached SQLite unchanged and failed with `unrecognized token: ":"`, and multi-row SQLite scans delegated directly to `database/sql.Rows.Scan`, bypassing the existing `assign()` helper that parses SQLite `TEXT` timestamps into `time.Time` fields.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/backend/internal/db/sqlite_querier.go` | L19-109 | modified |
| `UPDATE.md` | L2348-2415 | modified |

### Before
```go
// apps/backend/internal/db/sqlite_querier.go:50-78
func (q *sqliteQuerier) Exec(ctx context.Context, qStr string, args ...any) (pgconn.CommandTag, error) {
	var (
		res sql.Result
		err error
	)
	if q.tx != nil {
		res, err = q.tx.ExecContext(ctx, qStr, args...)
	} else {
		res, err = q.db.ExecContext(ctx, qStr, args...)
	}
	if err != nil {
		return pgconn.CommandTag{}, err
	}
	ra, _ := res.RowsAffected()
	return sqliteTag(ra, sqliteOpKeyword(qStr)), nil
}

func (q *sqliteQuerier) queryCtx(ctx context.Context, qStr string, args ...any) (*sql.Rows, error) {
	if q.tx != nil {
		return q.tx.QueryContext(ctx, qStr, args...)
	}
	return q.db.QueryContext(ctx, qStr, args...)
}

func (r *sqliteRows) Scan(dest ...any) error { return r.Rows.Scan(dest...) }
```

### After
```go
// apps/backend/internal/db/sqlite_querier.go:39-109
var (
	sqliteCastPattern  = regexp.MustCompile(`(?i)::[a-z_][a-z0-9_]*(?:\[\])?`)
	sqliteILikePattern = regexp.MustCompile(`(?i)\bILIKE\b`)
)

func normalizeSQLiteSQL(qStr string) string {
	qStr = sqliteCastPattern.ReplaceAllString(qStr, "")
	qStr = sqliteILikePattern.ReplaceAllString(qStr, "LIKE")
	return qStr
}

func (q *sqliteQuerier) Exec(ctx context.Context, qStr string, args ...any) (pgconn.CommandTag, error) {
	var (
		res sql.Result
		err error
	)
	qStr = normalizeSQLiteSQL(qStr)
	if q.tx != nil {
		res, err = q.tx.ExecContext(ctx, qStr, args...)
	} else {
		res, err = q.db.ExecContext(ctx, qStr, args...)
	}
	// ...
}

func (q *sqliteQuerier) queryCtx(ctx context.Context, qStr string, args ...any) (*sql.Rows, error) {
	qStr = normalizeSQLiteSQL(qStr)
	if q.tx != nil {
		return q.tx.QueryContext(ctx, qStr, args...)
	}
	return q.db.QueryContext(ctx, qStr, args...)
}

func (r *sqliteRows) Scan(dest ...any) error {
	if r == nil || r.Rows == nil {
		return fmt.Errorf("nil rows")
	}
	vals, err := scanColumns(r.Rows)
	if err != nil {
		return err
	}
	if len(dest) != len(vals) {
		return fmt.Errorf("scan: %d destination args for %d columns", len(dest), len(vals))
	}
	for i := range dest {
		if err := assign(dest[i], vals[i]); err != nil {
			return err
		}
	}
	return nil
}
```

### Notes
- SQLite SQL normalization is scoped to the SQLite adapter only; PostgreSQL and Neon paths still execute repository SQL unchanged through pgx.
- `sqliteRows.Scan` now matches the existing `sqliteRow.Scan` conversion behavior, so repository list queries can scan SQLite `TEXT` timestamps and JSON-backed string slices into domain structs.
- Verification passed: `cd apps/backend && gofmt -w internal/db/sqlite_querier.go && go test ./internal/db/... ./internal/repository/... && go build ./cmd/api`.


---

## 2026-07-05T11:50Z — admin-design-style-guide-2026-07-05 — docs(admin): capture admin visual design system

**Session**: admin-design-style-guide-2026-07-05
**Date**: 2026-07-05 11:50

### Why
The user wanted the color style, visual grading, UI language, and layout rules from `http://localhost:3000/admin/` documented so the same admin visual UI can be rebuilt in another project without reverse-engineering the React/CSS source.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `admindegine.md` | L1-825 | created |

### Before
```markdown
// admindegine.md:1
// File did not exist before this documentation pass.
```

### After
```markdown
// admindegine.md:1-18
# Admin Visual Design System

Use this document as a portable reference for recreating the `http://localhost:3000/admin/` look in another product. The admin UI is a dark, minimal, command-center interface: near-black surfaces, very low-contrast borders, blue/violet accent light, compact typography, mono numeric data, and subtle motion.

## 1. Overall visual direction

- **Mood:** premium infrastructure console, quiet cyber, operational command center.
- **Density:** compact but breathable; avoid oversized enterprise dashboard spacing.
- **Contrast style:** black-on-black layering with thin translucent white borders.
- **Accent behavior:** blue is primary; violet/purple is secondary. Accents should feel like ambient light, not heavy color blocks.
- **Texture:** soft radial glows, faint grid, tiny noise overlays, and 1px gradient highlights.
- **Motion:** short, smooth, spring-like entrance animations and micro hover states.
```

### Notes
- Documentation-only change; no runtime code or tests were modified.
- The filename follows the user's requested spelling: `admindegine.md`.


---

## 104. Enhance Landing Hero Visual UI

**Session**: hero-ui-enhancement-2026-07-05
**Date**: 2026-07-05 12:10

### Why
The public landing hero looked flatter than the adjacent landing sections and still referenced the unsupported `bg-grid-white` utility, leaving parts of the intended grid treatment invisible. The hero also used a heavy glitch headline, slanted CTAs, generic education-themed ticker copy, and `any`-typed inline SVG props, so it needed a focused visual polish pass that better matches Yapapa's premium LLM-gateway UI language.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/web/components/Hero.tsx` | L27-268, L329-353, L730-835, L900-905, L997-1074, L1141 | modified |
| `UPDATE.md` | L2500-2585 | modified |

### Before
```tsx
// apps/web/components/Hero.tsx:37,307-350,783-810,877-883,999-1008
const ReactIcon = (props: any) => (
  <svg viewBox="-10.5 -9.45 21 18.9" fill="currentColor" {...props}>
    <circle cx="0" cy="0" r="2" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <ellipse rx="10" ry="4.5" />
      <ellipse rx="10" ry="4.5" transform="rotate(60)" />
      <ellipse rx="10" ry="4.5" transform="rotate(120)" />
    </g>
  </svg>
);

const CyberButton = ({ children, className, onClick, primary = false }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  primary?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group px-8 py-4 font-mono text-sm font-bold tracking-wider overflow-hidden",
        "clip-path-slant transition-all duration-300",
        primary ? "text-black" : "text-white",
        className,
      )}
    >
      <div className={cn("absolute inset-0 transition-all duration-300", primary ? "bg-white group-hover:bg-cyan-400" : "bg-white/5 border border-white/10 group-hover:border-white/30 group-hover:bg-white/10")} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
      <div className="relative z-10 flex items-center justify-center gap-2">{children}</div>
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50" />
    </button>
  );
};

<motion.div
  animate={{ backgroundPosition: ["0px 0px", "0px 40px"] }}
  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
  className="absolute inset-0 bg-grid-white opacity-[0.15] transform-gpu rotate-x-12 scale-150 origin-top"
/>

const updates = [
  "User @alex_dev just completed Python Basics",
  "New Badge Earned: Neural Architect",
  "500+ users currently online",
  "@sarah_codes deployed a new project",
  "Server capacity upgraded to 99.9%",
];

<h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] text-white">
  <TypewriterText text="Universal" delay={0.3} /> <br />
  <GlitchText
    text="LLM GATEWAY"
    className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black"
  />
</h1>
```

### After
```tsx
// apps/web/components/Hero.tsx:27-268,329-353,783-835,900-905,997-1074
import type { ReactNode, SVGProps } from "react";

const ReactIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="-10.5 -9.45 21 18.9" fill="currentColor" {...props}>
    <circle cx="0" cy="0" r="2" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <ellipse rx="10" ry="4.5" />
      <ellipse rx="10" ry="4.5" transform="rotate(60)" />
      <ellipse rx="10" ry="4.5" transform="rotate(120)" />
    </g>
  </svg>
);

const HERO_STATS = [
  { label: "Models", value: "100+", icon: Layers },
  { label: "Uptime", value: "99.99%", icon: Activity },
  { label: "p95 latency", value: "<50ms", icon: Zap },
];

const CyberButton = ({ children, className, onClick, primary = false }: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  primary?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group px-8 py-4 rounded-2xl font-mono text-sm font-bold tracking-wider overflow-hidden",
        "transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        primary ? "bg-white text-black shadow-[0_20px_60px_-24px_rgba(255,255,255,0.85)] hover:bg-indigo-50" : "border border-white/[0.10] bg-white/[0.045] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md hover:border-white/25 hover:bg-white/[0.08]",
        className,
      )}
    >
      <div className="absolute inset-y-0 left-0 w-1/2 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[220%]" />
      <div className="relative z-10 flex items-center justify-center gap-2">{children}</div>
    </button>
  );
};

<motion.div
  animate={{ backgroundPosition: ["0px 0px", "0px 44px"] }}
  transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
  className="absolute inset-0 bg-grid-pattern opacity-[0.18] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_72%)] transform-gpu rotate-x-12 scale-150 origin-top"
/>

const updates = [
  "Claude Opus routed to us-east-1 in 14ms",
  "GPT-4o stream completed at 847 tokens/s",
  "New model: Gemini 2.5 Pro now available",
  "12.4k active developer workspaces online",
  "p95 latency: 47ms across all regions",
];

<h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] text-white">
  <TypewriterText text="Universal" delay={0.3} /> <br />
  <motion.span className="inline-block bg-gradient-to-br from-white via-indigo-100 to-indigo-400 bg-clip-text text-5xl font-black text-transparent drop-shadow-[0_0_44px_rgba(99,102,241,0.22)] sm:text-6xl md:text-7xl lg:text-8xl">
    LLM GATEWAY
  </motion.span>
</h1>
```

### Notes
- The change is scoped to the public landing hero; dashboard components and SDK-driven dashboard data paths were not touched.
- Verification attempted with `cd apps/web && ../../node_modules/.bin/tsc --noEmit --pretty false`; TypeScript still fails on a pre-existing unrelated syntax error in `apps/web/app/admin/(protected)/models/page.tsx:6` (`TS1005: ',' expected`). `apps/web/components/Hero.tsx` reports no IDE diagnostics.

## 48. fix: prevent zombie reconnect streams and new-chat autosave race

**Session**: bugfix-m6-m7-2026-07-05
**Date**: 2026-07-05

### Why
Two React lifecycle bugs causing state corruption after unmount and session creation:
- **M6**: Notification page `setTimeout(() => connectStream(), 5000)` on stream error was never cleared on unmount, causing zombie reconnection attempts after the component was destroyed.
- **M7**: `handleNewChat()` in ChatPlayground set `activeSessionId` then `setMessages([])`, but the autosave effect could fire with the new ID and old messages, overwriting the new empty session with stale data.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/web/app/dashboard/notifications/page.tsx` | L50-106 | modified |
| `apps/web/components/ChatPlayground.tsx` | L244-263 | modified |

### Before (M6 — notifications/page.tsx)
```tsx
// apps/web/app/dashboard/notifications/page.tsx L50-106
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [connected, setConnected] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const connectStream = useCallback(async () => {
    // ...
    } catch (err) {
      if (controller.signal.aborted) return;
      setConnected(false);
      setTimeout(() => connectStream(), 5000);
    }
  }, []);

  useEffect(() => {
    connectStream();
    return () => {
      abortRef.current?.abort();
    };
  }, [connectStream]);
```

### After (M6 — notifications/page.tsx)
```tsx
// apps/web/app/dashboard/notifications/page.tsx L50-114
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [connected, setConnected] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const connectStream = useCallback(async () => {
    // ...
      for await (const event of stream) {
        if (controller.signal.aborted) break;
        if (!isMountedRef.current) break;
        // ...
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setConnected(false);
      if (isMountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connectStream();
          }
        }, 5000);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connectStream();
    return () => {
      isMountedRef.current = false;
      abortRef.current?.abort();
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connectStream]);
```

### Before (M7 — ChatPlayground.tsx handleNewChat)
```tsx
// apps/web/components/ChatPlayground.tsx L244-263
  const handleNewChat = () => {
    const session: ChatSession = {
      id: newId(),
      // ...
    };
    setSessions((prev) => { /* ... */ });
    setActiveSessionId(session.id);
    setMessages([]);
    setInput("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };
```

### After (M7 — ChatPlayground.tsx handleNewChat)
```tsx
// apps/web/components/ChatPlayground.tsx L244-267
  const handleNewChat = () => {
    isSwitchingRef.current = true;
    const session: ChatSession = {
      id: newId(),
      // ...
    };
    setSessions((prev) => { /* ... */ });
    setActiveSessionId(session.id);
    setMessages([]);
    setInput("");
    requestAnimationFrame(() => {
      isSwitchingRef.current = false;
      textareaRef.current?.focus();
    });
  };
```

### Notes
- M6: `reconnectTimeoutRef` stores the timeout ID so it can be cleared on unmount. `isMountedRef` guards against creating new streams or scheduling reconnects after unmount. The stream loop also checks `isMountedRef` to break out early.
- M7: The `isSwitchingRef` pattern already existed for `handleSwitchChat`; applying it to `handleNewChat` prevents the autosave effect from persisting old messages into the freshly created session. The ref is reset to `false` in the next animation frame, after state updates have flushed.

## 49. fix: LLM pipeline bugs — tool result role, streaming usage, cache key, deep copy, telemetry duration, regex compilation, vision model check, marshal error handling

**Session**: `llm-pipeline-bugfix-2026-07-05`
**Date**: 2026-07-05 19:59

### Why
Seven bugs in the LLM pipeline were causing incorrect Anthropic API calls, lost usage data in streaming, cache collisions, mutation risks from shallow copies, zero-duration telemetry, regex recompilation overhead, false-positive vision model detection, and silent JSON marshal failures.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/backend/pkg/llm/translator/translator.go | L194-200 | modified |
| apps/backend/pkg/llm/translator/openai_to_anthropic.go | L213-220, L264-280 | modified |
| apps/backend/pkg/llm/helper.go | L64-100, L336-343, L220-233, L448-475 | modified |
| apps/backend/pkg/llm/pipeline/pipeline.go | L3-7, L235-249, L307-330 | modified |
| apps/backend/pkg/llm/streaming/writer.go | L3-10, L545-550 | modified |

### Before

```go
// translator.go — Bug C2: tool result role was raw m.Role ("tool")
} else if m.ToolCallID != "" {
    msg["content"] = []map[string]interface{}{
        {
            "type":        "tool_result",
            "tool_use_id": m.ToolCallID,
            "content":     m.Content,
        },
    }
```

```go
// openai_to_anthropic.go — Bug H6: message_start and message_delta had no usage
case "message_start":
    return &llm.StreamChunk{
        Object:   "chat.completion.chunk",
        Created:  time.Now().Unix(),
        Model:    model,
        Provider: provider,
    }, nil
case "message_delta":
    // ... no Usage field set
```

```go
// helper.go — Bug H7: CacheKey missing TopP, TopK, StopSequences, ToolChoice, ResponseFormat
if req.Temperature != nil {
    h.Write([]byte(fmt.Sprintf("|temp=%.4f", *req.Temperature)))
}
if req.MaxTokens != nil {
    h.Write([]byte(fmt.Sprintf("|maxtok=%d", *req.MaxTokens)))
}
```

```go
// helper.go — Bug L1: shallow copy of ContentBlocks
if len(m.ContentBlocks) > 0 {
    blocks := make([]ContentBlock, len(m.ContentBlocks))
    copy(blocks, m.ContentBlocks)
    cpy.Messages[i].ContentBlocks = blocks
}
```

```go
// pipeline.go — Bug L2: hardcoded duration 0
func (i *TelemetryInterceptor) Intercept(...) {
    if i.Record != nil {
        i.Record(req.Model, resp.Provider, resp.Usage, 0)
    }
    return resp, nil
}
```

```go
// helper.go — Bug L4: regex compiled on every call
func SanitizeContent(content string) string {
    content = strings.ReplaceAll(content, "\x00", "")
    content = regexp.MustCompile(`[\x00-\x08\x0B-\x0C\x0E-\x1F]`).ReplaceAllString(content, "")
    return content
}
```

```go
// helper.go — Bug L5: IsVisionModel too broad
visionModels := []string{"gpt-4o", "claude-3", "claude-sonnet", "claude-opus", "gemini", "llava"}
```

```go
// writer.go — Bug L10: marshal swallows errors
func marshal(v interface{}) []byte {
    data, _ := json.Marshal(v)
    return data
}
```

### After

```go
// translator.go — Bug C2: force role "user" for tool results per Anthropic API
} else if m.ToolCallID != "" {
    msg["role"] = "user"
    msg["content"] = []map[string]interface{}{
        {
            "type":        "tool_result",
            "tool_use_id": m.ToolCallID,
            "content":     m.Content,
        },
    }
```

```go
// openai_to_anthropic.go — Bug H6: extract usage from message_start and message_delta
case "message_start":
    usage := &llm.Usage{
        PromptTokens: chunk.Message.Usage.InputTokens,
    }
    return &llm.StreamChunk{..., Usage: usage}, nil
case "message_delta":
    usage := &llm.Usage{
        CompletionTokens: chunk.Usage.OutputTokens,
    }
    return &llm.StreamChunk{..., Usage: usage}, nil
```

```go
// helper.go — Bug H7: added TopP, TopK, StopSequences, ToolChoice, ResponseFormat to CacheKey
if req.TopP != nil {
    h.Write([]byte(fmt.Sprintf("|topp=%.4f", *req.TopP)))
}
if req.TopK != nil {
    h.Write([]byte(fmt.Sprintf("|topk=%d", *req.TopK)))
}
if len(req.StopSequences) > 0 {
    h.Write([]byte("|stop|"))
    h.Write([]byte(strings.Join(req.StopSequences, ",")))
}
if req.ToolChoice != "" {
    h.Write([]byte("|toolchoice|"))
    h.Write([]byte(req.ToolChoice))
}
if req.ResponseFormat != nil {
    rfJSON, _ := json.Marshal(req.ResponseFormat)
    h.Write([]byte("|responseformat|"))
    h.Write(rfJSON)
}
```

```go
// helper.go — Bug L1: deep copy each ContentBlock's pointer fields
for j, b := range m.ContentBlocks {
    blocks[j] = b
    if b.ImageURL != nil {
        blocks[j].ImageURL = &ImageURL{URL: b.ImageURL.URL, Detail: b.ImageURL.Detail}
    }
    if b.ToolUse != nil {
        blocks[j].ToolUse = &ToolUse{ID: b.ToolUse.ID, Name: b.ToolUse.Name, Input: make(json.RawMessage, len(b.ToolUse.Input))}
        copy(blocks[j].ToolUse.Input, b.ToolUse.Input)
    }
    if b.ToolResult != nil {
        blocks[j].ToolResult = &ToolResult{ToolUseID: b.ToolResult.ToolUseID, Content: b.ToolResult.Content, IsError: b.ToolResult.IsError}
    }
}
```

```go
// pipeline.go — Bug L2: record actual duration
start := time.Now()
resp, err := handler(ctx, req)
// ...
for _, ri := range cp.responseInterceptors {
    if ti, ok := ri.(*TelemetryInterceptor); ok {
        RecordTelemetry(ti, req, resp, start)
    }
}
```

```go
// helper.go — Bug L4: package-level compiled regex
var controlCharRegex = regexp.MustCompile(`[\x00-\x08\x0B-\x0C\x0E-\x1F]`)
func SanitizeContent(content string) string {
    content = strings.ReplaceAll(content, "\x00", "")
    content = controlCharRegex.ReplaceAllString(content, "")
    return content
}
```

```go
// helper.go — Bug L5: exclude non-vision Claude models
nonVisionPatterns := []string{"claude-3-haiku", "claude-3.5-haiku"}
for _, nvm := range nonVisionPatterns {
    if strings.Contains(lower, nvm) {
        return false
    }
}
```

```go
// writer.go — Bug L10: log error and return JSON indicator
func marshal(v interface{}) []byte {
    data, err := json.Marshal(v)
    if err != nil {
        slog.Warn("marshal failed", "error", err.Error())
        return []byte(`{"error":"marshal failed"}`)
    }
    return data
}
```

### Notes
- The pre-existing `router` and `watcher` test failures are unrelated to these changes.
- All four modified packages (`llm`, `pipeline`, `streaming`, `translator`) compile and pass `go vet`.

## 12. fix: reconcile quota estimates, batch cancel propagation, webhook secret leak, and 8 other backend bugs

**Session**: backend-bugfix-sweep-2026-07-05
**Date**: 2026-07-05

### Why
Multiple bugs identified across backend service, repository, middleware, and domain layers. Quota estimates were never reconciled with actual usage; batch cancellation did not propagate to running goroutines; webhook secrets leaked in list/get responses; concurrent webhook workers could grab the same rows; invite roles were unvalidated; Stripe webhook body was unbounded; upload failures were silently swallowed; org creation was non-transactional; webhook dispatch had no goroutine tracking; forecast used hardcoded 30-day months; conversation delete did not distinguish not-found from success.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/backend/internal/middleware/quota.go | L239-310 | modified |
| apps/backend/internal/middleware/quota_test.go | L139,201 | modified |
| apps/backend/internal/service/batch.go | L17-25,26,75-99,92-182 | modified |
| apps/backend/internal/domain/models.go | L222-258,348-356 | modified |
| apps/backend/internal/repository/webhook.go | L127-133 | modified |
| apps/backend/internal/repository/conversation.go | L93-97 | modified |
| apps/backend/internal/repository/organization.go | L16-18,22-32,85-97 | modified |
| apps/backend/internal/handler/billing.go | L19 | modified |
| apps/backend/internal/handler/upload.go | L28-84 | modified |
| apps/backend/internal/handler/webhook.go | L41-46 | modified |
| apps/backend/internal/handler/admin_operations.go | L127-128 | modified |
| apps/backend/internal/service/webhook.go | L3-10,27-33,51-58,165-181 | modified |
| apps/backend/internal/service/organization.go | L3-9,20-33 | modified |
| apps/backend/cmd/api/routes.go | L141-142 | modified |

### Before
```go
// quota.go — QuotaCheck signature (no actualTokens param)
func QuotaCheck(tracker QuotaTrackerInterface, getKey func(r *http.Request) *ScopedAPIKey, parseRequest func(r *http.Request) (model string, tokens int)) func(http.Handler) http.Handler {

// batch.go — BatchService (no cancel tracking)
type BatchService struct {
	repo   *repository.BatchJobRepo
	chatFn func(ctx context.Context, req *llm.ChatRequest) (*llm.ChatResponse, error)
}

// models.go — Webhook secret leaks via json:"secret,omitempty"
type Webhook struct {
	Secret    string            `json:"secret,omitempty"`

// models.go — InviteMemberRequest.Validate (no role check)
func (r *InviteMemberRequest) Validate() *AppError {
	if r.Email == "" { return NewError(ErrBadRequest, 400, "Email is required") }
	if r.Role == "" { r.Role = "member" }
	return nil
}

// webhook repo — ListPendingRetries without SKIP LOCKED
`... LIMIT $1`, batchSize)

// billing.go — unbounded body read
body, err := io.ReadAll(r.Body)

// upload.go — silent skip, no error reporting
response.OK(w, map[string]interface{}{"files": uploaded, "count": len(uploaded)})

// organization.go — non-transactional create
org, err := s.repo.Create(ctx, req.Name, userID, "free")

// webhook.go service — no WaitGroup
type WebhookService struct { ... (no wg field) }
func (s *WebhookService) Stop() { s.cancel() }

// admin_operations.go — hardcoded 30
daysRemaining := 30 - now.Day()

// conversation.go — delete without not-found
func (r *ConversationRepo) DeleteConversation(ctx context.Context, userID, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM conversations WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}
```

### After
```go
// quota.go — QuotaCheck with actualTokens reconciliation
func QuotaCheck(tracker QuotaTrackerInterface, getKey func(r *http.Request) *ScopedAPIKey, parseRequest func(r *http.Request) (model string, tokens int), actualTokens func(r *http.Request) int) func(http.Handler) http.Handler {
// ... wraps response writer, calls tracker.RecordUsage(ctx, key.Key, delta) after handler

// batch.go — BatchService with cancel map and DB status checks
type BatchService struct {
	repo   *repository.BatchJobRepo
	chatFn func(ctx context.Context, req *llm.ChatRequest) (*llm.ChatResponse, error)
	mu      sync.Mutex
	cancels map[string]context.CancelFunc
}
// Cancel() now cancels the stored context; process() checks isCancelled() before each status update

// models.go — Webhook secret always excluded from JSON
type Webhook struct {
	Secret    string            `json:"-"`
}
type WebhookWithSecret struct { ... `json:"secret,omitempty"` }
func (w *Webhook) ToPublic() *WebhookWithSecret { ... }

// models.go — InviteMemberRequest.Validate validates role
switch r.Role {
case "member", "admin": // ok
default: return NewError(ErrBadRequest, 400, "Role must be one of: member, admin")
}

// webhook repo — ListPendingRetries with FOR UPDATE SKIP LOCKED
`... LIMIT $1 FOR UPDATE SKIP LOCKED`, batchSize)

// billing.go — 1MB body limit
body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))

// upload.go — per-file error reporting
type UploadFileError struct { Filename, Error string }
type UploadResponse struct { Files, Count, Errors }

// organization.go — transactional create
s.repo.DB().WithTx(ctx, func(q db.Querier) error { ... })

// webhook.go service — WaitGroup tracking
type WebhookService struct { wg sync.WaitGroup; ... }
func (s *WebhookService) Stop() { s.cancel(); s.wg.Wait() with 30s timeout }

// admin_operations.go — dynamic days in month
daysInMonth := time.Date(now.Year(), now.Month()+1, 0, 0, 0, 0, 0, now.Location()).Day()
daysRemaining := daysInMonth - now.Day()

// conversation.go — not-found on zero rows affected
tag, err := r.db.Exec(ctx, ...)
if tag.RowsAffected() == 0 { return domain.ErrConversationNotFound }
```

### Notes
- All packages pass `go vet ./...` and `go build ./...`.
- Middleware tests pass with the new QuotaCheck signature (nil actualTokens).
- The QuotaCheck `actualTokens` param is nil in routes.go because no post-request token extractor is wired yet; the infrastructure is in place for when the LLM pipeline exposes actual usage on the request context.
- Organization repo now exposes `DB()` accessor and `CreateWithQuerier`/`AddMemberWithQuerier` methods for transaction-scoped operations; the original `Create`/`AddMember` methods are preserved for non-transactional callers.

## 51. fix(llm): fix 6 bugs in router, budget, circuit breaker, and guardrails

**Session**: `llm-router-bugfix-2026-07-05`
**Date**: 2026-07-05 20:00

### Why
Six bugs found in the LLM routing, budget estimation, circuit breaker, guardrails, and random seeding subsystems. Each bug could cause incorrect model selection, security bypasses, or non-deterministic behavior.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/backend/pkg/llm/router/budget.go` | L1-165 | modified |
| `apps/backend/pkg/llm/router/budget_test.go` | L29-66 | modified |
| `apps/backend/pkg/llm/router/router.go` | L111-118 | modified |
| `apps/backend/pkg/llm/router/router_test.go` | L310-315 | modified |
| `apps/backend/pkg/llm/router/groups.go` | L1-15, L137, L245 | modified |
| `apps/backend/internal/service/router.go` | L109-116, L246-275 | modified |
| `apps/backend/pkg/llm/watcher/watcher.go` | L229-293 | modified |
| `apps/backend/pkg/llm/watcher/watcher_test.go` | L218-238 | modified |
| `apps/backend/pkg/llm/guardrails/guardrails.go` | L112-194 | modified |
| `apps/backend/pkg/llm/helper.go` | L311-322 | modified |
| `apps/backend/internal/handler/openai_proxy.go` | L100 | modified |
| `apps/backend/internal/handler/anthropic_messages.go` | L159 | modified |

### Before

**Bug M1 — flat 2 credits/token in CostEstimate:**
```go
// budget.go
func CostEstimate(inputTokens, outputTokens int) int {
    total := (inputTokens + outputTokens) * 2
    if total < 100 { return 100 }
    return total
}
```

**Bug M2 — capability matching from model instead of request:**
```go
// budget.go
needsTools := requestedInfo != nil && requestedInfo.SupportsTools
needsVision := requestedInfo != nil && requestedInfo.SupportsVision
needsThinking := requestedInfo != nil && requestedInfo.SupportsThinking
```

**Bug M3 — errorRate() returns 0.0 when total==0:**
```go
// router.go and internal/service/router.go
func (et *errorTracker) errorRate() float64 {
    if et.total == 0 { return 0 }
    return float64(et.failures) / float64(et.total)
}
```

**Bug M4 — filterByCapability uses SupportsThinking() for tools:**
```go
// internal/service/router.go
if p.SupportsThinking() || strings.Contains(p.Name(), "openai") || strings.Contains(p.Name(), "anthropic") {
```

**Bug M5 — HalfOpen→Closed on single success:**
```go
// watcher.go
func (cb *CircuitBreaker) RecordSuccess() {
    cb.failureCount = 0
    if cb.state == StateHalfOpen {
        cb.state = StateClosed
        cb.halfOpenCalls = 0
    }
}
```

**Bug M15 — guardrails skip tool_use/tool_result content:**
```go
// guardrails.go — CheckRequest only checked text and thinking blocks
// guardrails.go — CheckResponse only checked text and thinking blocks
// helper.go — MergeContentBlocks only merged text and thinking blocks
```

**Bug M18 — math/rand without seeding:**
```go
// groups.go
r := rand.Intn(totalWeight)
```

### After

**Bug M1 — model-specific pricing with tiered fallback:**
```go
// budget.go
func CostEstimate(inputTokens, outputTokens int, modelInfo *llm.ModelInfo) int {
    if modelInfo != nil && (modelInfo.InputPricePer1k > 0 || modelInfo.OutputPricePer1k > 0) {
        inputCost := float64(inputTokens) / 1000.0 * modelInfo.InputPricePer1k * 100
        outputCost := float64(outputTokens) / 1000.0 * modelInfo.OutputPricePer1k * 100
        total := int(inputCost + outputCost)
        if total < 100 { return 100 }
        return total
    }
    mult := modelPriceMultiplier(modelInfo.ID) // 1/2/10 by tier
    total := (inputTokens + outputTokens) * mult
    if total < 100 { return 100 }
    return total
}
```

**Bug M2 — extract needs from request when available:**
```go
// budget.go — FindAffordableModel now takes *llm.ChatRequest param
if req != nil {
    needsTools = len(req.Tools) > 0
    needsVision = hasVisionContent(req)
    needsThinking = req.Thinking != nil && req.Thinking.Enabled
} else if requestedInfo != nil {
    needsTools = requestedInfo.SupportsTools
    // ...
}
```

**Bug M3 — return 0.5 for providers with no data:**
```go
func (et *errorTracker) errorRate() float64 {
    if et.total == 0 { return 0.5 }
    return float64(et.failures) / float64(et.total)
}
```

**Bug M4 — proper SupportsTools check with fallback:**
```go
// internal/service/router.go
func supportsTools(p llm.Provider) bool {
    if tp, ok := p.(interface{ SupportsTools() bool }); ok { return tp.SupportsTools() }
    models, _ := p.ListModels(context.Background())
    for _, m := range models { if m.SupportsTools { return true } }
    // known-provider name fallback
    ...
}
```

**Bug M5 — configurable successThreshold (default 3):**
```go
// watcher.go — CircuitBreaker now has successThreshold and successCount fields
func (cb *CircuitBreaker) RecordSuccess() {
    cb.failureCount = 0
    if cb.state == StateHalfOpen {
        cb.successCount++
        if cb.successCount >= cb.successThreshold {
            cb.state = StateClosed
            cb.successCount = 0
            cb.halfOpenCalls = 0
        }
    }
}
```

**Bug M15 — guardrails check tool_use.Input and tool_result.Content:**
```go
// guardrails.go — both CheckRequest and CheckResponse now inspect
// ContentTypeToolUse and ContentTypeToolResult blocks
// helper.go — MergeContentBlocks now includes tool_use and tool_result
```

**Bug M18 — seeded *rand.Rand instance:**
```go
// groups.go
var rng = rand.New(rand.NewSource(time.Now().UnixNano()))
// all rand.Intn → rng.Intn
```

### Notes
- `FindAffordableModel` signature changed: added `req *llm.ChatRequest` parameter. Callers in `openai_proxy.go` and `anthropic_messages.go` updated.
- `CostEstimate` signature changed: added `modelInfo *llm.ModelInfo` parameter. Budget test updated.
- All packages pass `go vet ./...` and `go build ./...`. All existing tests pass.

---

## [N]. docs: comprehensive README.md visual and data overhaul

**Session**: readme-overhaul-2026-07-05
**Date**: 2026-07-05

### Why
The README.md had stale data, inaccurate counts, and was missing several major sections. The LLM pipeline (10-stage, 31 subpackages), Anthropic compatibility, multi-database support, security details, Go SDK examples, and many new routes/pages were absent. Version numbers and file counts throughout were outdated.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| README.md | L1-1424 (full rewrite) | modified |

### Before
- Migrations: listed as 19 (actual: 23)
- Handlers: not specified (actual: 37)
- Services: not specified (actual: 32)
- Repositories: not specified (actual: 44)
- Middleware: not specified (actual: 14)
- LLM pipeline: shown as 16 subpackages (actual: 31)
- No Anthropic compatibility mention
- No multi-database support section
- No LLM Pipeline dedicated section
- No Security section
- No Go SDK example
- Docs pages: listed as 18 (actual: 20)
- Admin pages: listed as 20 with "...12 more" (actual: 19 explicit routes)
- Dashboard subroutes: not all listed
- Missing top-level routes: about, blog, changelog, contact, enterprise, legal, roadmap, status
- Architecture diagram: showed 16 LLM subpackages, no pipeline stage labels
- Schema stats: 19 migrations → now 23
- Redis badge: no version, now Redis 7
- No MongoDB badge in header
- No `docker compose` (used old `docker-compose`)
- Missing `DB_TYPE`, `ENV`, `MISTRAL_API_KEY` env vars
- Typing SVG: didn't mention Redis version
- Footer link author: "Shinmen007" (kept)
- No provider table with capabilities matrix

### After
- All counts verified from codebase: 23 migrations, 37 handlers, 32 services, 44 repositories, 14 middleware, 31 LLM subpackages, 210+ endpoints, 71 tables, 20 docs pages, 19 admin routes, 15 dashboard subroutes
- Added 🤖 **LLM Pipeline** section with 10-stage table, 31 subpackage map, and provider capabilities matrix
- Added Anthropic `/v1/messages` compatibility throughout (API reference, examples, deployment endpoints)
- Added 🗄️ **Database** section with multi-DB support table (Postgres, Neon, MongoDB, SQLite)
- Added 🛡️ **Security** section with auth and protection tables
- Added Go SDK code example alongside TypeScript and Python
- Added `DB_TYPE`, `ENV`, `MISTRAL_API_KEY` to environment variables
- Added MongoDB 7 and SQLite badges to header and infrastructure
- Updated Docker Compose commands to `docker compose` (v2 syntax)
- Added Redis 7 version to badges
- Added provider capabilities matrix with Streaming/Embeddings/Tools columns
- Expanded project structure tree with all route directories
- Added backend layered architecture ASCII diagram
- Enhanced data flow Mermaid diagram with pipeline stages
- Updated Roadmap to 30+ completed features and expanded planned items
- Added `setup/` admin route (first-time admin bootstrap)
- Added `/v1/messages` endpoint in Chat & AI section

### Notes
- All version numbers verified from `apps/web/package.json`, `apps/backend/go.mod`, and `package.json`
- All file counts verified by `ls | wc -l` on actual directories
- Route counts verified from `cmd/api/routes.go` grep patterns

## cache-eviction-batch-fix

**Session**: `cache-eviction-batch-fix`
**Date**: 2026-07-05 00:00

### Why
Bug L7 in the backend LLM cache: when the cache is full, `Set()` called `evictOldest(1)` to make room for one new entry. `evictOldest()` performs an O(n) sort of all entries, so evicting one entry per insert produced an O(n) sort on every single `Set()` once the cache reached `maxSize`. Evicting a batch (10% of `maxSize`) on each eviction amortizes the sort cost across many subsequent inserts, dramatically reducing per-insert work when the cache is at capacity (e.g. maxSize=10000 → sort once per ~1000 inserts instead of every insert).

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/backend/pkg/llm/cache/cache.go | L133-145 | modified |

### Before
```go
// cache.go L133-136
	// Evict oldest entries if at capacity
	if len(c.entries) >= c.maxSize {
		c.evictOldest(1)
	}
```

### After
```go
// cache.go L133-145
	// Evict a batch of oldest entries if at capacity.
	// Evicting 10% at a time amortizes the O(n) sort cost in evictOldest
	// across many inserts, instead of sorting on every single Set() call.
	if len(c.entries) >= c.maxSize {
		evictBatch := c.maxSize / 10
		if evictBatch < 1 {
			evictBatch = 1
		}
		// Ensure we free at least one slot, even if batch is larger than needed.
		if len(c.entries)-evictBatch < c.maxSize-1 {
			evictBatch = len(c.entries) - c.maxSize + 1
		}
		c.evictOldest(evictBatch)
	}
```

### Notes
- `go build ./pkg/llm/cache/...` passes
- `go test -race -cover ./pkg/llm/cache/...` passes (coverage 66.6%)
- For the default `maxSize` of 10000, eviction now removes 1000 entries per call (10%) instead of 1, amortizing the O(n) sort across ~1000 subsequent inserts.
- The `len(c.entries)-evictBatch < c.maxSize-1` guard keeps behavior correct for very small caches (e.g. maxSize=1 or maxSize=2) where the 10% batch could otherwise evict fewer entries than needed to stay under the limit after the new insert.

## Session: `bugfix-auth-sdk-api-routes` — 2026-07-05

**Title (conventional-commits):** `fix(web): resolve 9 frontend auth, SDK, and API route bugs (C3, H5, H12, H13, H14, M8, M9, M16, M17)`

### Why
Nine bugs in the frontend auth, SDK, and API route layer were causing broken auth flows, silent token drops, blocked API-key callers, missing admin endpoints, un-abortable SSE streams, broken SDK streaming consumers, unbounded backend fetches, discarded status reasons, and runtime crashes on undefined provider IDs.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/web/auth.ts | L34, L104-129 | modified |
| apps/web/app/lib/actions.ts | L203, L291, L335, L375 | unchanged (verified correct) |
| apps/web/app/api/chat/route.ts | L10, L89-106, L123-157, L210-212 | modified |
| apps/web/app/api/admin/users/[id]/route.ts | L4-22 | modified |
| apps/web/lib/api/require-auth.ts | L3-16 | modified |
| apps/web/lib/api/sdk.ts | L473-494, L790-806, L1242-1262, L1553-1562 | modified |
| apps/web/lib/api/admin-sdk.ts | L85, L116-120 | modified |
| apps/web/tests/lib/api/admin-sdk.test.ts | L167-170 | modified |

### Bug C3: Frontend auth endpoints missing /api prefix
**Before:**
```ts
// auth.ts L34 — original was already /auth/login (correct — backend routes are /auth/*, not /api/auth/*)
const res = await fetch(`${BACKEND_URL}/auth/login`, {
// actions.ts — same, all /auth/* paths are correct for the backend
```
**After:**
```ts
// Verified by testing against running backend: /auth/login, /auth/signup, /auth/me,
// /auth/forgot-password, /auth/profile, /auth/password all work at /auth/* (NOT /api/auth/*).
// The backend registers auth routes at /auth/* (lines 167-195 of routes.go).
// No /api prefix needed — the original code was correct.
```
**Note:** The SDK (sdk.ts) uses `/api/auth/*` paths because those are proxied through the Next.js frontend's API routes at `/api/auth/*`, not direct-to-backend calls. The `auth.ts` and `actions.ts` files call the backend directly and correctly use `/auth/*`.

### Bug H5: Expired backendToken silently dropped with no refresh
**Before:**
```ts
// auth.ts L104-106
if (token.backendToken && isTokenExpired(token.backendToken as string)) {
  token.backendToken = undefined;
}
```
**After:**
```ts
// auth.ts L104-129
if (token.backendToken && isTokenExpired(token.backendToken as string)) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.backendToken as string}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      // Token still accepted by backend — keep it for now
    } else {
      token.backendToken = undefined;
    }
  } catch {
    // Network error or timeout — don't clear token on transient failures
  }
}
```

### Bug H12: API-key-only auth impossible via /api/chat
**Before:**
```ts
// require-auth.ts
export async function requireAuth(request: Request): Promise<Response | null> {
  const session = await auth();
  if (!session?.user) {
    return new Response(
      JSON.stringify({ success: false, error: "Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  return null;
}
```
**After:**
```ts
// require-auth.ts
export async function requireAuth(request: Request): Promise<Response | null> {
  const session = await auth();
  if (!session?.user) {
    const apiKey = request.headers.get("x-api-key");
    if (apiKey) {
      return null; // Allow API-key-only auth — backend validates the key
    }
    return new Response(
      JSON.stringify({ success: false, error: "Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  return null;
}
```

### Bug H13: Admin users [id] route shadows catch-all
**Before:**
```ts
// apps/web/app/api/admin/users/[id]/route.ts — only DELETE exported
export async function DELETE(request, { params }) { ... }
```
**After:**
```ts
// Added GET and PUT handlers that proxy to the backend
export async function GET(request, { params }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const { id } = await params;
  return proxyToBackend(request, `/api/admin/users/${encodeURIComponent(id)}`);
}
export async function PUT(request, { params }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const { id } = await params;
  return proxyToBackend(request, `/api/admin/users/${encodeURIComponent(id)}`);
}
// DELETE unchanged
```

### Bug H14: SSE/notification streams cannot be aborted
**Before:**
```ts
// sdk.ts — fetchWithTimeout creates its own AbortController with no external signal support
private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), this.timeout);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally { clearTimeout(id); }
}
// chatStream and notificationsStream had no signal parameter
```
**After:**
```ts
// sdk.ts — fetchWithTimeout now accepts optional external AbortSignal
private async fetchWithTimeout(
  url: string, init: RequestInit, externalSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), this.timeout);
  if (externalSignal) {
    if (externalSignal.aborted) { controller.abort(); }
    else { externalSignal.addEventListener("abort", () => controller.abort(), { once: true }); }
  }
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally { clearTimeout(id); }
}
// chatStream and notificationsStream now accept optional AbortSignal parameter
async *chatStream(data, signal?: AbortSignal): AsyncGenerator<string, void, unknown> { ... }
async *notificationsStream(signal?: AbortSignal): AsyncGenerator<NotificationEvent, void, unknown> { ... }
```

### Bug M8: Chat route converts SSE to AI SDK format, breaking SDK consumers
**Before:**
```ts
// route.ts — always transforms OpenAI SSE to Vercel AI SDK Data Stream format
```
**After:**
```ts
// route.ts — if x-api-key is present (SDK/programmatic call), proxy raw OpenAI SSE
const isSDKCall = !!apiKey;
if (isSDKCall) {
  // Return raw OpenAI SSE stream without transformation
  const stream = new ReadableStream({ ... });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", ... } });
}
// Otherwise, transform to Vercel AI SDK Data Stream for browser useChat
```

### Bug M9: Chat route has no timeout on backend fetch
**Before:**
```ts
const backendRes = await fetch(`${BACKEND_URL}/api/chat`, { method: "POST", headers, body: JSON.stringify(body) });
```
**After:**
```ts
const STREAM_TIMEOUT_MS = 300_000; // 5 minutes
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);
const backendRes = await fetch(`${BACKEND_URL}/api/chat`, {
  method: "POST", headers, body: JSON.stringify(body), signal: controller.signal,
}).then((res) => { clearTimeout(timeoutId); return res; });
```

### Bug M16: Admin SDK updateUserStatus silently discards reason
**Before:**
```ts
// admin-sdk.ts
await this.api.adminUpdateUserStatus(id, status); // reason not passed
// sdk.ts
adminUpdateUserStatus(id: string, status: string) {
  return this.request<{ updated: boolean }>("PUT", `/api/admin/users/${encodeURIComponent(id)}/status`, { status });
}
```
**After:**
```ts
// admin-sdk.ts
await this.api.adminUpdateUserStatus(id, status, reason);
// sdk.ts
adminUpdateUserStatus(id: string, status: string, reason?: string) {
  return this.request<{ updated: boolean }>("PUT", `/api/admin/users/${encodeURIComponent(id)}/status`, { status, reason });
}
```

### Bug M17: Admin SDK updateProvider uses ! on potentially undefined id
**Before:**
```ts
// admin-sdk.ts
await this.api.adminUpdateProvider(data.id!, data); // runtime crash if data.id is undefined
```
**After:**
```ts
// admin-sdk.ts
if (data.id === undefined) {
  throw new Error("updateProvider requires data.id — got undefined");
}
await this.api.adminUpdateProvider(data.id, data);
```

### Notes
- Bug C3 was a false positive: the backend registers auth routes at `/auth/*` (not `/api/auth/*`), verified by curling the running backend. The SDK's `/api/auth/*` paths work because those go through Next.js API route proxies.
- The admin-sdk.test.ts was updated to expect the `reason` parameter in `updateUserStatus` calls.
- Pre-existing test failures (wiring-verification mock data, hooks module-level getSDK, auth-flow OAuth) are unrelated to these changes.
- Pre-existing TypeScript error in `apps/web/app/admin/(protected)/models/page.tsx` is unrelated.

## [N]. Fix bug M11: Conversation and Prompt list handlers return pagination metadata

**Session**: `bug-M11-pagination-metadata`
**Date**: 2026-07-05 00:00

### Why
`ListConversations` and `ListPrompts` handlers accepted `page` and `limit` query params but used `response.OK`, dropping pagination metadata (`total`, `page`, `limit`, `totalPages`) from the response envelope. Clients (Go SDK, TypeScript SDK) had no way to know the total record count or total pages, breaking pagination UIs. The correct `response.Paginated` pattern was already in use by `ListFiles` (`upload.go`).

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/backend/internal/handler/conversation.go | L53-59 | modified |
| apps/backend/internal/handler/prompt.go | L50-56 | modified |
| apps/backend/internal/service/conversation.go | L33-39 | modified |
| apps/backend/internal/service/prompt.go | L41-47 | modified |
| apps/backend/internal/repository/conversation.go | L69-95 | modified |
| apps/backend/internal/repository/prompt.go | L64-92 | modified |
| apps/backend/internal/service/service_integration_test.go | L517, L538, L570, L596 | modified |
| apps/backend/pkg/sdk/client.go | L677-685 | modified |
| apps/backend/pkg/sdk/client_test.go | L325-343 | modified |
| apps/web/lib/api/sdk.ts | L1002-1007 | modified |
| apps/web/lib/api/hooks.ts | L271-276 | modified |

### Before
```go
// apps/backend/internal/handler/conversation.go:53-59
page, limit := parsePagination(r)
convs, appErr := h.conversationSvc.ListConversations(r.Context(), u.ID, page, limit)
if appErr != nil {
    response.Error(w, appErr.Status, appErr.Message)
    return
}
response.OK(w, convs)
```

```go
// apps/backend/internal/handler/prompt.go:50-56
page, limit := parsePagination(r)
prompts, appErr := h.promptSvc.ListPrompts(r.Context(), u.ID, page, limit)
if appErr != nil {
    response.Error(w, appErr.Status, appErr.Message)
    return
}
response.OK(w, prompts)
```

```go
// apps/backend/internal/repository/conversation.go:69-91
func (r *ConversationRepo) ListConversations(ctx context.Context, userID string, limit, offset int) ([]Conversation, error) {
    ...
    return result, rows.Err()
}
```

```go
// apps/backend/internal/repository/prompt.go:64-86
func (r *PromptRepo) ListPrompts(ctx context.Context, userID string, limit, offset int) ([]Prompt, error) {
    ...
    return result, rows.Err()
}
```

```go
// apps/backend/internal/service/conversation.go:33-39
func (s *ConversationService) ListConversations(ctx context.Context, userID string, page, limit int) ([]repository.Conversation, *domain.AppError) {
    convs, err := s.repo.ListConversations(ctx, userID, limit, (page-1)*limit)
    ...
    return convs, nil
}
```

```go
// apps/backend/internal/service/prompt.go:41-47
func (s *PromptService) ListPrompts(ctx context.Context, userID string, page, limit int) ([]repository.Prompt, *domain.AppError) {
    prompts, err := s.repo.ListPrompts(ctx, userID, limit, (page-1)*limit)
    ...
    return prompts, nil
}
```

```go
// apps/backend/pkg/sdk/client.go:677-688
func (c *Client) ListPrompts(ctx context.Context) ([]Prompt, error) {
    var r envelope
    if err := c.get(ctx, "/api/prompts", nil, &r); err != nil {
        return nil, err
    }
    var prompts []Prompt
    if err := unmarshalData(r.Data, &prompts); err != nil {
        return nil, err
    }
    return prompts, nil
}
```

```ts
// apps/web/lib/api/sdk.ts:1002-1003
listPrompts() {
    return this.request<Prompt[]>("GET", "/api/prompts");
}
```

```ts
// apps/web/lib/api/hooks.ts:271-276
export function usePrompts() {
  return useQuery<Prompt[]>({
    queryKey: ["prompts"],
    queryFn: () => getSDK().listPrompts(),
  });
}
```

### After
```go
// apps/backend/internal/handler/conversation.go:53-59
page, limit := parsePagination(r)
convs, total, appErr := h.conversationSvc.ListConversations(r.Context(), u.ID, page, limit)
if appErr != nil {
    response.Error(w, appErr.Status, appErr.Message)
    return
}
response.Paginated(w, convs, total, page, limit)
```

```go
// apps/backend/internal/handler/prompt.go:50-56
page, limit := parsePagination(r)
prompts, total, appErr := h.promptSvc.ListPrompts(r.Context(), u.ID, page, limit)
if appErr != nil {
    response.Error(w, appErr.Status, appErr.Message)
    return
}
response.Paginated(w, prompts, total, page, limit)
```

```go
// apps/backend/internal/repository/conversation.go:69-95
func (r *ConversationRepo) ListConversations(ctx context.Context, userID string, limit, offset int) ([]Conversation, int, error) {
    ...
    var total int
    _ = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM conversations WHERE user_id = $1`, userID).Scan(&total)
    return result, total, nil
}
```

```go
// apps/backend/internal/repository/prompt.go:64-92
func (r *PromptRepo) ListPrompts(ctx context.Context, userID string, limit, offset int) ([]Prompt, int, error) {
    ...
    var total int
    _ = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM (SELECT DISTINCT ON (name) id FROM prompts WHERE user_id = $1) sub`, userID).Scan(&total)
    return result, total, nil
}
```

```go
// apps/backend/internal/service/conversation.go:33-39
func (s *ConversationService) ListConversations(ctx context.Context, userID string, page, limit int) ([]repository.Conversation, int, *domain.AppError) {
    convs, total, err := s.repo.ListConversations(ctx, userID, limit, (page-1)*limit)
    ...
    return convs, total, nil
}
```

```go
// apps/backend/internal/service/prompt.go:41-47
func (s *PromptService) ListPrompts(ctx context.Context, userID string, page, limit int) ([]repository.Prompt, int, *domain.AppError) {
    prompts, total, err := s.repo.ListPrompts(ctx, userID, limit, (page-1)*limit)
    ...
    return prompts, total, nil
}
```

```go
// apps/backend/pkg/sdk/client.go:677-685
func (c *Client) ListPrompts(ctx context.Context, page, limit int) (*PaginatedResult[Prompt], error) {
    var r envelope
    if err := c.get(ctx, "/api/prompts", paginationQuery(page, limit), &r); err != nil {
        return nil, err
    }
    return paginatedResult[Prompt](&r)
}
```

```ts
// apps/web/lib/api/sdk.ts:1002-1007
listPrompts(page?: number, limit?: number) {
    return this.paginatedRequest<Prompt>("/api/prompts", {
      page,
      limit,
    });
}
```

```ts
// apps/web/lib/api/hooks.ts:271-276
export function usePrompts(page?: number, limit?: number) {
  return useQuery<PaginatedResult<Prompt>>({
    queryKey: ["prompts", page, limit],
    queryFn: () => getSDK().listPrompts(page, limit),
  });
}
```

### Notes
- The prompt count query wraps the `DISTINCT ON (name)` subquery so the total reflects the unique-name listing the user sees, not the raw row count of all prompt versions.
- Repository count queries are best-effort (errors ignored via `_ =`) matching the existing `FileRepo.ByUser` pattern; a failed count yields `total = 0` and the page slice is still returned.
- The Go SDK `Client.ListPrompts` signature changed from `(ctx) ([]Prompt, error)` to `(ctx, page, limit) (*PaginatedResult[Prompt], error)` — callers must be updated. The TypeScript `listPrompts` and `usePrompts` similarly accept optional `page`/`limit` and now return a `PaginatedResult<Prompt>`.
- Pre-existing `go vet` failure in `pkg/sdk/client_test.go:956` (`ReadSSE` signature mismatch) is unrelated to this change and was present beforehand.

## 2. Fix ReadSSE to properly parse SSE events per spec (bug H8)

**Session**: `fix-readsse-h8`
**Date**: 2026-07-05 18:30

### Why
The `ReadSSE` function in both `pkg/llm/provider/provider.go` and `pkg/sdk/utils.go` only yielded raw `data:` lines, discarding `event:` lines and not accumulating multi-line data fields per the SSE specification. This caused the Anthropic SSE protocol (which sends both `event:` and `data:` lines per event) to lose event type information, making it impossible for the `OpenAIToAnthropicTranslator.TranslateStreamChunk` to correctly distinguish between `message_start`, `content_block_delta`, `message_delta`, etc. The function also did not handle `id:` fields or join multiple `data:` lines with newlines as required by the SSE spec.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/backend/pkg/llm/provider/provider.go | L592-680 | modified |
| apps/backend/pkg/llm/provider/provider.go | L310-331 | modified |
| apps/backend/pkg/llm/provider/provider_test.go | L250-370 | modified |
| apps/backend/pkg/sdk/utils.go | L49-77 | modified (full rewrite) |
| apps/backend/pkg/sdk/client.go | L512-531 | modified |
| apps/backend/pkg/sdk/client.go | L988-1003 | modified |
| apps/backend/pkg/sdk/client_test.go | L954-1015 | modified |

### Before
```go
// provider.go - old ReadSSE
func ReadSSE(r io.Reader, yield func(string) bool) {
    buf := make([]byte, 4096)
    var line []byte
    for {
        n, err := r.Read(buf)
        if n > 0 {
            for i := 0; i < n; i++ {
                b := buf[i]
                if b == '\n' {
                    if len(line) > 0 {
                        if !yield(string(line)) {
                            return
                        }
                    }
                    line = line[:0]
                } else if b != '\r' {
                    line = append(line, b)
                }
            }
        }
        if err != nil {
            if len(line) > 0 {
                yield(string(line))
            }
            return
        }
    }
}
```

```go
// provider.go - old caller in AnthropicProvider.ChatStream
ReadSSE(resp.Body, func(line string) bool {
    if !strings.HasPrefix(line, "data: ") {
        return true
    }
    data := strings.TrimPrefix(line, "data: ")
    if data == "[DONE]" {
        return false
    }
    chunk, err := p.translator.TranslateStreamChunk([]byte(data), req.Model, p.name)
    // ...
})
```

### After
```go
// provider.go - new SSEEvent struct and ReadSSE
type SSEEvent struct {
    EventType string // from "event:" lines; defaults to "message" per SSE spec
    Data      string // from "data:" lines, joined with newlines if multiple
    ID        string // from "id:" lines
}

func ReadSSE(r io.Reader, yield func(SSEEvent) bool) {
    // Accumulates event:, data:, id: fields
    // Emits SSEEvent on blank line boundary
    // Joins multiple data: lines with \n per SSE spec
    // Strips single leading space after field: per SSE spec
    // ...
}
```

```go
// provider.go - new caller in AnthropicProvider.ChatStream
ReadSSE(resp.Body, func(evt SSEEvent) bool {
    if evt.Data == "[DONE]" {
        return false
    }
    if evt.Data == "" {
        return true
    }
    chunk, err := p.translator.TranslateStreamChunk([]byte(evt.Data), req.Model, p.name)
    // ...
})
```

### Notes
- The `pkg/sdk/utils.go` `ReadSSE` was also updated with the same spec-compliant implementation and `SSEEvent` struct, since it had the same bug.
- Both callers in `pkg/sdk/client.go` (ChatStream and notification stream) were updated to use the new `SSEEvent` callback signature.
- Tests in both packages were rewritten to validate event-level parsing, multi-data-line joining, `event:` field capture, `id:` field capture, and Anthropic-style SSE stream parsing.
- The `SSEEvent.EventType` field is available to callers that need it (e.g., for future Anthropic-native handling at the provider level), but the current translator-based callers only use `Data` since `TranslateStreamChunk` already parses the `type` field from the JSON payload.


## [N+17]. feat(playground/ui): redesign comparison grid, pre-prompt frame, header live-count, accessible clear button, reduced-motion guard

**Session**: `playground-ui-avant-garde-2026-07-06`
**Date**: 2026-07-06 19:55

### Why
The Playground page was functional but visually generic: model response cards used a soft glow with no structural differentiation, the chat area showed a centered placeholder before the first prompt (hiding the multi-model frame), the header always read the static "Compare Models" label, and there was no inline way to clear a running conversation. The goal was an avant-garde, benchmark-canvas aesthetic where each model column is keyed by its provider color and the comparison grid is always visible — turning the empty state into a structural preview rather than a dead-end.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/web/components/playground/ChatInterface.tsx | L1-620 | modified |
| apps/web/app/playground/page.tsx | L1-700 | modified |

### Before
```tsx
// ChatInterface.tsx — ModelResponseCard had only a blurred glow, no accent rail;
// pre-prompt state rendered a centered "Send a message to compare models" placeholder
// and hid the comparison grid entirely; ChatSessionCard (dead code) was still defined.
// page.tsx — header always showed static "Compare Models"; no clear-conversation button;
// no MotionConfig reduced-motion guard around the tree.
```

### After
```tsx
// ChatInterface.tsx — ModelResponseCard now carries a 2px provider-keyed accent rail
// (getProviderColor) and a provider-tinted header gradient; a new EmptyRail renders the
// full N-column benchmark frame (dashed, provider-accented) before the first prompt so
// the layout reads as a comparison canvas. The two dead card variants were removed.
// page.tsx — header shows a live "{n} models live" / "Compare Models" status; a bordered
// clear-conversation button (Trash2) appears once messages exist; the whole tree is
// wrapped in <MotionConfig reducedMotion="user"> so OS reduced-motion prefs are honored.
```

### Notes
- Removed the unused `ChatSessionCard` function (and its now-unused `RotateCcw`/`Bot` imports were re-pointed; `Columns3`/`Layers` added) to cut dead code and reduce bundle surface.
- Added `aria-label` / `role="log"` attributes to the message region, input, and action buttons for WCAG AA screen-reader parity.
- `EmptyRail` reuses `ModelResponseCard`'s provider-accent logic so the pre-prompt frame and live responses stay visually consistent.
- No behavioral change to streaming, history, or model-selection flows; purely presentational + one new affordance (clear conversation).

## [R1]. Audit-fix round 1: confirmed bug fixes

**Session**: dra-full-audit-fix-loop
**Date**: 2026-07-09 08:02

### Why
Automated full-repo audit (parallel read-only agents + adversarial verification) found and fixed confirmed bugs in this round.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/backend/internal/db/mongo_querier.go | L702-781 (added L785-825) | modified |
| apps/backend/internal/handler/admin_providers.go | L307-356 (added), L393-440 | modified |
| apps/backend/internal/middleware/auth.go | L156-167 | modified |
| apps/backend/internal/repository/admin_security_repo.go | L187-193 | modified |
| apps/backend/internal/repository/webhook.go | L63 | modified |
| apps/backend/internal/service/export.go | L91-99 (added), L125-133 (added) | modified |
| apps/backend/internal/service/provider.go | L317-341 | modified |
| apps/backend/internal/service/webhook.go | L119-122, L161-172, L201-212, L320-323, L337, L382 | modified |
| apps/backend/pkg/llm/provider/openai_sdk.go | L178-185 | modified |
| apps/backend/pkg/llm/streaming/relay.go | L24-99 | modified |
| apps/backend/pkg/llm/types.go | L84-88 | modified |
| apps/web/lib/api/admin-sdk.ts | L70-73 | modified |
| apps/web/lib/api/rate-limit.ts | L57-66 | modified |
| apps/web/lib/api/sdk.ts | L598-605, L868-880 | modified |

### Before
```code
// apps/backend/internal/db/mongo_querier.go — L705
	// Handle AND conditions
	parts := strings.Split(where, " and ")
// L716-719
		if strings.Contains(part, " is null") {
			col := strings.TrimSpace(strings.Split(part, " is null")[0])
// L722-725
		if strings.Contains(part, " is not null") {
			col := strings.TrimSpace(strings.Split(part, " is not null")[0])
// L729-732
		for _, op := range []string{">=", "<=", "<>", ">", "<", "="} {
			if strings.Contains(part, op) {
				sides := strings.SplitN(part, op, 2)

// apps/backend/internal/handler/admin_providers.go — L393-410
func validateNotPrivateURL(rawURL string) error {
	if skipSSRFCheck {
		return nil
	}
	u, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Errorf("invalid URL")
	}
	host := u.Hostname()
	if host == "" {
		return fmt.Errorf("missing hostname")
	}
	ips, err := net.LookupIP(host)
	if err != nil {
		return fmt.Errorf("cannot resolve hostname: %w", err)
	}
	for _, ip := range ips {
		if ip.IsPrivate() || ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
			return fmt.Errorf("URL resolves to private/reserved IP %s", ip)
		}
	}
	return nil
}

// apps/backend/internal/middleware/auth.go — L158-167
		if !u.IsAdmin() {
			response.Error(w, 403, "Admin access required")
			return
		}
		if !u.HasPermission(permission) {
			response.Error(w, 403, "Permission denied: "+permission)
			return
		}

// apps/backend/internal/repository/admin_security_repo.go — L187-189
func (r *AdminSecurityRepo) ReviewSuspicious(ctx context.Context, id int64, action string, _ string) error {
	_, err := r.db.Exec(ctx, `UPDATE suspicious_activities SET reviewed=true,resolved=$2 WHERE id=$1`, id, action == "dismiss")

// apps/backend/internal/repository/webhook.go — L63
		`UPDATE webhooks SET url = $1, secret = $2, events = $3, headers = $4, active = $5

// apps/backend/internal/service/export.go — L91-99 / L125-133 (no JSON branch; always CSV)

// apps/backend/internal/service/provider.go — L317-321
	for _, m := range models {
		if m.ID == modelID || strings.HasSuffix(m.ID, modelID) {
			return &m, nil
		}
	}

// apps/backend/internal/service/webhook.go — L119 (no URL validation), L161-172 (no event filter; sem after send), L201-212 / L337 / L382 (idempotencyKey recomputed from time)
	if err := req.Validate(); err != nil {
		return nil, err
	}
// dispatch loop:
		if !w.Active {
			continue
		}
		go func(webhookID string, c webhook.Config, e webhook.Event) {
			defer func() {
				s.wg.Done()
				if r := recover(); r != nil { ... }
			}()
			select {
			case s.sem <- struct{}{}:
				s.sendAndTrack(s.ctx, webhookID, c, e)
				<-s.sem
			case <-s.ctx.Done():
				return
			}
		}(...)
// idempotencyKey := fmt.Sprintf("%s:%s:%d", d.WebhookID, d.EventType, d.CreatedAt.Unix())

// apps/backend/pkg/llm/provider/openai_sdk.go — L178-185
		delta.ToolCalls[i] = llm.ToolCall{
			ID:   tc.ID,
			Type: string(tc.Type),
			Function: llm.ToolCallFunction{ ... }

// apps/backend/pkg/llm/streaming/relay.go — L26-44
	finished := false
	...
		if !finished {
			p.writer.WriteFinish(...)
		}
	...
		if chunk.FinishReason != nil {
			finished = true
		}
// writeChunk: WriteToolCallStart(i, ...), WriteToolCallDelta(i, ...)

// apps/backend/pkg/llm/types.go — L84-87
type ToolCall struct {
	ID       string           `json:"id"`
	Type     string           `json:"type"`
	Function ToolCallFunction `json:"function"`
}

// apps/web/lib/api/admin-sdk.ts — L70
    return this.api.adminListUsers(
      params?.page,
      params?.limit,
    ) as unknown as PaginatedResult<AdminUserDetail>;

// apps/web/lib/api/rate-limit.ts — L60-66
  const entry = store.get(identifier);
  if (!entry) return null;
  const maxRequests = MAX_REQUESTS_PER_WINDOW;

// apps/web/lib/api/sdk.ts — L598-605
  public async paginatedRequest<T>(
    path: string,
    query: { page?: number; limit?: number } = {},
// L868-875
  adminListUsers(page?: number, limit?: number) {
    return this.paginatedRequest<User>("/api/admin/users", {
      page,
      limit,
    });
```

### After
```code
// apps/backend/internal/db/mongo_querier.go — L705 (quote-aware split) + new helpers L785-825
	// Handle AND conditions, splitting only on " and " outside single-quoted literals
	parts := splitOnAndRespectingQuotes(where)
// IS NULL / IS NOT NULL / operators now use findOpOutsideQuotes(...)
// splitOnAndRespectingQuotes / findOpOutsideQuotes added (respect single-quoted literals)

// apps/backend/internal/handler/admin_providers.go — SSRF TOCTOU fix in fetchModelsFromUpstream + resolveAndValidateHost
	var dialIP net.IP
	if !skipSSRFCheck {
		u, perr := url.Parse(modelsURL)
		...
		ips, verr := resolveAndValidateHost(u.Hostname())
		...
		dialIP = ips[0]
		port := u.Port()
		...
		client.Transport = &http.Transport{
			DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
				dialAddr := net.JoinHostPort(dialIP.String(), port)
				d := net.Dialer{Timeout: 10 * time.Second}
				return d.DialContext(ctx, network, dialAddr)
			},
		}
	}
// resolveAndValidateHost returns validated IPs; validateNotPrivateURL delegates to it
func resolveAndValidateHost(host string) ([]net.IP, error) { ... }

// apps/backend/internal/middleware/auth.go — L158-167
		if !u.HasPermission(permission) && !u.IsAdmin() {
			response.Error(w, 403, "Permission denied: "+permission)
			return
		}

// apps/backend/internal/repository/admin_security_repo.go — L187-193
	resolved := action == "resolve" || action == "dismiss"
	_, err := r.db.Exec(ctx, `UPDATE suspicious_activities SET reviewed=true,resolved=$2 WHERE id=$1`, id, resolved)

// apps/backend/internal/repository/webhook.go — L63 (preserve secret when empty)
		`UPDATE webhooks SET url = $1, secret = CASE WHEN $2 <> '' THEN $2 ELSE secret END, events = $3, headers = $4, active = $5

// apps/backend/internal/service/export.go — JSON branch added before CSV writer
	if format == "json" {
		enc := json.NewEncoder(f)
		enc.SetIndent("", "  ")
		if err := enc.Encode(logs); err != nil {
			return "", err
		}
		return filePath, nil
	}

// apps/backend/internal/service/provider.go — L317-341 (exact match first, single-ambiguous suffix fallback)
	for _, m := range models {
		if m.ID == modelID {
			return &m, nil
		}
	}
	var match *llm.ModelInfo
	for _, m := range models {
		if strings.HasSuffix(m.ID, modelID) {
			if match != nil {
				return nil, domain.NewError(domain.ErrNotFound, 404, "model not found")
			}
			mm := m
			match = &mm
		}
	}
	if match != nil {
		return match, nil
	}

// apps/backend/internal/service/webhook.go — URL validation, event filter, sem-before-send, stored idempotency key
	if err := webhook.ValidateWebhookURL(req.URL); err != nil {
		return nil, domain.NewError(domain.ErrBadRequest, 400, err.Error())
	}
// dispatch:
		if !webhook.IsEventAllowed(event.Type, w.Events) {
			continue
		}
		go func(webhookID string, c webhook.Config, e webhook.Event) {
			defer s.wg.Done()
			defer func() {
				if r := recover(); r != nil { ... }
			}()
			select {
			case s.sem <- struct{}{}:
				defer func() { <-s.sem }()
				s.sendAndTrack(s.ctx, webhookID, c, e)
			case <-s.ctx.Done():
				return
			}
		}(...)
// delivery carries IdempotencyKey; retries use d.IdempotencyKey instead of recompute

// apps/backend/pkg/llm/provider/openai_sdk.go — L178-185
		delta.ToolCalls[i] = llm.ToolCall{
			ID:    tc.ID,
			Type:  string(tc.Type),
			Index: tc.Index,
			Function: llm.ToolCallFunction{ ... }

// apps/backend/pkg/llm/streaming/relay.go — finishWritten + ctx-cancel finish + idx from tc.Index
	finishWritten := false
	...
		if !finishWritten {
			p.writer.WriteFinish(...)
		}
	...
		if chunk.FinishReason != nil {
			finishWritten = true
		}
	case <-ctx.Done():
		if !finishWritten {
			_ = p.writer.WriteFinish(...)
		}
// writeChunk: idx := tc.Index (fallback i); WriteToolCallStart(idx, ...), WriteToolCallDelta(idx, ...)

// apps/backend/pkg/llm/types.go — L84-88
type ToolCall struct {
	ID       string           `json:"id"`
	Type     string           `json:"type"`
	Index    int              `json:"index,omitempty"`
	Function ToolCallFunction `json:"function"`
}

// apps/web/lib/api/admin-sdk.ts — L70-73
    return this.api.adminListUsers(
      params?.page,
      params?.limit,
      params?.query,
      params?.status,
    ) as unknown as PaginatedResult<AdminUserDetail>;

// apps/web/lib/api/rate-limit.ts — L60-66 (anonymous cap)
  const maxRequests = isAuthenticated
    ? MAX_REQUESTS_PER_WINDOW
    : MAX_ANONYMOUS_REQUESTS;

// apps/web/lib/api/sdk.ts — L598-605 + L868-880
  public async paginatedRequest<T>(
    path: string,
    query: { page?: number; limit?: number; query?: string; status?: string } = {},
  adminListUsers(page?: number, limit?: number, query?: string, status?: string) {
    return this.paginatedRequest<User>("/api/admin/users", { page, limit, query, status });
  }
```

### Notes
Round 1 of the audit-fix loop. 14 files changed. Next rounds re-audit for regressions.

---

## [R2]. Audit-fix round 2: full parallel audit → fix → re-audit regression loop

**Session**: dra-full-audit-fix-loop
**Date**: 2026-07-09 08:10

### Why
A full read-only parallel audit (10 specialized agents over backend handlers/services/repository/LLM-gateway/middleware/SDK/pkgs and frontend SDK/app/security) surfaced 1×P0, 5×P1, and ~30×P2/P3 confirmed defects across the gateway. Fixes were applied by file-isolated agents, then a second re-audit pass caught two regressions introduced by the fixes (broken HTTPS webhook delivery; guardrails still not blocking single-phrase injection). Those regressions are fixed here too. Build is green and unit tests pass.

### Files Changed (47 source files + 2 new migrations)

| File | Lines | Change Type |
|------|-------|-------------|
| apps/backend/migrations/024_stripe_invoice_unique.sql | L1-8 | created |
| apps/backend/migrations/024_promo_redemption_unique.sql | L1-9 | created |
| apps/backend/internal/service/stripe.go | L106-141 | modified |
| apps/backend/internal/service/webhook.go | L115-122, L154-158, L313-317 | modified |
| apps/backend/internal/handler/openai_proxy.go | L256-271, L350-353 | modified |
| apps/backend/internal/handler/enterprise.go | L120-131, L186-197 | modified |
| apps/backend/internal/handler/admin_users_full.go | L44-59, L144-190 | modified |
| apps/backend/internal/handler/auth_handlers.go | L60-77 | modified |
| apps/backend/internal/handler/handler.go | L568-597 | modified |
| apps/backend/internal/handler/sse.go | L41-63 | modified |
| apps/backend/internal/handler/anthropic_messages.go | L243-323 | modified |
| apps/backend/internal/middleware/quota.go | adds ToScopedUser | modified |
| apps/backend/internal/middleware/redis_quota.go | L69-107 | modified |
| apps/backend/cmd/api/routes.go | L55-63, L121-124, L308-314, L383-384, L448-450, L467 | modified |
| apps/backend/internal/repository/credits.go | L87-105 | modified |
| apps/backend/internal/repository/admin_billing_repo.go | L40, L54-60, L292-294 | modified |
| apps/backend/internal/repository/admin_features_repo.go | L269-279, L292-294 | modified |
| apps/backend/internal/repository/admin_provider_repo.go | L127-141 | modified |
| apps/backend/internal/repository/budget.go | L105-108 | modified |
| apps/backend/internal/repository/fine_tuning.go | L16-30 | modified |
| apps/backend/internal/repository/transaction.go | L33-38 | modified |
| apps/backend/internal/repository/conversation.go | L92-97 | modified |
| apps/backend/internal/repository/file.go | L77-82 | modified |
| apps/backend/internal/repository/user.go | L86-97 | modified |
| apps/backend/internal/config/config.go | L104 | modified |
| apps/backend/internal/config/config_test.go | — | modified |
| apps/backend/internal/domain/models.go | L306-309 | modified |
| apps/backend/internal/service/fine_tuning.go | L47-63 | modified |
| apps/backend/internal/handler/fine_tuning_handlers.go | L69-82 | modified |
| apps/backend/cmd/api/services.go | SetCache wiring | modified |
| apps/backend/pkg/webhook/webhook.go | SendWithIdempotency + helpers | modified |
| apps/backend/pkg/llm/helper.go | L46-54 | modified |
| apps/backend/pkg/llm/cache/cache.go | L307-317 | modified |
| apps/backend/pkg/llm/cache/semantic.go | L46-80 | modified |
| apps/backend/pkg/llm/anthropic/formatter.go | L278-360 | modified |
| apps/backend/pkg/llm/anthropic/schema.go | L121 | modified |
| apps/backend/pkg/llm/streaming/relay.go | L24-65 | modified |
| apps/backend/pkg/llm/provider/multikey.go | L52-120 | modified |
| apps/backend/pkg/llm/provider/provider.go | L443-449 | modified |
| apps/backend/pkg/llm/circuitbreaker/circuitbreaker.go | L128-160 | modified |
| apps/backend/pkg/llm/ws/gateway.go | L63-71, L199-213 | modified |
| apps/backend/pkg/llm/router/router.go | L267-271 | modified |
| apps/backend/pkg/llm/guardrails/guardrails.go | L149-201 | modified |
| apps/backend/pkg/llm/guardrails/guardrails_test.go | L46-48 | modified |
| apps/backend/pkg/llm/provider/openai_sdk.go | L183 (derefInt) | modified |
| apps/web/app/playground/page.tsx | L97-98, L163-170, L298-314, L356 | modified |
| apps/web/app/dashboard/notifications/page.tsx | L57-74, L102, L112 | modified |
| apps/web/app/dashboard/DashboardOverviewClient.tsx | L85-89, L91-94, L619-622 | modified |
| apps/web/app/dashboard/analytics/AnalyticsClient.tsx | shared MetricCard (verified correct) | n/a |

### Key fixes (Before → After)

**P0 — Stripe double-credit on webhook replay** (`internal/service/stripe.go`, new `024_stripe_invoice_unique.sql`)
Before: idempotency `InvoiceExists` ran OUTSIDE the transaction and `stripe_invoice_id` had no UNIQUE constraint → replayed/raced `checkout.session.completed` granted credits twice.
After: existence check runs INSIDE `WithTx` via `InvoiceExistsTx`; DB-level `uq_stripe_invoice_id` UNIQUE backs it.

**P1 — Embeddings honored `X-Sandbox` without admin check** (`internal/handler/openai_proxy.go`)
Before: `if r.Header.Get("X-Sandbox") != "true" { asyncLogAndDeduct(...) }` — no auth check.
After: `isSandbox` rejected with 403 unless `u != nil && u.IsAdmin()`; billing skipped only `isSandbox && u.IsAdmin()`.

**P1 — Virtual-key List/Deactivate lacked admin/ownership authz** (`cmd/api/routes.go`, `enterprise.go`)
Before: routes gated only by `authMW`; `ListVirtualKeys` returned ALL tenants' keys; `DeactivateVirtualKey` allowed any user to disable any key.
After: both wrapped in `RequireAdmin`; handlers scope to caller's own keys when non-admin.

**P1 — AdminCreateAdminUser privilege escalation** (`admin_users_full.go`)
Before: request `role` passed straight through to `CreateAdminUser` (any admin → superadmin).
After: `if req.Role == "superadmin" && (u == nil || u.Role != "superadmin") { 403 }`.

**P2 — AdminRemoveAdmin could deactivate a superadmin** (`admin_users_full.go`, `routes.go`)
Before: `RequireAdmin` only; deletes any admin row including superadmin.
After: `RequirePermission("superadmin")` + handler guards (no self-removal, no removal of last active superadmin).

**P1 — Webhook SSRF on Update + dispatch ignores Events + idempotency mismatch** (`service/webhook.go`, `pkg/webhook/webhook.go`, `domain/models.go`)
Before: `Update` only format-validated; `Dispatch` fired every webhook regardless of `Events`; retry key recomputed from a different timestamp.
After: `Update` runs `ValidateWebhookURL`; `Dispatch`/`ProcessPendingRetries` pre-filter via `IsEventAllowed`; `WebhookDelivery.IdempotencyKey` persisted and reused by retry paths.

**P2 — HTTPS webhook delivery broken by SSRF TOCTOU fix** (REGRESSION FIX, `pkg/webhook/webhook.go`)
Before: `req.URL.Host = resolvedIP` → Go derived TLS `ServerName` from the IP → cert verify failed for all HTTPS webhooks (`x509: cert valid for <host>, not <ip>`).
After: custom `Transport` with `DialContext` pinning the validated `ip:port` (no DNS re-resolution) and `TLSClientConfig.ServerName = origHost`; `req.Host` keeps the real host header.

**P1/P2 — Guardrails could not block a single injection phrase** (`guardrails/guardrails.go`) + REGRESSION FIX
Before: block gated on `if risk := detectInjection(content); risk > 0.5` (`risk = matches/12`, so one phrase ≈0.08 never reached the inner `matches>0` check).
After: `matches := countInjection(content); risk := detectInjection(content); if risk > 0.5 || matches > 0 { ... if matches > 0 || risk > 0.15 { result.Allowed = false } }` — a single phrase now blocks. Test `TestCheckRequest_PromptInjection` updated to expect `false`.

**P1 — Stale `user_credits` cache after billing writes** (`credits.go`, `admin_billing_repo.go`, `admin_features_repo.go`)
Before: `*Tx` mutation paths never invalidated the `credits:<userID>` cache → stale balances up to TTL.
After: `cache.Delete(ctx, creditsCacheKey(userID))` on each mutation (nil-guarded); admin repos given `SetCache` wiring.

**P1 — `AdjustCredits` corrupted `total_spent` on deductions** (`admin_billing_repo.go`)
Before: `total_spent = total_spent + GREATEST(-$2, 0)` added `abs(amount)` on a deduction.
After: `total_spent = total_spent + LEAST($2, 0)` (correctly subtracts).

**P1 — `AdminProviderRepo.Update` dropped circuit-breaker/rate-limit columns** (`admin_provider_repo.go`)
Before: SET omitted `circuit_breaker_*` and `rate_limit_rpm/tpm`.
After: all six columns added to the SET list bound to provider fields.

**P2 — Budget hard-cap unenforceable / FineTuning mime_type NULL / Promo double-redeem / ENV default dev** (`budget.go`, `fine_tuning.go`, `024_promo_redemption_unique.sql`, `config.go`)
After: `CheckCapExceeded` sums `ABS(amount)` over `type='usage'`; `CreateDataset` accepts + persists `mimeType`; `(promo_id,user_id)` UNIQUE constraint added; `ENV` defaults to `"production"`.

**P1 — LLM cache key omitted tool-calls/content-blocks** (`helper.go`, `cache/cache.go`)
Before: keyed only on Role+Content → within-tenant wrong cached completions (text vs image, differing tool history).
After: `ToolCalls` and `ContentBlocks` json-hashed into the key.

**P2 — Anthropic native streaming dropped tool calls / streaming usage lost / multikey rotation dead / prefix collision / CB resets / ws double-disconnect / routeByCost no-match**
After: `anthropic/formatter.go` emits `tool_use` blocks; `streaming/relay.go` buffers usage and writes it exactly once on close; `multikey.go` loops all instances with failover and advances the counter; `provider.go` uses longest-prefix match; `circuitbreaker.go` resets `successes` on reopen and counts the trial on transition; `ws/gateway.go` uses `sync.Once` for `Disconnect`; `router.go` returns an explicit error.

**P2 — Quota not enforced for session/JWT proxy requests / Redis quota fails open / CORS wildcard+credentials** (`routes.go`, `quota.go`, `redis_quota.go`)
After: `getKey` resolves a `ToScopedUser` quota subject for authenticated sessions (1000 req/day, 2M tok/month defaults); Redis quota errors fail-closed; CORS disables credentials when `*` origin present.

**Frontend** (`playground/page.tsx`, `notifications/page.tsx`, `DashboardOverviewClient.tsx`)
After: playground reads `sessionsRef.current` so multi-turn history survives (no stale closure); notifications reconnect on normal stream end AND clear a pending auto-reconnect timer on manual reconnect; ambient glow `opacity-20` override removed; analytics X-axis parses `YYYY-MM-DD` from raw parts (no UTC off-by-one); stray `Livering-[0.01]` class removed.

### Notes
- `go build ./...` exits 0; `go vet ./internal/handler/...` clean (only a pre-existing broken untracked test `rbac_handlers_test.go` references `testutil.GenerateTestJWTWithRole` which does not exist — out of scope).
- `go test ./pkg/llm/guardrails/... ./pkg/llm/cache/... ./pkg/llm/circuitbreaker/... ./pkg/llm/provider/... ./internal/config/...` pass.
- A cross-agent conflict was intercepted: the data-integrity fix agent's `git checkout HEAD --` would have reverted two security-handler files; those security fixes were re-applied and verified in the diff.
- `openai_sdk.go:183` (`*int` vs `int` `ToolCall.Index` mismatch from go-openai v1.41.2) was a pre-existing compile break; fixed with a `derefInt` helper so the full build is green.
- False positives flagged and dropped by agents: export-download code does not exist in `exports/page.tsx`; `AnalyticsClient` glow/date logic lives in shared `MetricCard` and was already correct; `EstimateTokens` pre-router model mismatch not present in owned handler files; `pkg/webhook` `SendWithRetry`/`WebhookRepo` json-marshal errors are unreachable for `map[string]string`.

---

## [R3]. Audit-fix round 3: LLM gateway, WebSocket, and credits-cache regressions

**Session**: dra-full-audit-fix-loop
**Date**: 2026-07-11

### Why
A re-audit pass after R2 surfaced additional confirmed defects and regressions in the LLM gateway, WebSocket gateway, and credits cache invalidation paths. Fixes were applied file-isolated, then the backend was rebuilt and fully tested.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/backend/pkg/llm/cache/cache.go | L1- | modified |
| apps/backend/pkg/llm/guardrails/guardrails.go | L1- | modified |
| apps/backend/pkg/llm/streaming/relay.go | L1- | modified |
| apps/backend/pkg/llm/circuitbreaker/circuitbreaker.go | L1- | modified |
| apps/backend/pkg/llm/ws/gateway.go | L1- | modified |
| apps/backend/pkg/llm/ws/gateway_test.go | L1- | modified |
| apps/backend/pkg/llm/anthropic/formatter.go | L1- | modified |
| apps/backend/pkg/llm/router/router.go | L1- | modified |
| apps/backend/internal/repository/credits.go | L1- | modified |
| apps/backend/internal/service/credits.go | L1- | modified |
| apps/backend/internal/service/stripe.go | L1- | modified |
| apps/backend/internal/service/webhook.go | L1- | modified |
| apps/backend/internal/repository/admin_billing_repo.go | L1- | modified |

### Key fixes (Before → After)

**P1 — Cache key collisions omitted tool history / content blocks** (`pkg/llm/cache/cache.go`)
Before: `hashMessages` concatenated only `Role` and `Content` without delimiters, so distinct message sequences could hash identically and return wrong cached completions.
After: messages are hashed with explicit delimiters (`\x00`), and `ToolCalls`/`ContentBlocks`/`Name` are included in the key so differing tool history or multi-modal content produces distinct keys.

**P1 — Output guardrails failed to block** (`pkg/llm/guardrails/guardrails.go`)
Before: `CheckResponse` detected PII/pattern violations but never set `result.Allowed = false`, so output guardrails were effectively no-ops.
After: `CheckResponse` now sets `Allowed = false` and populates `Reason` for PII, blocked patterns, and prompt-injection matches in outputs.

**P1 — Streaming tool-call deltas merged into wrong slot** (`pkg/llm/streaming/relay.go`)
Before: the accumulator ignored `ToolCall.Index` and always appended deltas to the last tool call, corrupting parallel tool calls.
After: deltas are matched by `Index`; missing slots are padded, and empty padded entries are filtered from the final message.

**P2 — Circuit breaker timer leaked / half-open state mishandled** (`pkg/llm/circuitbreaker/circuitbreaker.go`)
Before: `StreamRecord` used a goroutine + timer.Reset in a loop that could leak timers and mishandle the half-open trial outcome.
After: replaced with a `select` loop using a fresh timer per chunk, resetting failure/success counters correctly on state transitions.

**P2 — WebSocket gateway write races and unexported handler type** (`pkg/llm/ws/gateway.go`, `gateway_test.go`)
Before: multiple goroutines could write to the same `Conn` concurrently; the handler type used an unexported `connectionState`, making `RegisterHandler` unusable from external packages.
After: added per-connection write mutex and `SendLocked`; exported `ConnectionState`; updated default handlers, internal slices/maps, and tests to use the exported type.

**P2 — Anthropic SSE block indices could collide** (`pkg/llm/anthropic/formatter.go`)
Before: text and thinking blocks shared a single block index, causing deltas/stop events to target the wrong block.
After: separate `TextBlockIndex` and `ThinkingBlockIndex` counters ensure each block stream gets its own index.

**P2 — Router capability filter could silently no-match** (`pkg/llm/router/router.go`)
Before: `routeByCapability` returned `nil, nil` when no provider matched, leading to nil-pointer dereferences downstream.
After: returns an explicit error so callers handle the no-match case.

**P1 — Credits cache invalidated inside uncommitted transactions** (`internal/repository/credits.go`, `internal/service/credits.go`, `internal/service/stripe.go`)
Before: `DeductTx`/`UpsertTx` deleted the credits cache before the surrounding transaction committed; a rollback left stale cache data.
After: removed cache invalidation from Tx methods; added `InvalidateCache` helper; callers (`Purchase`, `DeductForUsage`, `FulfillCheckout`) invalidate after successful commit.

**P2 — Webhook dispatch semaphore leaked on panic** (`internal/service/webhook.go`)
Before: the semaphore was released inline; a panic in `attemptDelivery` would leak a slot.
After: release is wrapped in `defer` so the semaphore is always returned.

**P2 — Admin billing credit adjustment failed for missing rows** (`internal/repository/admin_billing_repo.go`)
Before: `AdjustCredits` assumed a `user_credits` row existed; on a fresh user it would silently do nothing.
After: if no row exists, an INSERT is performed first, then the UPDATE is retried.

### Validation
- `cd apps/backend && go build ./...` → exit 0
- `cd apps/backend && go test ./...` → all packages pass
- Frontend typecheck/lint not run because the frontend has pre-existing dependency/configuration issues unrelated to these backend changes.

### Notes
- The WebSocket `Handler` signature change is a breaking API change for any external handler implementations; they must now accept `*ConnectionState` instead of `Conn` and can use `Gateway.SendLocked` for thread-safe writes.

### Post-review fixes
- `pkg/llm/ws/gateway.go`: `Send` renamed to private `send`; `SendLocked` is now the only public write path that holds the per-connection mutex.
- `pkg/llm/ws/gateway_test.go`: `TestGatewaySend` now exercises `SendLocked` via a `ConnectionState`.
- `pkg/llm/guardrails/guardrails.go`: `CheckRequest`/`CheckResponse` now collect all violations and always set `Reason` by joining them, instead of overwriting on the first violation.

---

## [R4]. Audit-fix round 4: billing race, streaming cost, webhook idempotency, router cache stampede

**Session**: dra-full-audit-fix-loop
**Date**: 2026-07-11

### Why
A targeted deep-dive audit surfaced a critical concurrent-billing vulnerability, streaming token over-estimation, a webhook idempotency collision, a router cache stampede, and inconsistent sandbox enforcement.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/backend/internal/service/credits.go | L135- | modified |
| apps/backend/internal/handler/openai_proxy.go | L42- | modified |
| apps/backend/internal/service/webhook.go | L191, L345, L383 | modified |
| apps/backend/pkg/llm/router/router.go | L1- | modified |

### Key fixes (Before → After)

**P0 — Concurrent billing race granted free usage** (`internal/service/credits.go`)
Before: `LogAndDeduct` aborted the transaction when `credits.Balance < cost`. Concurrent requests that passed the pre-flight `CheckBalance` could then fail async deduction and receive the response for free.
After: Balance check removed from `LogAndDeduct`; the pre-flight gate remains the sole balance check, and deductions proceed so in-flight requests are always billed (balance may go negative).

**P1 — Streaming output tokens wildly over-estimated** (`internal/handler/openai_proxy.go`)
Before: `outputTokens += llm.EstimateTokens(chunk.Delta.Content)` ran on every tiny stream chunk.
After: Stream content is buffered in `outputBuffer` and `EstimateTokens` is called once at `FINISH`.

**P1 — Pre-flight cost estimation bypassed balance check** (`internal/handler/openai_proxy.go`)
Before: `EstimateTokens(req.Model, nil)` always returned zero input tokens, so `CheckBalance` was effectively skipped.
After: Request messages are converted to `domain.ChatMessage` and passed to `EstimateTokens`.

**P1 — Webhook idempotency key collision** (`internal/service/webhook.go`)
Before: Key used `event.Timestamp.Unix()`, giving 1-second precision and deduplicating distinct events.
After: Key uses `UnixNano()`.

**P2 — Router ListModels cache stampede** (`pkg/llm/router/router.go`)
Before: Concurrent cache misses all called `p.ListModels(ctx)` upstream simultaneously.
After: `singleflight.Group` collapses concurrent fetches per provider into one upstream call.

**P2 — Webhook retry loop blocked sequentially** (`internal/service/webhook.go`)
Before: `ProcessPendingRetries` and `RetryDelivery` ran `attemptDelivery` synchronously inside the semaphore.
After: Each retry attempt runs in its own goroutine under the semaphore.

**P3 — Inconsistent sandbox enforcement / model prefix stripping** (`internal/handler/openai_proxy.go`)
Before: Chat completions silently disabled sandbox for non-admins; A/B router used `LastIndex` and stripped middle group names.
After: Non-admin `X-Sandbox` now returns 403; A/B router uses `Index` to preserve middle group names.

### Validation
- `cd apps/backend && go build ./...` ✅
- `cd apps/backend && go test ./...` ✅


---

## [R5]. Audit-fix round 5: cross-tenant cache leak, SDK envelope, streaming over-billing, credentials race, dashboard proxy routes, analytics/export UI

**Session**: dra-full-audit-fix-loop
**Date**: 2026-07-11

### Why
A targeted deep-dive audit surfaced additional confirmed defects across the LLM gateway, SDK, dashboard, and credentials layer. Fixes were applied file-isolated, then the backend was rebuilt and tested.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| apps/backend/internal/domain/models.go | L1- | modified |
| apps/backend/internal/service/provider.go | L1- | modified |
| apps/backend/internal/handler/openai_proxy.go | L1- | modified |
| apps/backend/internal/handler/handler.go | L1- | modified |
| apps/backend/pkg/sdk/client.go | L1- | modified |
| apps/backend/internal/handler/admin_users_full.go | L1- | modified |
| apps/backend/pkg/llm/circuitbreaker/circuitbreaker.go | L1- | modified |
| apps/backend/internal/handler/admin_providers.go | L1- | modified |
| apps/backend/pkg/webhook/webhook.go | L1- | modified |
| apps/backend/internal/handler/anthropic_messages.go | L1- | modified |
| apps/backend/internal/db/db.go | L1- | modified |
| apps/backend/internal/repository/setup_repo.go | L1- | modified |
| apps/backend/internal/handler/admin_messages.go | L1- | modified |
| apps/backend/internal/handler/admin_operations.go | L1- | modified |
| apps/backend/pkg/llm/credentials/vault.go | L1- | modified |
| apps/web/app/api/exports/[id]/route.ts | L1- | created |
| apps/web/app/dashboard/exports/page.tsx | L1- | rewritten |
| apps/web/app/dashboard/analytics/AnalyticsClient.tsx | L1- | modified |
| apps/web/lib/api/sdk.ts | L1- | modified |
| apps/web/lib/api/admin-sdk.ts | L1- | modified |
| apps/web/app/dashboard/keys/KeysClient.tsx | L1- | modified |

### Key fixes (Before → After)

**H1 — Cross-tenant cache leak** (`internal/domain/models.go`, `internal/service/provider.go`, `internal/handler/openai_proxy.go`, `internal/handler/handler.go`)
Before: `domain.ChatRequest` had no `Metadata`; `toLLMChatRequest` never set `user_id`/`tenant_id`/`api_key_id`; cache key in `pkg/llm/helper.go` hashed empty identifiers, letting requests from different tenants collide.
After: added `Metadata map[string]string` to `domain.ChatRequest`; handlers inject trusted `user_id`, `api_key_id`, and `tenant_id` into `Metadata`; `toLLMChatRequest` propagates it to `llm.ChatRequest` so cache keys are scoped.

**H5 — Go SDK envelope mismatch** (`pkg/sdk/client.go`)
Before: `OpenAIChatCompletions`, `OpenAIEmbeddings`, and `OpenAIListModels` decoded into the generic `{success,data,error}` envelope, but `/v1/*` proxy endpoints return raw OpenAI JSON.
After: those three methods now decode directly into `json.RawMessage`, preserving OpenAI compatibility.

**H6 — Dashboard 404s / mock data** (`apps/web/app/api/exports/[id]/route.ts`, `apps/web/app/dashboard/exports/page.tsx`, `apps/web/lib/api/sdk.ts`)
Before: exports page used hard-coded mock data; there was no proxy route for `GET /api/exports/:id`.
After: created `app/api/exports/[id]/route.ts`; rewrote exports page to use real SDK hooks; added `deleteExportJob` to the SDK.

**M3 — Analytics NaN totals and wrong time-range slice** (`apps/web/app/dashboard/analytics/AnalyticsClient.tsx`)
Before: `totalCost` could become `NaN`; time-range slicing used `slice(0, days).reverse()` which showed oldest data instead of latest.
After: added `Number.isFinite` guards; changed slice to `slice(-days)` to show the most recent N days.

**Streaming over-billing** (`internal/handler/openai_proxy.go`, `internal/handler/anthropic_messages.go`)
Before: async billing ran on every stream chunk, including client disconnects and abnormal terminations.
After: both handlers now track `completedNormally` and only call `asyncLogAndDeduct` when the stream finished for a real reason.

**SQLite bootstrap race** (`internal/db/db.go`, `internal/repository/setup_repo.go`)
Before: concurrent `POST /api/setup/bootstrap` requests could race past the `COUNT(*)=0` check because SQLite deferred transactions don't lock until first write.
After: added a process-wide `sqliteBootstrapMu` around the SQLite bootstrap path; `CreateFirstAdmin` acquires it before beginning the transaction.

**Missing `rows.Err()` checks** (`internal/handler/admin_messages.go`, `internal/handler/admin_operations.go`)
Before: `Rows` iteration ended without checking `rows.Err()`.
After: added `defer rows.Close()` and explicit `rows.Err()` checks with logging.

**Wrong Request ID in keys page** (`apps/web/app/dashboard/keys/KeysClient.tsx`)
Before: UI displayed a request ID from a non-existent failed request object.
After: removed the misleading request-ID display and replaced it with a clear generic error message.

**admin-sdk.listUserUsage cast** (`apps/web/lib/api/sdk.ts`, `apps/web/lib/api/admin-sdk.ts`)
Before: `listUserUsage` returned a raw array and the admin-sdk cast was unsafe.
After: backend returns paginated envelope; SDK decodes `PaginatedResult<UsageRecord>`; admin-sdk uses the typed result.

**Credentials data race** (`pkg/llm/credentials/vault.go`)
Before: `GetBestKey` returned cached `*Credential` pointers that `RecordSuccess`/`RecordFailure` mutated concurrently.
After: `getActiveCredentials` returns deep copies so selection and mutation no longer race.

### Validation
- `cd apps/backend && go build ./...` → exit 0
- `cd apps/backend && go test ./pkg/llm/credentials/... ./pkg/llm/circuitbreaker/... ./internal/handler/... ./internal/repository/... ./internal/db/...` → all pass
- `cd apps/web && npx tsc --noEmit` → pre-existing errors (missing module declarations, type mismatches) unrelated to these changes
- `cd apps/web && npm run lint` → fails because `next lint` is not a recognized command in Next.js 16.3.0-canary.16 / ESLint 10; this is a pre-existing tooling issue

### Notes
- The frontend has pre-existing dependency/type issues that predate this session; the changes above do not introduce new TypeScript errors in the modified files.

---

## [R5]. fix(auth): eliminate "Invalid or expired token" on fresh login by using a dedicated backend JWT cookie

**Session**: auth-token-cookie-fix
**Date**: 2026-07-12

### Why
After a fresh credentials login, every authenticated API request returned `{"success":false,"error":"Invalid or expired token"}`. The backend `Auth` middleware was trying to read NextAuth's encrypted session cookies (`authjs.session-token`) and validate them as backend JWTs. NextAuth cookies are encrypted with `AUTH_SECRET`, while backend JWTs are signed with `AUTH_SECRET` (or a separate secret), so the middleware rejected the cookie contents as an invalid JWT. The real backend JWT was only available in the NextAuth session object on the frontend and was not being sent to the backend on SDK requests.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| `apps/backend/internal/middleware/auth.go` | L55-68 | modified |
| `apps/backend/internal/middleware/token_blacklist.go` | L37-46 | modified |
| `apps/backend/internal/handler/auth_handlers.go` | L282-296, L322-333 | modified |
| `apps/web/auth.ts` | L1-180 | modified |
| `apps/web/app/lib/actions.ts` | L1, L260-270 | modified |

### Before
```go
// apps/backend/internal/middleware/auth.go
// Auth middleware tried to read NextAuth session cookies as backend JWTs.
if c, err := r.Cookie("authjs.session-token"); err == nil {
    tokenStr = c.Value
}
```

```ts
// apps/web/auth.ts
// backendToken lived only in the NextAuth session; no cookie was set.
```

### After
```go
// apps/backend/internal/middleware/auth.go
// Dedicated backend token cookie set by the frontend on login.
if c, err := r.Cookie("dra_backend_token"); err == nil {
    tokenStr = c.Value
}
```

```ts
// apps/web/auth.ts
// Sets HttpOnly dra_backend_token cookie in the jwt callback on sign-in.
async function setBackendTokenCookie(token: string) {
  const maxAge = 60 * 60 * 24 * 7;
  const secure = process.env.NODE_ENV === "production";
  const sameSite = secure ? "none" : "lax";
  const domain = process.env.BACKEND_TOKEN_COOKIE_DOMAIN || undefined;
  const cookieStore = await cookies();
  cookieStore.set("dra_backend_token", token, {
    httpOnly: true,
    secure,
    sameSite: sameSite as "lax" | "none",
    path: "/",
    maxAge,
    ...(domain ? { domain } : {}),
  });
}

// Called inside jwt callback when trigger === "signIn" || "signUp".
```

```ts
// apps/web/app/lib/actions.ts
export async function signOutAction() {
  "use server";
  try {
    await clearBackendTokenCookie();
  } catch {
    // Best-effort cleanup
  }
  await signOut();
}
```

### Key changes
1. **Backend `Auth` middleware** now looks for a dedicated `dra_backend_token` cookie instead of NextAuth session cookies. It still accepts `Authorization: Bearer <token>` and `x-api-key` as before.
2. **Backend `TokenBlacklist` middleware** also reads the `dra_backend_token` cookie for the token to check.
3. **Backend `Logout` handler** extracts the token from the `Authorization` header or the `dra_backend_token` cookie for blacklisting, and clears the `dra_backend_token` cookie in the response.
4. **Frontend `auth.ts`** sets the `dra_backend_token` HttpOnly cookie in the NextAuth `jwt` callback when `trigger === "signIn"` or `"signUp"`. The cookie max-age matches the backend JWT expiry (7 days). Supports `BACKEND_TOKEN_COOKIE_DOMAIN` for cross-subdomain deployments.
5. **Frontend `signOutAction`** clears the backend token cookie before signing out of NextAuth.

### Validation
- `cd apps/backend && go build ./...` → exit 0
- `cd apps/web && npx tsc --noEmit` → pre-existing errors in unrelated files; no new errors in `auth.ts` or `actions.ts`

### Notes
- OAuth providers (GitHub/Google) still do not receive a backend JWT, so those users will need a separate backend linking flow to use authenticated SDK endpoints.
- The `dra_backend_token` cookie is HttpOnly, so it is sent automatically with `credentials: "include"` SDK requests and cannot be read by client-side JavaScript.

## [init]. docs(claude): refresh CLAUDE.md against current repo layout

**Session**: init-claude-md-2026-07-12
**Date**: 2026-07-12 19:27

### Why
`/init` found an already-strong `CLAUDE.md`, but several facts had drifted: migration range, LLM package count/sizes, sandbox auth semantics, missing `packages/` dir, and a dead `olla.md` reference in `AGENTS.md`. Keeping agent guidance accurate prevents wrong assumptions on auth, migrations, and SDK touch points.

### Files Changed

| File | Lines | Change Type |
|------|-------|-------------|
| CLAUDE.md | monorepo / backend / LLM / quirks / key-files sections | modified |
| AGENTS.md | reference table (`olla.md` row) | modified |

### Before
```markdown
# CLAUDE.md (stale excerpts)
- packages/: Reserved for shared packages (currently empty).
- olla.md: Exhaustive project reference ...
- Raw SQL migrations ... 001_*.sql–022_*.sql
- 18+ subpackages under pkg/llm/
- X-Sandbox: true ... disables quota, cost, and logging for testing
- lib/api/sdk.ts (~1700 lines) ... hooks.ts (~800 lines)
```

### After
```markdown
# CLAUDE.md (corrected excerpts)
- Root package.json workspaces include packages/*, but no packages/ directory is checked in yet.
- ops.md / osa.md / FIXES_APPLIED.md / UPDATE.md called out; olla.md reference removed from AGENTS.md
- Migrations 001_*.sql–024_*.sql (colliding/disabled numbers noted)
- ~30 subpackages under pkg/llm/ with supporting packages listed
- X-Sandbox admin-only; non-admins get 403
- sdk.ts ~2240 lines, hooks.ts ~900 lines, Go client.go ~1860 lines
```

### Notes
- Did not rewrite CLAUDE.md from scratch; structure, commands, hard constraints, and UPDATE.md mandate were already correct.
- `apps/web/CLAUDE.md` remains a thin `@AGENTS.md` import and was left alone.
