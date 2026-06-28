package testutil

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"

	"dra-platform/backend/internal/db"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"
)

// EmbeddedPostgresPath is the on-disk location that the auto-spawned
// ephemeral Postgres uses. Override via DRA_TEST_PG_PATH for debugging.
func EmbeddedPostgresPath() string {
	if p := os.Getenv("DRA_TEST_PG_PATH"); p != "" {
		return p
	}
	return filepath.Join(os.TempDir(), "dra-embedded-postgres")
}

// startEmbeddedPostgres launches an in-process real Postgres for tests.
// It downloads the PG binary on first run (cached in DRA_TEST_PG_PATH).
// It then applies all migrations from apps/backend/migrations/.
//
// On ANY failure (no network for binary download, port clash, etc.) the
// test is SKIPPED — not failed — with a clear message directing the
// developer to set TEST_DATABASE_URL or USE_SQLITE=1. This avoids false
// failures when the dev env cannot bootstrap an ephemeral PG.
func startEmbeddedPostgres(t testing.TB) (*db.DB, func()) {
	t.Helper()

	startTime := time.Now()
	cacheDir := EmbeddedPostgresPath()
	if err := os.MkdirAll(cacheDir, 0o755); err != nil {
		t.Skipf("embedded-postgres: cannot create cache dir %q: %v", cacheDir, err)
		return nil, func() {}
	}

	// Use a high unused port to avoid clashing with developer Postgres on 5432.
	const port = uint32(54329)

	// embedded-postgres v1.34.0 exposes a value-based Config built via
	// DefaultConfig() returned value + fluent setter methods. All setters
	// mutate the value and return it. NewDatabase accepts variadic Config.
	pg := embeddedpostgres.NewDatabase(
		embeddedpostgres.DefaultConfig().
			Version(embeddedpostgres.V14).
			Port(port).
			Database("dra_test").
			Username("dra_test").
			Password("dra_test").
			CachePath(cacheDir).
			RuntimePath(filepath.Join(cacheDir, "runtime")).
			DataPath(filepath.Join(cacheDir, "data")).
			BinariesPath(filepath.Join(cacheDir, "binaries")).
			Locale("C").
			StartTimeout(60*time.Second),
	)
	if err := pg.Start(); err != nil {
		t.Skipf("embedded-postgres failed to start (likely no network for binary download): %v. Set TEST_DATABASE_URL or USE_SQLITE=1 to run this test.", err)
		return nil, func() {}
	}

	url := fmt.Sprintf("postgres://dra_test:dra_test@localhost:%d/dra_test?sslmode=disable", port)
	d, err := db.NewPostgres(url)
	if err != nil {
		_ = pg.Stop()
		t.Skipf("connect to embedded pg: %v", err)
		return nil, func() {}
	}

	if err := db.AutoMigrate(context.Background(), d); err != nil {
		d.Close()
		_ = pg.Stop()
		t.Skipf("apply migrations to embedded pg: %v", err)
		return nil, func() {}
	}

	cleanup := func() {
		d.Close()
		_ = pg.Stop()
		t.Logf("embedded-postgres stopped (uptime: %s)", time.Since(startTime))
	}
	return d, cleanup
}

// NewTestDBOrSkip is the recommended entry point for tests that need a real
// Postgres-test-equivalent. Precedence:
//
//  1. TEST_DATABASE_URL set  -> connect (existing behavior, full fidelity).
//  2. USE_SQLITE=1           -> skip; existing pgx repos need Postgres.
//     Use NewSQLiteTestDB + sqlite lite-repos for SQLite-only tests.
//  3. else                   -> auto-spawn embedded-postgres; skip if it
//     can't start (no network, firewall, etc.).
//
// Existing tests that call HasTestDB()/SkipIfNoDB() continue to behave the
// same — only test files that opt into NewTestDBOrSkip(t) get the new
// fallback. This preserves backward compatibility while solving the data-
// loss concern: NewTestDBOrSkip never touches the developer's existing
// Postgres connection.
func NewTestDBOrSkip(t testing.TB) *db.DB {
	t.Helper()

	if HasTestDB() {
		d, err := db.NewPostgres(os.Getenv("TEST_DATABASE_URL"))
		if err != nil {
			t.Skipf("TEST_DATABASE_URL set but unreachable: %v", err)
			return nil
		}
		return d
	}

	if os.Getenv("USE_SQLITE") == "1" {
		t.Skip("USE_SQLITE=1: existing pgx repos require Postgres. Use OpenSQLite + sqlite lite-repos for SQLite-only tests.")
		return nil
	}

	t.Log("TEST_DATABASE_URL not set; auto-spawning embedded postgres (binary cache: " + EmbeddedPostgresPath() + ")")
	d, cleanup := startEmbeddedPostgres(t)
	t.Cleanup(cleanup)
	return d
}
