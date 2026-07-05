// File: apps/backend/internal/db/lite_schema.go
//
// Lite SQLite schema + seed definitions for the SQLite runtime path.
//
// This file inlines a copy of testutil's SQLite DDL and seed logic so the
// `db` package can own its own SQLite runtime without depending on the
// `testutil` package (which is a test-only concern). Keep this DDL in sync
// with `internal/testutil/sqlite_db.go` and `internal/testutil/sqlite_seed.go`.
//
// Today's lite scope covers the core tables that the auth + credits +
// transactions + logs endpoints read: users, api_keys, user_credits,
// credit_transactions, admin_users, api_logs. Endpoints that need prompts,
// webhooks, etc. must add their tables here before they work in SQLite mode.
package db

import (
	"context"
	"database/sql"
	"fmt"

	"dra-platform/backend/internal/pkg/logger"
	"dra-platform/backend/internal/pkg/password"

	"github.com/google/uuid"
)

// usersLiteColumnAdditions is the set of columns added on top of the
// original 6-column Drizzle base schema in the SQLite lite runtime. These
// are referenced by `repository.AdminUserRepo` (and other repos mid-
// migration off Postgres). Used by `EnsureSQLiteColumns` to migrate
// existing on-disk SQLite DBs whose `users` table pre-dates the addition.
//
// Constraints mirror the Postgres ALTER statements in
// migrations/007_admin_schema.sql + the soft-delete column from
// migrations/_enterprise_features.sql, translated to SQLite dialect:
// NOT NULL requires a DEFAULT; arrays/JSON become a JSON-encoded TEXT
// cell with [] / {} as the empty payload.
var usersLiteColumnAdditions = map[string]string{
	"status":            "TEXT NOT NULL DEFAULT 'active'",
	"last_login_ip":     "TEXT DEFAULT ''",
	"last_login_at":     "TEXT",
	"notes":             "TEXT DEFAULT ''",
	"tags":              "TEXT DEFAULT '[]'",
	"suspended_by":      "TEXT REFERENCES users(id)",
	"suspension_reason": "TEXT DEFAULT ''",
	"suspended_at":      "TEXT",
	"deleted_at":        "TEXT",
}

// LiteDDL is the SQLite-dialect schema for the lite runtime. Mirrors
// testutil.SQLiteDDL (kept in sync manually).
//
// Columns on `users` mirror the Postgres canonical shape (id, name,
// email, password, role, created_at) PLUS the admin-panel extensions from
// migrations/007_admin_schema.sql and the soft-delete column used by
// repository.AdminUserRepo (`deleted_at`). Endpoints that hit this
// runtime in SQLite mode expect the full column set — keep in sync with
// the repo queries, not just the original Drizzle base.
var LiteDDL = []string{
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

	// Note: indexes on the `admin-panel extension` columns (status,
	// last_login_at) intentionally are NOT in `LiteDDL`. For fresh DBs
	// the columns exist after the CREATE TABLE above, so a CREATE INDEX
	// would succeed — but for existing DBs where CREATE TABLE IF NOT
	// EXISTS is a no-op (table already exists with the old 6-column
	// shape) these CREATE INDEX statements would fail with
	// "no such column: status" because SQLite does NOT silently
	// reorder DDL based on column presence. Skip them here; the
	// admin-panel queries against this runtime are dev / preview
	// only and tolerate full scans on the seeded 3-row `users` table.

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

	// admin_users — mirrors migrations/007_admin_schema.sql. permissions is
	// stored as TEXT (JSON array string) since SQLite has no native array
	// type; writers encode as JSON, readers parse it. created_at/updated_at
	// use SQLite's strftime so INSERTs without explicit timestamps still work.
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

	// api_logs — mirrors migrations/022_api_logs.sql. Nullable columns
	// (api_key_id, error_message) use TEXT with no NOT NULL constraint so
	// NULL scans from the repository layer work correctly.
	`CREATE TABLE IF NOT EXISTS api_logs (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		api_key_id TEXT REFERENCES api_keys(id) ON DELETE SET NULL,
		model TEXT NOT NULL,
		provider TEXT NOT NULL,
		input_tokens INTEGER NOT NULL DEFAULT 0,
		output_tokens INTEGER NOT NULL DEFAULT 0,
		cost INTEGER NOT NULL DEFAULT 0,
		latency INTEGER NOT NULL DEFAULT 0,
		status TEXT NOT NULL DEFAULT 'success',
		error_message TEXT,
		created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
	)`,
	`CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id)`,
	`CREATE INDEX IF NOT EXISTS idx_api_logs_user_created ON api_logs(user_id, created_at DESC)`,
}

