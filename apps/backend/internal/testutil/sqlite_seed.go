package testutil

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	"dra-platform/backend/internal/pkg/password"

	"github.com/google/uuid"
)

// SeedDefaults — canonical fixtures for the SQLite test path. Mirrors the
// data set produced by apps/backend/internal/db/seed.go.autoSeed so a
// yapapa.db-backed test sees the same demo accounts, balances, API keys,
// and transaction history as the dev Postgres DB.
//
// Schema scope: the four tables declared in sqlite_db.go:
//
//	users, api_keys, user_credits, credit_transactions
//
// (api_logs is intentionally NOT seeded because the lite SQLite schema
// does not include it; full PG-mode tests cover analysis endpoints.)

// Default credentials and emails — exported so callers can reference them
// when asserting on seeded fixtures.
var (
	SeedAdminEmail = "admin@example.com"
	SeedUser1Email = "john@example.com"
	SeedUser2Email = "jane@example.com"
	SeedAdminPass  = "admin123"
	SeedUserPass   = "user123"
)

// OpenSQLiteAndSeed opens yapapa.db at path and applies SeedDefaults.
// Equivalent to OpenSQLite(t, path) followed by SeedDefaults(t, sdb).
// Always wipes existing rows first so the result is hermetic.
func OpenSQLiteAndSeed(t testing.TB, path string) *SQLiteTestDB {
	t.Helper()
	sdb := OpenSQLite(t, path)
	if err := SeedDefaults(t, sdb); err != nil {
		t.Fatalf("seed defaults: %v", err)
	}
	return sdb
}

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
// SeedDefaults (test path) and MaterializeYapapaDB (cmd path). It wipes the
// four lite tables and inserts the canonical fixtures; on any error, partial
// writes may remain on disk so the caller should treat them as garbage.
func seedDefaultsCore(ctx context.Context, s *SQLiteTestDB) error {
	if s == nil || s.DB == nil {
		return fmt.Errorf("nil SQLiteTestDB")
	}

	// 1. Wipe in dependency order (children before parents).
	for _, table := range sqliteTablesInDropOrder {
		if _, err := s.DB.ExecContext(ctx, "DELETE FROM "+table); err != nil {
			return fmt.Errorf("wipe %s: %w", table, err)
		}
	}

	// 2. Hash passwords using the production scheme (bcrypt default cost).
	//    Each hash is roughly 100ms — acceptable for test/demo setup.
	adminHash, err := password.Hash(SeedAdminPass)
	if err != nil {
		return fmt.Errorf("hash admin password: %w", err)
	}
	userHash, err := password.Hash(SeedUserPass)
	if err != nil {
		return fmt.Errorf("hash user password: %w", err)
	}

	// 3. Deterministic IDs so JWTs referencing seeded users stay valid.
	//    Same scheme used in apps/backend/internal/db/seed.go.
	adminID := uuid.NewSHA1(uuid.NameSpaceURL, []byte("dra-platform:user:"+SeedAdminEmail)).String()
	user1ID := uuid.NewSHA1(uuid.NameSpaceURL, []byte("dra-platform:user:"+SeedUser1Email)).String()
	user2ID := uuid.NewSHA1(uuid.NameSpaceURL, []byte("dra-platform:user:"+SeedUser2Email)).String()

	nowStr := time.Now().UTC().Format(time.RFC3339Nano)

	// 4. Users (3).
	users := []struct {
		id, name, email, pass, role string
	}{
		{adminID, "Admin User", SeedAdminEmail, string(adminHash), "admin"},
		{user1ID, "John Doe", SeedUser1Email, string(userHash), "user"},
		{user2ID, "Jane Smith", SeedUser2Email, string(userHash), "user"},
	}
	for _, u := range users {
		if _, err := s.DB.ExecContext(ctx,
			`INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
			u.id, u.name, u.email, u.pass, u.role, nowStr,
		); err != nil {
			return fmt.Errorf("insert user %s: %w", u.email, err)
		}
	}

	// 5. User credits (1:1 with users; math mirrors apps/backend/internal/db/seed.go).
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
		if _, err := s.DB.ExecContext(ctx,
			`INSERT INTO user_credits (id, user_id, balance, total_purchased, total_spent) VALUES (?, ?, ?, ?, ?)`,
			c.id, c.userID, c.balance, c.totalPurchased, c.totalSpent,
		); err != nil {
			return fmt.Errorf("insert credits for %s: %w", c.userID, err)
		}
	}

	// 6. API keys (3). IDs/keys are random per seed (matches apps/web/db/seed.ts
	//    and backend auto-seed behavior — production-realistic).
	apiKeys := []struct {
		id, userID, name, key string
		lastUsed              *time.Time
	}{
		{uuid.NewString(), user1ID, "Production Key", "dra_prod_" + uuid.NewString(), timeAgo(24 * time.Hour)},
		{uuid.NewString(), user1ID, "Development Key", "dra_dev_" + uuid.NewString(), nil},
		{uuid.NewString(), user2ID, "Personal Project", "dra_pers_" + uuid.NewString(), timeAgo(48 * time.Hour)},
	}
	for _, k := range apiKeys {
		var lastUsed any
		if k.lastUsed != nil {
			lastUsed = k.lastUsed.Format(time.RFC3339Nano)
		} else {
			lastUsed = nil
		}
		if _, err := s.DB.ExecContext(ctx,
			`INSERT INTO api_keys (id, user_id, name, key, last_used, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
			k.id, k.userID, k.name, k.key, lastUsed, nowStr,
		); err != nil {
			return fmt.Errorf("insert api_key %s: %w", k.name, err)
		}
	}

	// 7. Credit transactions (7). IDs are random; math matches apps/backend
	//    internal/db/seed.go. related_log_id is omitted because we don't
	//    seed api_logs in the lite path; that's a deliberate scope cut.
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
		if _, err := s.DB.ExecContext(ctx,
			`INSERT INTO credit_transactions (id, user_id, amount, type, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
			uuid.NewString(), tx.userID, tx.amount, tx.typ, tx.description, nowStr,
		); err != nil {
			return fmt.Errorf("insert credit_transaction: %w", err)
		}
	}

	return nil
}

// timeAgo returns a pointer to time.Now()-d. Used to seed last_used
// timestamps relative to the wall clock.
func timeAgo(d time.Duration) *time.Time {
	t := time.Now().UTC().Add(-d)
	return &t
}

// isSQLiteNoRows is a defensive helper for callers that want a stable
// "not found" signal. modernc.org/sqlite returns *sqlite3.Error for most
// issues and ErrNoRows for missing rows; the underlying stdlib returns
// sql.ErrNoRows. Wrap it for tests that don't want to import database/sql.
func isSQLiteNoRows(err error) bool {
	return err == sql.ErrNoRows
}
