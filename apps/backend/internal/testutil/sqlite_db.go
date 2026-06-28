// Package testutil provides SQLite-backed test infrastructure so unit tests
// that don't depend on PostgreSQL-specific features (pgx types, $N params,
// gen_random_uuid, bytea, text[], jsonb) can run hermetically against a
// local file at apps/backend/internal/testutil/yapapa.db, without ever
// touching the developer's production database.
//
// Existing pgx-coupled repos under apps/backend/internal/repository do NOT
// work with this SQLite path. They must continue to use the Postgres path
// (TEST_DATABASE_URL or embedded-postgres auto-spawn in NewTestDBOrSkip).
package testutil

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

// YapapaDBPath returns the configured SQLite file path for cross-process
// persistence, or empty string if YAPAPA_DB is unset. Tests that want
// file-backed SQLite should pass an explicit path to OpenSQLite (e.g.
// filepath.Join(t.TempDir(), "yapapa.db") for hermetic runs, or the value
// from YAPAPA_DB for cross-test persistence).
func YapapaDBPath() string {
	return os.Getenv("YAPAPA_DB")
}

// SQLiteTestDB is a minimal SQLite-backed test database holding a translated
// subset of the platform schema. It uses database/sql (not pgx) and the '?'
// placeholder convention required by SQLite.
type SQLiteTestDB struct {
	DB   *sql.DB
	Path string
}

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

// Close closes the SQLite database. After Close, the file at Path remains.
func (s *SQLiteTestDB) Close() error { return s.DB.Close() }

// Reset drops and re-applies the schema. Useful for in-process test isolation.
func (s *SQLiteTestDB) Reset(t testing.TB) {
	t.Helper()
	for _, table := range sqliteTablesInDropOrder {
		if _, err := s.DB.ExecContext(context.Background(), "DELETE FROM "+table); err != nil {
			t.Fatalf("clear %s: %v", table, err)
		}
	}
}

// sqliteTablesInDropOrder lists tables in safe dependency order so Reset()
// clears child rows before parents.
var sqliteTablesInDropOrder = []string{
	"credit_transactions",
	"user_credits",
	"api_keys",
	"users",
}

// SQLiteDDL is the exported name for sqliteDDL so other packages (db
// migrate/seed, cmd/* tooling) can drive the canonical lite-schema DDL
// without re-parsing testutil internals. Keep this in sync if sqliteDDL
// changes.
var SQLiteDDL = sqliteDDL

// sqliteDDL is the SQLite-dialect translation of the 5 Drizzle core tables
// plus credit_transactions (the join target used by user_credits tests).
// Type translation rules:
//
//	UUID          -> TEXT
//	TIMESTAMPTZ   -> TEXT (RFC3339)
//	gen_random_uuid() -> app-side id (caller generates)
//	$N placeholders -> ? (handled in repository code, not here)
//	BYTEA, text[], jsonb -> out of scope for these lite tables
var sqliteDDL = []string{
	`CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		password TEXT,
		role TEXT NOT NULL DEFAULT 'user',
		created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
	)`,
	`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,

	`CREATE TABLE IF NOT EXISTS api_keys (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name TEXT NOT NULL,
		key TEXT NOT NULL,
		last_used TEXT,
		created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
		revoked_at TEXT
	)`,
	`CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`,
	`CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key)`,

	`CREATE TABLE IF NOT EXISTS user_credits (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
		balance INTEGER NOT NULL DEFAULT 0,
		total_purchased INTEGER NOT NULL DEFAULT 0,
		total_spent INTEGER NOT NULL DEFAULT 0
	)`,
	`CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id)`,

	`CREATE TABLE IF NOT EXISTS credit_transactions (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES users(id),
		amount INTEGER NOT NULL,
		type TEXT NOT NULL,
		description TEXT NOT NULL,
		related_log_id TEXT,
		stripe_payment_id TEXT,
		created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
	)`,
	`CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id)`,
}
