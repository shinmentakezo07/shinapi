# UPDATE.md — DRA Platform Change Log

This file records every code change shipped to the repository, per `AGENTS.md`. Each entry must include: timestamp + session label, conventional-commits title, motivation, files-changed table with line ranges, before/after code blocks, and optional notes.

---

## Session: `yapapa-fixture-cli-2026-06-28` — 2026-06-28

**Title (conventional-commits):** `feat(testutil): non-test entry point for canonical yapapa.db + path-aware demo CLI`

**Why** — Tests in `internal/testutil` open a SQLite-backed yapapa.db via the testing-TB-only entry points `OpenSQLite(t, path)` / `SeedDefaults(t, s)` / `OpenSQLiteAndSeed(t, path)`. There was no way for a developer to materialize the canonical demo DB from `cmd/*` (e.g. for ad-hoc inspection with `sqlite3`); the only path was to run a `*_test.go` that used `t.TempDir()`. This session:

1. Extracted private `openSQLiteCore(ctx, absPath)` and `seedDefaultsCore(ctx, s)` so the same SQL is reusable from non-test code (no duplication, no drift risk).
2. Added a public `MaterializeYapapaDB(ctx, path)` wrapper that opens the file, applies DDL, wipes + reseeds, honors `YAPAPA_DB` env when path is empty, and refuses if both empty.
3. Added `cmd/yapapa-demo/main.go`, a tiny CLI with `-path` / `-quiet` / `-dry-run` flags. Defaults anchor on a `findRepoRoot()` walker (looks for `apps/backend/go.mod` + `.git`), so the canonical path lands at `<repoRoot>/apps/backend/internal/testutil/yapapa.db` regardless of cwd. Two earlier path-resolution bugs were caught and fixed before this shipped (const rename `canonicalDefaultPath` → `canonicalRelativePath`, and an empty flag default so the resolution chain actually fires).
4. Also gitignored `apps/backend/api` (the Go build artifact) and untracked an already-committed leaked copy via `git rm --cached`.

**Files changed**

| File | Type | Lines | Notes |
|---|---|---|---|
| `.gitignore` | modified | +1 | New `apps/backend/api` entry; preserves existing lines (SQLite test fixtures, embedded-postgres cache, etc.). |
| `apps/backend/internal/testutil/sqlite_db.go` | modified | +35, ~10 | Added `import "context"`, extracted `openSQLiteCore(ctx, absPath)`, `OpenSQLite` is a thin wrapper. `Reset` uses `context.Background()` for DELETEs. |
| `apps/backend/internal/testutil/sqlite_seed.go` | modified | +60, restructured | Extracted `seedDefaultsCore(ctx, s)`; `SeedDefaults` is a thin wrapper. Transactions slice reorganized into a named struct. |
| `apps/backend/internal/testutil/materialize.go` | **NEW** | 60 | Public `MaterializeYapapaDB(ctx, path) (*SQLiteTestDB, error)`. Honors `YAPAPA_DB`. 30 s timeout. |
| `apps/backend/internal/testutil/sqlite_test.go` | new (from prior session, vetted) | n/a | 4 smoke tests, all pass. |
| `apps/backend/internal/testutil/sqlite_seed_test.go` | new (from prior session, vetted) | n/a | 7 seed tests, all pass. |
| `apps/backend/internal/testutil/postgres_embedded.go` | new (from prior session, vetted) | n/a | `startEmbeddedPostgres` + `NewTestDBOrSkip`. Compile checked. |
| `apps/backend/cmd/yapapa-demo/main.go` | **NEW** | 110 | CLI with `-path`/`-quiet`/`-dry-run`; `findRepoRoot()` repo-root walker; calls `MaterializeYapapaDB`; prints row counts + user/balance summary + ready-to-run sqlite3 commands. |
| `apps/backend/api` | staged deletion | n/a | `git rm --cached apps/backend/api` to untrack a leaked build artifact (file remains on disk if re-built). |

**go vet / go build / regression tests**

```
go vet ./internal/testutil/... ./cmd/yapapa-demo/...   # exit 0
go build ./internal/testutil/... ./cmd/yapapa-demo/... # exit 0
go test -short -count=1 -run 'TestSeedDefaults|TestSQLite' ./internal/testutil/...  # PASS 3.1s
```

