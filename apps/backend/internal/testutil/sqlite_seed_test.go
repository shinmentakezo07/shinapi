package testutil

import (
	"context"
	"path/filepath"
	"testing"

	"dra-platform/backend/internal/pkg/password"

	"github.com/google/uuid"
)

// prefixOf returns the first 12 chars of a hash for diagnostic logging.
func prefixOf(s string) string {
	if len(s) <= 12 {
		return s
	}
	return s[:12]
}

// TestSeedDefaults_Structural verifies the canonical row counts are
// reached after OpenSQLiteAndSeed.
func TestSeedDefaults_Structural(t *testing.T) {
	sdb := OpenSQLiteAndSeed(t, filepath.Join(t.TempDir(), "yapapa.db"))
	defer sdb.Close()

	ctx := context.Background()

	rowCount := func(table string) int {
		t.Helper()
		var n int
		if err := sdb.DB.QueryRowContext(ctx, "SELECT COUNT(*) FROM "+table).Scan(&n); err != nil {
			t.Fatalf("count %s: %v", table, err)
		}
		return n
	}

	if n := rowCount("users"); n != 3 {
		t.Errorf("users = %d, want 3", n)
	}
	if n := rowCount("user_credits"); n != 3 {
		t.Errorf("user_credits = %d, want 3", n)
	}
	if n := rowCount("api_keys"); n != 3 {
		t.Errorf("api_keys = %d, want 3", n)
	}
	if n := rowCount("credit_transactions"); n != 7 {
		t.Errorf("credit_transactions = %d, want 7", n)
	}
}

// TestSeedDefaults_DeterministicIDs verifies the UUIDv5 scheme in
// seed.go is reproducible so test JWTs referencing seeded users stay
// valid across runs.
func TestSeedDefaults_DeterministicIDs(t *testing.T) {
	sdb := OpenSQLiteAndSeed(t, filepath.Join(t.TempDir(), "yapapa.db"))
	defer sdb.Close()

	repo := NewSQLiteUserRepo(sdb)
	ctx := context.Background()

	cases := []struct {
		email    string
		expected string
	}{
		{SeedAdminEmail, uuid.NewSHA1(uuid.NameSpaceURL, []byte("dra-platform:user:"+SeedAdminEmail)).String()},
		{SeedUser1Email, uuid.NewSHA1(uuid.NameSpaceURL, []byte("dra-platform:user:"+SeedUser1Email)).String()},
		{SeedUser2Email, uuid.NewSHA1(uuid.NameSpaceURL, []byte("dra-platform:user:"+SeedUser2Email)).String()},
	}
	for _, c := range cases {
		u, err := repo.ByEmail(ctx, c.email)
		if err != nil || u == nil {
			t.Fatalf("by email %q: %v %+v", c.email, err, u)
		}
		if u.ID != c.expected {
			t.Errorf("seeded id for %q = %s, want %s", c.email, u.ID, c.expected)
		}
	}
}

// TestSeedDefaults_AdminPasswordVerifies confirms the bcrypt-hashed admin
// password authenticates against the production Verify routine — i.e.
// the seed didn't accidentally hash with a different scheme.
func TestSeedDefaults_AdminPasswordVerifies(t *testing.T) {
	sdb := OpenSQLiteAndSeed(t, filepath.Join(t.TempDir(), "yapapa.db"))
	defer sdb.Close()

	repo := NewSQLiteUserRepo(sdb)
	admin, err := repo.ByEmail(context.Background(), SeedAdminEmail)
	if err != nil || admin == nil {
		t.Fatalf("admin lookup: %v %+v", err, admin)
	}
	if !password.Check(SeedAdminPass, admin.Password) {
		t.Errorf("admin password does not verify against %q (hash prefix=%q)", SeedAdminPass, prefixOf(admin.Password))
	}

	user1, err := repo.ByEmail(context.Background(), SeedUser1Email)
	if err != nil || user1 == nil {
		t.Fatalf("user1 lookup: %v %+v", err, user1)
	}
	if !password.Check(SeedUserPass, user1.Password) {
		t.Errorf("user1 password does not verify against %q (hash prefix=%q)", SeedUserPass, prefixOf(user1.Password))
	}
}

// TestSeedDefaults_AdminHasSuperRole confirms role propagation.
func TestSeedDefaults_AdminHasSuperRole(t *testing.T) {
	sdb := OpenSQLiteAndSeed(t, filepath.Join(t.TempDir(), "yapapa.db"))
	defer sdb.Close()

	repo := NewSQLiteUserRepo(sdb)
	ctx := context.Background()

	admin, _ := repo.ByEmail(ctx, SeedAdminEmail)
	if admin == nil || admin.Role != "admin" {
		t.Fatalf("admin role = %q, want admin", admin)
	}
	user1, _ := repo.ByEmail(ctx, SeedUser1Email)
	if user1 == nil || user1.Role != "user" {
		t.Fatalf("user1 role = %q, want user", user1)
	}
}

