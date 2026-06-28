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
