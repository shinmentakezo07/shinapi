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