// TestSeedDefaults_BalancesMatchSeedSchema verifies the credit math
// matches apps/backend/internal/db/seed.go (1000000 / 500000 / 250000).
func TestSeedDefaults_BalancesMatchSeedSchema(t *testing.T) {
	sdb := OpenSQLiteAndSeed(t, filepath.Join(t.TempDir(), "yapapa.db"))
	defer sdb.Close()

	repo := NewSQLiteUserRepo(sdb)
	credRepo := NewSQLiteCreditsRepo(sdb)
	ctx := context.Background()

	want := []struct {
		email           string
		balance         int64
		totalPurchased  int64
		totalSpent      int64
	}{
		{SeedAdminEmail, 1000000, 1000000, 0},
		{SeedUser1Email, 500000, 750000, 250000},
		{SeedUser2Email, 250000, 500000, 250000},
	}
	for _, c := range want {
		u, _ := repo.ByEmail(ctx, c.email)
		if u == nil {
			t.Fatalf("user %q missing", c.email)
		}
		cr, err := credRepo.ByUser(ctx, u.ID)
		if err != nil || cr == nil {
			t.Fatalf("credits for %q: err=%v cr=%+v", c.email, err, cr)
		}
		if cr.Balance != c.balance || cr.TotalPurchased != c.totalPurchased || cr.TotalSpent != c.totalSpent {
			t.Errorf("credits for %q: got {b=%d, p=%d, s=%d}, want {b=%d, p=%d, s=%d}",
				c.email, cr.Balance, cr.TotalPurchased, cr.TotalSpent,
				c.balance, c.totalPurchased, c.totalSpent)
		}
	}
}

// TestSeedDefaults_APIKeysRespectFK confirms every API key's user_id
// matches an existing user (no orphan rows after seed).
func TestSeedDefaults_APIKeysRespectFK(t *testing.T) {
	sdb := OpenSQLiteAndSeed(t, filepath.Join(t.TempDir(), "yapapa.db"))
	defer sdb.Close()

	var orphans int
	if err := sdb.DB.QueryRowContext(context.Background(),
		`SELECT COUNT(*) FROM api_keys WHERE user_id NOT IN (SELECT id FROM users)`,
	).Scan(&orphans); err != nil {
		t.Fatalf("count orphans: %v", err)
	}
	if orphans != 0 {
		t.Errorf("orphan api_keys after seed: %d", orphans)
	}
}

// TestSeedDefaults_WipesBeforeSeed confirms re-running on an existing
// yapapa.db leaves only canonical fixtures — no stale rows linger.
func TestSeedDefaults_WipesBeforeSeed(t *testing.T) {
	path := filepath.Join(t.TempDir(), "yapapa.db")

	// Phase 1: open blank DB, insert a stale row, close.
	sdb1 := OpenSQLite(t, path)
	if _, err := sdb1.DB.ExecContext(context.Background(),
		`INSERT INTO users (id, name, email, role) VALUES ('stale', 'Stale', 'stale@old.com', 'user')`,
	); err != nil {
		t.Fatalf("insert stale: %v", err)
	}
	sdb1.Close()

	// Phase 2: re-open and seed.
	sdb2 := OpenSQLiteAndSeed(t, path)
	defer sdb2.Close()

	repo := NewSQLiteUserRepo(sdb2)
	if u, _ := repo.ByEmail(context.Background(), "stale@old.com"); u != nil {
		t.Error("stale row survived SeedDefaults wipe")
	}
	admin, _ := repo.ByEmail(context.Background(), SeedAdminEmail)
	if admin == nil {
		t.Error("canonical admin not written after wipe-and-reseed")
	}
	// Count check is a secondary invariant.
	var n int
	if err := sdb2.DB.QueryRowContext(context.Background(), "SELECT COUNT(*) FROM users").Scan(&n); err != nil {
		t.Fatalf("count users: %v", err)
	}
	if n != 3 {
		t.Errorf("users count after reseed = %d, want 3", n)
	}
}

// TestSeedDefaults_TransactionsHaveValidUsers confirms every credit
// transaction references an existing user — i.e., the seed correctly
// orders the inserts so FK constraints are satisfied.
func TestSeedDefaults_TransactionsHaveValidUsers(t *testing.T) {
	sdb := OpenSQLiteAndSeed(t, filepath.Join(t.TempDir(), "yapapa.db"))
	defer sdb.Close()

	var orphans int
	if err := sdb.DB.QueryRowContext(context.Background(),
		`SELECT COUNT(*) FROM credit_transactions WHERE user_id NOT IN (SELECT id FROM users)`,
	).Scan(&orphans); err != nil {
		t.Fatalf("count orphan tx: %v", err)
	}
	if orphans != 0 {
		t.Errorf("orphan credit_transactions after seed: %d", orphans)
	}
}