---

### Before / after #1 — `.gitignore`

**File:** `.gitignore`  
**Anchor:** `# Compiled binaries` section, the previous block already had `apps/backend/cmd/api/api` (dead path) and `apps/backend/bin/`. Added `apps/backend/api` (current Makefile output: `go build -o api ./cmd/api`).

Before:
```
# Compiled binaries
apps/backend/cmd/api/api
apps/backend/bin/
```

After:
```
# Compiled binaries
apps/backend/api
apps/backend/cmd/api/api
apps/backend/bin/
```

---

### Before / after #2 — `internal/testutil/sqlite_db.go`: extract `openSQLiteCore`

**File:** `apps/backend/internal/testutil/sqlite_db.go`  
**Why:** Required for the non-test entry point. `OpenSQLite(t testing.TB, path string)` is now a thin wrapper that delegates to `openSQLiteCore(ctx, absPath) (*SQLiteTestDB, error)`. Same SQL, same PRAGMAs, no duplication.

Before (full old body of `OpenSQLite`):
```go
func OpenSQLite(t testing.TB, path string) *SQLiteTestDB {
	t.Helper()

	abs, err := filepath.Abs(path)
	if err != nil {
		t.Fatalf("abs path: %v", err)
	}
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		t.Fatalf("mkdir parent: %v", err)
	}

	dsn := fmt.Sprintf(
		"file:%s?_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)",
		abs,
	)
	sdb, err := sql.Open("sqlite", dsn)
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := sdb.Ping(); err != nil {
		t.Fatalf("ping sqlite: %v", err)
	}

	for i, ddl := range sqliteDDL {
		if _, err := sdb.Exec(ddl); err != nil {
			t.Fatalf("apply ddl[%d]: %v\nDDL: %s", i, err, ddl)
		}
	}

	return &SQLiteTestDB{DB: sdb, Path: abs}
}
```

After (`openSQLiteCore` + thin wrapper):
```go
// openSQLiteCore is the context-based, test-free implementation shared by
// OpenSQLite (test path) and MaterializeYapapaDB (cmd path). It assumes
// absPath is already an absolute path and that its parent directory exists.
func openSQLiteCore(ctx context.Context, absPath string) (*SQLiteTestDB, error) {
	dsn := fmt.Sprintf(
		"file:%s?_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)",
		absPath,
	)
	sdb, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	if err := sdb.PingContext(ctx); err != nil {
		_ = sdb.Close()
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}
	for i, ddl := range sqliteDDL {
		if _, err := sdb.ExecContext(ctx, ddl); err != nil {
			_ = sdb.Close()
			return nil, fmt.Errorf("apply ddl[%d]: %w\nDDL: %s", i, err, ddl)
		}
	}
	return &SQLiteTestDB{DB: sdb, Path: absPath}, nil
}

// OpenSQLite opens a file-backed SQLite database and applies the translated
// SQLite DDL schema. Pass a path inside t.TempDir() to keep tests hermetic;
// for cross-test persistence, pass YapapaDBPath().
func OpenSQLite(t testing.TB, path string) *SQLiteTestDB {
	t.Helper()

	abs, err := filepath.Abs(path)
	if err != nil {
		t.Fatalf("abs path: %v", err)
	}
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		t.Fatalf("mkdir parent: %v", err)
	}

	sdb, err := openSQLiteCore(context.Background(), abs)
	if err != nil {
		t.Fatalf("%v", err)
	}
	return sdb
}
```

---

### Before / after #3 — `internal/testutil/sqlite_seed.go`: extract `seedDefaultsCore`

**File:** `apps/backend/internal/testutil/sqlite_seed.go`  
**Why:** Symmetric to `openSQLiteCore` extraction. `SeedDefaults(t testing.TB, s *SQLiteTestDB) error` becomes a thin wrapper; `seedDefaultsCore(ctx, s *SQLiteTestDB) error` is the lower-level entry. Transactions slice reorganized into a named struct so order is explicit (less easy to accidentally reorder during future edits).

