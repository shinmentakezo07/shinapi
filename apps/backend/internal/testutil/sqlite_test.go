package testutil

import (
	"context"
	"path/filepath"
	"testing"
)

// TestSQLite_RoundTrip covers the basic create-then-read flow plus atomic
// deduct and insufficient-balance rejection. This is the canonical smoke
// test for the SQLite path.
func TestSQLite_RoundTrip(t *testing.T) {
	sdb := OpenSQLite(t, filepath.Join(t.TempDir(), "yapapa.db"))
	defer sdb.Close()

	ctx := context.Background()

	userRepo := NewSQLiteUserRepo(sdb)
	user, err := userRepo.Create(ctx, "u-1", "Alice", "alice@test.com", "hash", "user")
	if err != nil {
		t.Fatalf("create user: %v", err)
	}
	if user == nil || user.Email != "alice@test.com" {
		t.Fatalf("expected user with email alice@test.com, got %+v", user)
	}
	if user.Role != "user" {
		t.Errorf("role = %q, want %q", user.Role, "user")
	}

	creditsRepo := NewSQLiteCreditsRepo(sdb)
	if err := creditsRepo.Upsert(ctx, "u-1", 1000, 1000); err != nil {
		t.Fatalf("upsert credits: %v", err)
	}

	c, err := creditsRepo.ByUser(ctx, "u-1")
	if err != nil {
		t.Fatalf("by user: %v", err)
	}
	if c == nil || c.Balance != 1000 {
		t.Fatalf("expected balance=1000, got %+v", c)
	}

	ok, err := creditsRepo.Deduct(ctx, "u-1", 300)
	if err != nil || !ok {
		t.Fatalf("deduct 300: ok=%v err=%v", ok, err)
	}
	c, _ = creditsRepo.ByUser(ctx, "u-1")
	if c.Balance != 700 {
		t.Errorf("after deduct 300, balance=%d, want 700", c.Balance)
	}

	ok, err = creditsRepo.Deduct(ctx, "u-1", 10000)
	if err != nil {
		t.Fatalf("deduct 10000 err: %v", err)
	}
	if ok {
		t.Error("expected deduct of 10000 to fail (insufficient funds)")
	}
	c, _ = creditsRepo.ByUser(ctx, "u-1")
	if c.Balance != 700 {
		t.Errorf("failed deduct must not mutate balance, got %d (want 700)", c.Balance)
	}
}

// TestSQLite_DuplicateEmail guards against accidental UNIQUE constraint
// regressions when the schema is regenerated.
func TestSQLite_DuplicateEmail(t *testing.T) {
	sdb := OpenSQLite(t, filepath.Join(t.TempDir(), "yapapa.db"))
	defer sdb.Close()

	ctx := context.Background()
	repo := NewSQLiteUserRepo(sdb)

	if _, err := repo.Create(ctx, "u-1", "Alice", "dup@test.com", "h", "user"); err != nil {
		t.Fatalf("first create: %v", err)
	}
	if _, err := repo.Create(ctx, "u-2", "Bob", "dup@test.com", "h", "user"); err == nil {
		t.Fatal("expected duplicate email to error")
	}
}

// TestSQLite_PersistsAcrossOpens verifies yapapa.db semantics — data survives
// a Close→Open cycle so post-test inspection is possible.
func TestSQLite_PersistsAcrossOpens(t *testing.T) {
	path := filepath.Join(t.TempDir(), "yapapa.db")

	// Write
	sdb := OpenSQLite(t, path)
	repo := NewSQLiteUserRepo(sdb)
	if _, err := repo.Create(context.Background(), "u-1", "Bob", "bob@test.com", "h", "user"); err != nil {
		t.Fatalf("create: %v", err)
	}
	sdb.Close()

	// Re-open and verify
	sdb = OpenSQLite(t, path)
	defer sdb.Close()
	repo = NewSQLiteUserRepo(sdb)
	u, err := repo.ByEmail(context.Background(), "bob@test.com")
	if err != nil {
		t.Fatalf("by email: %v", err)
	}
	if u == nil || u.Name != "Bob" {
		t.Fatalf("expected Bob, got %+v", u)
	}
}

// TestSQLite_Reset verifies the Reset() helper wipes all rows without
// requiring re-Open. Useful for in-process reuse.
func TestSQLite_Reset(t *testing.T) {
	sdb := OpenSQLite(t, filepath.Join(t.TempDir(), "yapapa.db"))
	defer sdb.Close()

	ctx := context.Background()
	repo := NewSQLiteUserRepo(sdb)
	if _, err := repo.Create(ctx, "u-1", "A", "a@test.com", "h", "user"); err != nil {
		t.Fatalf("create: %v", err)
	}
	sdb.Reset(t)

	u, err := repo.ByID(ctx, "u-1")
	if err != nil {
		t.Fatalf("by id: %v", err)
	}
	if u != nil {
		t.Errorf("after Reset, expected nil, got %+v", u)
	}
}
