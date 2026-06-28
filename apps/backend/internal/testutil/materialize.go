package testutil

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// MaterializeYapapaDB opens yapapa.db at path, applies the lite-SQLite DDL,
// wipes existing rows, and inserts the canonical seed fixtures. The returned
// SQLiteTestDB must be Close()d by the caller when finished.
//
// This is the non-test entry point for materializing a demo yapapa.db
// outside of `go test`. It deliberately does not depend on testing.TB so
// it can be invoked from a real main() (see apps/backend/cmd/yapapa-demo).
//
// The path's parent directory is created (mode 0o755) if missing. Pass an
// absolute path or one whose directory exists; the file itself is created
// fresh on first run and re-seeded on subsequent runs.
//
// Honoring the YAPAPA_DB environment variable convention: if path is empty,
// MaterializeYapapaDB reads YAPAPA_DB; if that is also empty, it returns
// an error rather than silently picking a default path.
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