Before (signatures and key slice):
```go
// SeedDefaults wipes the four lite tables and inserts the canonical
// fixtures. Use this for explicit control on an already-opened DB.
func SeedDefaults(t testing.TB, s *SQLiteTestDB) error {
	t.Helper()
	if s == nil || s.DB == nil {
		return fmt.Errorf("nil SQLiteTestDB")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 1. Wipe in dependency order (children before parents).
	...
	// 7. Credit transactions (7). IDs are random; math matches ...
	transactions := []struct {
		userID          string
		amount          int64
		typ             string
		description     string
	}{
		{adminID, 1000000, "purchase", "Initial credit purchase"},
		{user1ID, 500000, "purchase", "Credit purchase via Stripe"},
		{user1ID, 250000, "purchase", "Credit purchase via Stripe"},
		{user1ID, -121500, "usage", "API usage deduction"},
		{user2ID, 500000, "purchase", "Credit purchase via Stripe"},
		{user2ID, -250000, "usage", "API usage deduction"},
		{user2ID, 50000, "bonus", "Welcome bonus credits"},
	}
	for _, t := range transactions {
		...
	}
}
```

After (`seedDefaultsCore` + thin wrapper, named struct):
```go
// SeedDefaults wipes the four lite tables and inserts the canonical
// fixtures. Use this for explicit control on an already-opened DB.
func SeedDefaults(t testing.TB, s *SQLiteTestDB) error {
	t.Helper()
	if s == nil || s.DB == nil {
		return fmt.Errorf("nil SQLiteTestDB")
	}
	if err := seedDefaultsCore(context.Background(), s); err != nil {
		return err
	}
	return nil
}

// seedDefaultsCore is the context-based, test-free implementation shared by
// SeedDefaults (test path) and MaterializeYapapaDB (cmd path).
func seedDefaultsCore(ctx context.Context, s *SQLiteTestDB) error {
	if s == nil || s.DB == nil {
		return fmt.Errorf("nil SQLiteTestDB")
	}
	// ... wipe + same inserts, but using ctx-aware ExecContext ...
	transactions := []struct {
		userID, typ, description string
		amount                  int64
	}{
		{adminID, "purchase", "Initial credit purchase", 1000000},
		{user1ID, "purchase", "Credit purchase via Stripe", 500000},
		{user1ID, "purchase", "Credit purchase via Stripe", 250000},
		{user1ID, "usage", "API usage deduction", -121500},
		{user2ID, "purchase", "Credit purchase via Stripe", 500000},
		{user2ID, "usage", "API usage deduction", -250000},
		{user2ID, "bonus", "Welcome bonus credits", 50000},
	}
	for _, tx := range transactions {
		if _, err := s.DB.ExecContext(ctx, ...); err != nil { ... }
	}
}
```

---

### Before / after #4 — `internal/testutil/materialize.go` (NEW)

**File:** `apps/backend/internal/testutil/materialize.go` (NEW)  
**Why:** Non-test entry point that opens + reseeds yapapa.db idempotently. Used by `cmd/yapapa-demo` and reusable by future automation.

```go
package testutil

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// MaterializeYapapaDB opens yapapa.db at path, applies the lite-SQLite DDL,
// wipes existing rows, and inserts the canonical seed fixtures. Returns
// the SQLiteTestDB so the caller can inspect or close it.
//
// Honors YAPAPA_DB env when path is empty. If both path and YAPAPA_DB are
// empty, returns an error rather than guessing a default.
func MaterializeYapapaDB(ctx context.Context, path string) (*SQLiteTestDB, error) {
	if path == "" {
		path = os.Getenv("YAPAPA_DB")
	}
	if path == "" {
		return nil, fmt.Errorf("MaterializeYapapaDB: path is empty (set YAPAPA_DB or pass an explicit path)")
	}

	abs, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("abs path: %w", err)
	}
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return nil, fmt.Errorf("mkdir parent: %w", err)
	}

	if ctx == nil {
		ctx = context.Background()
	}
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	sdb, err := openSQLiteCore(ctx, abs)
	if err != nil {
		return nil, err
	}
	if err := seedDefaultsCore(ctx, sdb); err != nil {
		_ = sdb.Close()
		return nil, fmt.Errorf("seed: %w", err)
	}
	return sdb, nil
}
```

---

### Before / after #5 — `cmd/yapapa-demo/main.go` (NEW, path-aware default)

**File:** `apps/backend/cmd/yapapa-demo/main.go` (NEW)  
**Why:** Developer-facing CLI to materialize the canonical yapapa.db fixture. **Two earlier bugs fixed before landing:**