// EnsureSQLiteColumns inspects the on-disk schema for `table` via
// PRAGMA table_info and runs `ALTER TABLE ... ADD COLUMN` for any column
// in `cols` that's missing. Idempotent across restarts so an existing
// SQLite DB that predates a LiteDDL column addition picks up the new
// shape without manual intervention. NOT NULL constraints require a
// DEFAULT (SQLite restriction on ADD COLUMN); callers provide the full
// column definition verbatim (e.g. "TEXT NOT NULL DEFAULT 'active'").
func EnsureSQLiteColumns(ctx context.Context, sdb *sql.DB, table string, cols map[string]string) error {
	if sdb == nil {
		return fmt.Errorf("nil sqlite db")
	}
	if table == "" {
		return fmt.Errorf("empty table name")
	}
	if len(cols) == 0 {
		return nil
	}
	rows, err := sdb.QueryContext(ctx, "PRAGMA table_info("+table+")")
	if err != nil {
		return fmt.Errorf("pragma table_info %s: %w", table, err)
	}
	defer rows.Close()
	existing := make(map[string]struct{}, len(cols))
	for rows.Next() {
		var (
			cid     int
			name    string
			ctype   string
			notnull int
			pk      int
			dflt    sql.NullString
		)
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err != nil {
			return fmt.Errorf("scan column info for %s: %w", table, err)
		}
		existing[name] = struct{}{}
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate column info for %s: %w", table, err)
	}
	for col, def := range cols {
		if _, ok := existing[col]; ok {
			continue
		}
		if _, err := sdb.ExecContext(ctx, "ALTER TABLE "+table+" ADD COLUMN "+col+" "+def); err != nil {
			return fmt.Errorf("add column %s.%s (%s): %w", table, col, def, err)
		}
	}
	return nil
}

// LiteSeedDefaults mirrors testutil's canonical seed (admin + 2 users +
// credits + api_keys + 7 transactions). Wipes the 4 lite tables first so
// the result is hermetic; callers should only invoke this when the DB is
// empty.
func LiteSeedDefaults(ctx context.Context, sdb *sql.DB) error {
	if sdb == nil {
		return fmt.Errorf("nil sqlite db")
	}

	tables := []string{"admin_users", "credit_transactions", "user_credits", "api_keys", "users"}
	for _, table := range tables {
		if _, err := sdb.ExecContext(ctx, "DELETE FROM "+table); err != nil {
			return fmt.Errorf("wipe %s: %w", table, err)
		}
	}

	adminHash, err := password.Hash("admin123")
	if err != nil {
		return fmt.Errorf("hash admin password: %w", err)
	}
	userHash, err := password.Hash("user123")
	if err != nil {
		return fmt.Errorf("hash user password: %w", err)
	}

	adminID := uuid.NewSHA1(uuid.NameSpaceURL, []byte("dra-platform:user:admin@example.com")).String()
	user1ID := uuid.NewSHA1(uuid.NameSpaceURL, []byte("dra-platform:user:john@example.com")).String()
	user2ID := uuid.NewSHA1(uuid.NameSpaceURL, []byte("dra-platform:user:jane@example.com")).String()

	users := []struct {
		id, name, email, pass, role string
	}{
		{adminID, "Admin User", "admin@example.com", string(adminHash), "admin"},
		{user1ID, "John Doe", "john@example.com", string(userHash), "user"},
		{user2ID, "Jane Smith", "jane@example.com", string(userHash), "user"},
	}
	for _, u := range users {
		if _, err := sdb.ExecContext(ctx,
			`INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
			u.id, u.name, u.email, u.pass, u.role, "1970-01-01T00:00:00Z",
		); err != nil {
			return fmt.Errorf("insert user %s: %w", u.email, err)
		}
	}

	credits := []struct {
		id             string
		userID         string
		balance        int64
		totalPurchased int64
		totalSpent     int64
	}{
		{"credit-" + adminID, adminID, 1000000, 1000000, 0},
		{"credit-" + user1ID, user1ID, 500000, 750000, 250000},
		{"credit-" + user2ID, user2ID, 250000, 500000, 250000},
	}
	for _, c := range credits {
		if _, err := sdb.ExecContext(ctx,
			`INSERT INTO user_credits (id, user_id, balance, total_purchased, total_spent) VALUES (?, ?, ?, ?, ?)`,
			c.id, c.userID, c.balance, c.totalPurchased, c.totalSpent,
		); err != nil {
			return fmt.Errorf("insert credits for %s: %w", c.userID, err)
		}
	}

	apiKeys := []struct {
		id, userID, name, key string
	}{
		{uuid.NewString(), user1ID, "Production Key", "dra_prod_" + uuid.NewString()},
		{uuid.NewString(), user1ID, "Development Key", "dra_dev_" + uuid.NewString()},
		{uuid.NewString(), user2ID, "Personal Project", "dra_pers_" + uuid.NewString()},
	}
	for _, k := range apiKeys {
		if _, err := sdb.ExecContext(ctx,
			`INSERT INTO api_keys (id, user_id, name, key, last_used, created_at) VALUES (?, ?, ?, ?, NULL, ?)`,
			k.id, k.userID, k.name, k.key, "1970-01-01T00:00:00Z",
		); err != nil {
			return fmt.Errorf("insert api_key %s: %w", k.name, err)
		}
	}

	transactions := []struct {
		userID, typ, description string
		amount                   int64
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
		if _, err := sdb.ExecContext(ctx,
			`INSERT INTO credit_transactions (id, user_id, amount, type, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
			uuid.NewString(), tx.userID, tx.amount, tx.typ, tx.description, "1970-01-01T00:00:00Z",
		); err != nil {
			return fmt.Errorf("insert credit_transaction: %w", err)
		}
	}

	logger.Info("lite_seed_complete")
	return nil
}
