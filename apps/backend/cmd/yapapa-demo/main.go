// Command yapapa-demo materializes the canonical yapapa.db fixture so it can
// be inspected with `sqlite3 apps/backend/internal/testutil/yapapa.db`.
//
// Usage:
//
//	go run ./cmd/yapapa-demo                        # default path
//	go run ./cmd/yapapa-demo -path /tmp/yapapa.db    # custom path
//	YAPAPA_DB=/abs/path go run ./cmd/yapapa-demo     # env override
//
// After running, you can verify the contents from the repo root:
//
//	sqlite3 apps/backend/internal/testutil/yapapa.db ".schema"
//	sqlite3 apps/backend/internal/testutil/yapapa.db "SELECT email,role FROM users;"
//	sqlite3 apps/backend/internal/testutil/yapapa.db "SELECT u.email, c.balance FROM users u JOIN user_credits c ON c.user_id = u.id;"
//
// Credentials seeded:
//
//	admin@example.com / admin123  (role admin)
//	john@example.com  / user123   (role user)
//	jane@example.com  / user123   (role user)
package main

import (
	"database/sql"
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"dra-platform/backend/internal/testutil"
)

// canonicalRelativePath is the repo-relative path that developers are
// most likely to `sqlite3` after running this CLI. Anchored on the
// repo root at runtime so it works regardless of the current working
// directory. Kept as a constant so future renames stay single-source.
const canonicalRelativePath = "apps/backend/internal/testutil/yapapa.db"

// findRepoRoot walks up from the current working directory until it
// finds a directory containing BOTH `apps/backend/go.mod` and `.git/`.
// The canonical yapapa.db path is then anchored at that root, which
// prevents the doubled-`apps/backend/apps/backend/...` mistake when
// the CLI is invoked from inside apps/backend/ or a sub-directory.
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

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "yapapa-demo: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	var (
		path   = flag.String("path", "", "absolute or repo-relative path for yapapa.db (default: derived from YAPAPA_DB → repo-root + canonicalRelativePath)")
		quiet  = flag.Bool("quiet", false, "suppress row-count summary; just create the file")
		dryRun = flag.Bool("dry-run", false, "print settings and exit without touching the DB")
	)
	flag.Parse()

	target := *path
	if target == "" {
		target = os.Getenv("YAPAPA_DB")
	}
	if target == "" {
		if root, err := findRepoRoot(); err == nil {
			target = filepath.Join(root, canonicalRelativePath)
		} else {
			// Last-resort fallback: still anchor at the relative path
			// so the caller sees something predictable; surface why
			// repo-root detection failed.
			fmt.Fprintf(os.Stderr, "yapapa-demo: warning: %v\n         falling back to relative %q (run from inside the repo for the canonical default)\n", err, canonicalRelativePath)
			target = canonicalRelativePath
		}
	}

	abs, err := filepath.Abs(target)
	if err != nil {
		return fmt.Errorf("abs path: %w", err)
	}

	fmt.Printf("yapapa-demo → %s\n", abs)

	if *dryRun {
		fmt.Println("(dry-run: no changes made)")
		return nil
	}

	sdb, err := testutil.MaterializeYapapaDB(nil, abs)
	if err != nil {
		return err
	}
	defer sdb.Close()

	if *quiet {
		return nil
	}

	fmt.Println()
	fmt.Println("Materialized. Contents:")

	if err := summarize(sdb.DB); err != nil {
		return fmt.Errorf("summarize: %w", err)
	}

	fmt.Println()
	fmt.Printf("Inspect with:  sqlite3 %q \".schema\"\n", abs)
	fmt.Printf("Or:            sqlite3 %q \"SELECT email, role FROM users;\"\n", abs)
	return nil
}

func summarize(db *sql.DB) error {
	tables := []string{"users", "api_keys", "user_credits", "credit_transactions"}
	for _, tbl := range tables {
		var n int64
		if err := db.QueryRow("SELECT COUNT(*) FROM " + tbl).Scan(&n); err != nil {
			return fmt.Errorf("count %s: %w", tbl, err)
		}
		fmt.Printf("  %-22s %d rows\n", tbl, n)
	}

	rows, err := db.Query(`
		SELECT u.email, u.role, c.balance
		FROM users u
		LEFT JOIN user_credits c ON c.user_id = u.id
		ORDER BY u.email
	`)
	if err != nil {
		return fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()
	fmt.Println("  ─ users ───────────────────────────────────")
	for rows.Next() {
		var email, role string
		var balance sql.NullInt64
		if err := rows.Scan(&email, &role, &balance); err != nil {
			return fmt.Errorf("scan: %w", err)
		}
		if balance.Valid {
			fmt.Printf("    %-22s role=%-6s balance=%d\n", email, role, balance.Int64)
		} else {
			fmt.Printf("    %-22s role=%-6s balance=—\n", email, role)
		}
	}
	return rows.Err()
}