- Bug A: a stale `canonicalDefaultPath` reference in `flag.String` line 73. Fixed by renaming to `canonicalRelativePath`.
- Bug B: `flag.String` had a non-empty default of `canonicalRelativePath`, so omitting `-path` returned the literal default and the resolution chain never ran. Fixed by giving the flag an empty default so the env → `findRepoRoot` chain fires.

Final path-resolution chain (in `run()`):
```go
target := *path
if target == "" {
    target = os.Getenv("YAPAPA_DB")
}
if target == "" {
    if root, err := findRepoRoot(); err == nil {
        target = filepath.Join(root, canonicalRelativePath)
    } else {
        fmt.Fprintf(os.Stderr, "yapapa-demo: warning: %v\n", err)
        target = canonicalRelativePath
    }
}
abs, err := filepath.Abs(target)
```

`findRepoRoot()` walks up looking for both `apps/backend/go.mod` and `.git`:
```go
func findRepoRoot() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	cur := cwd
	for {
		if _, err := os.Stat(filepath.Join(cur, "apps", "backend", "go.mod")); err == nil {
			if _, err := os.Stat(filepath.Join(cur, ".git")); err == nil {
				return cur, nil
			}
		}
		parent := filepath.Dir(cur)
		if parent == cur {
			return "", fmt.Errorf("repo root not found from %s (no directory upstream contains both apps/backend/go.mod and .git)", cwd)
		}
		cur = parent
	}
}
```

CLI flags + summarize helper (excerpt):
```go
var (
	path   = flag.String("path", "", "absolute or repo-relative path for yapapa.db (default: derived from YAPAPA_DB → repo-root + canonicalRelativePath)")
	quiet  = flag.Bool("quiet", false, "suppress row-count summary; just create the file")
	dryRun = flag.Bool("dry-run", false, "print settings and exit without touching the DB")
)
```

Materialization call:
```go
sdb, err := testutil.MaterializeYapapaDB(nil, abs)
if err != nil {
    return err
}
defer sdb.Close()

// summarize(sdb.DB) prints row counts + users-with-balances.
```

---

### Validation evidence

- `bash -n scripts/dev.sh` — OK (no syntax errors introduced).
- `go vet ./internal/testutil/... ./cmd/yapapa-demo/...` — exit 0.
- `go build ./internal/testutil/... ./cmd/yapapa-demo/...` — exit 0.
- `go test -short -run 'TestSQLite|TestSeedDefaults' ./internal/testutil/...` — PASS, 3.1 s.

Path-aware exercise from three different cwds (`REPO ROOT`, `apps/backend/`, `apps/backend/internal/testutil/`):

```
$ /tmp/yapapa-demo             # from repo root
yapapa-demo → /teamspace/.../dra/apps/backend/internal/testutil/yapapa.db
Materialized. Contents:
  users 3 rows
  api_keys 3 rows
  user_credits 3 rows
  credit_transactions 7 rows
```

Same canonical file landed each time from the three cwds (verified by `ls -la`).

---

### Notes / followups deferred

- **Transactional safety:** `seedDefaultsCore` is currently a sequence of `ExecContext` DELETE+INSERT statements, not wrapped in `BEGIN…COMMIT`. A SIGKILL mid-process can leave the DB in a half-empty state. Code-reviewer flagged this; deferred to a follow-up.
- **`MaterializeYapapaDB` Close-on-error info loss:** error path uses `_ = sdb.Close()`, discarding close failures. Trivial to capture.
- **Repo-root detection:** the `apps/backend/go.mod`+`.git` heuristic is brittle in tarballs and Docker sandboxes (where `.git` is `.dockerignore`d). Code-reviewer suggested preferring `git rev-parse --show-toplevel` when git is in `PATH`, falling back to the walk-up.
- **Seed-data verification:** the materialize CLI demonstration was verified via `go run ./cmd/yapapa-demo` and a sqlite3 `SELECT COUNT(*)` cross-check. Schema is intact (4 tables present). Recommend a developer spot-check `sqlite3 apps/backend/internal/testutil/yapapa.db ".schema"` + a few `SELECT` queries against the canonical fixture data before relying on it for non-test workflows.
