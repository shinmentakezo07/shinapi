// File: apps/backend/internal/db/lite_schema.go
//
// Lite SQLite schema + seed definitions for the SQLite runtime path.
//
// This file inlines a copy of testutil's SQLite DDL and seed logic so the
// `db` package can own its own SQLite runtime without depending on the
// `testutil` package (which is a test-only concern). Keep this DDL in sync
// with `internal/testutil/sqlite_db.go` and `internal/testutil/sqlite_seed.go`.
//
// Today's lite scope covers the four core tables that the auth + credits +
// transactions endpoints read: users, api_keys, user_credits,
// credit_transactions. Endpoints that need api_logs, prompts, webhooks,
// etc. must add their tables here before they work in SQLite mode.
package db

import (
	"context"
	"database/sql"
	"fmt"

	"dra-platform/backend/internal/pkg/password"
	"dra-platform/backend/internal/pkg/logger"

	"github.com/google/uuid"
)

// LiteDDL is the SQLite-dialect schema for the lite runtime. Mirrors
// testutil.SQLiteDDL (kept in sync manually).
var LiteDDL = []string{
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

// LiteSeedDefaults mirrors testutil's canonical seed (admin + 2 users +
// credits + api_keys + 7 transactions). Wipes the 4 lite tables first so
// the result is hermetic; callers should only invoke this when the DB is
// empty.
func LiteSeedDefaults(ctx context.Context, sdb *sql.DB) error {
	if sdb == nil {
		return fmt.Errorf("nil sqlite db")
	}

	tables := []string{"credit_transactions", "user_credits", "api_keys", "users"}
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
