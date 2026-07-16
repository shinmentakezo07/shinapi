package db

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"dra-platform/backend/internal/pkg/logger"
)

// AutoMigrate runs pending migrations for PostgreSQL/Neon/SQLite databases.
// It creates a schema_migrations table for PG, or applies the lite DDL
// directly for SQLite (no file-based migration tracking today).
func AutoMigrate(ctx context.Context, database *DB) error {
	if database.Type == DBTypeSQLite {
		return autoMigrateSQLite(ctx, database)
	}
	if database.Type == DBTypeMongoDB {
		logger.Info("auto_migrate_skipped", "reason", "mongodb does not use sql migrations")
		return nil
	}

	if database.Pool == nil {
		return fmt.Errorf("postgres pool is nil")
	}

	// Ensure migrations table exists
	_, err := database.Pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("create schema_migrations table: %w", err)
	}

	// Find migration files
	migrationsDir := "migrations"
	if _, err := os.Stat(migrationsDir); os.IsNotExist(err) {
		// Try relative to executable or working directory
		migrationsDir = filepath.Join("apps", "backend", "migrations")
		if _, err := os.Stat(migrationsDir); os.IsNotExist(err) {
			logger.Warn("migrations directory not found, skipping auto-migrate", "path", migrationsDir)
			return nil
		}
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	for _, f := range files {
		var applied bool
		err := database.Pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)`, f).Scan(&applied)
		if err != nil {
			return fmt.Errorf("check migration %s: %w", f, err)
		}
		if applied {
			continue
		}

		data, err := os.ReadFile(filepath.Join(migrationsDir, f))
		if err != nil {
			return fmt.Errorf("read migration %s: %w", f, err)
		}

		// Run migration inside a transaction and record it atomically
		err = database.WithTx(ctx, func(tx Querier) error {
			_, err := tx.Exec(ctx, string(data))
			if err != nil {
				return err
			}
			_, err = tx.Exec(ctx, `INSERT INTO schema_migrations (version) VALUES ($1)`, f)
			return err
		})
		if err != nil {
			return fmt.Errorf("apply migration %s: %w", f, err)
		}

		logger.Info("migration applied", "file", f)
	}

	logger.Info("auto_migrate_complete", "count", len(files))
	return nil
}

// autoMigrateSQLite applies the full LiteDDL (all platform tables + indexes)
// directly via database.SqlDB. Idempotent: every statement uses IF NOT EXISTS.
//
// Order matters for existing on-disk DBs:
//  1. CREATE TABLE IF NOT EXISTS ...  (no-op if present)
//  2. EnsureSQLiteColumns for tables that gained columns after first create
//  3. CREATE INDEX IF NOT EXISTS ...  (needs columns from step 2)
//
// Without this split, indexes on ALTER-added columns fail with
// "no such column" against older yapapa.db files.
func autoMigrateSQLite(ctx context.Context, database *DB) error {
	if database.SqlDB == nil {
		return fmt.Errorf("sqlite db is nil")
	}

	var tables, indexes []string
	for _, ddl := range LiteDDL {
		trimmed := strings.TrimSpace(ddl)
		upper := strings.ToUpper(trimmed)
		if strings.HasPrefix(upper, "CREATE TABLE") {
			tables = append(tables, ddl)
			continue
		}
		if strings.HasPrefix(upper, "CREATE ") && strings.Contains(upper, "INDEX") {
			indexes = append(indexes, ddl)
			continue
		}
		// Unknown statement type — apply with tables for safety.
		tables = append(tables, ddl)
	}

	for _, ddl := range tables {
		if _, err := database.SqlDB.ExecContext(ctx, ddl); err != nil {
			return fmt.Errorf("apply lite table ddl: %w\nDDL: %s", err, ddl)
		}
	}

	if err := EnsureSQLiteColumns(ctx, database.SqlDB, "users", usersLiteColumnAdditions); err != nil {
		return fmt.Errorf("ensure users columns: %w", err)
	}
	if err := EnsureSQLiteColumns(ctx, database.SqlDB, "api_keys", apiKeysLiteColumnAdditions); err != nil {
		return fmt.Errorf("ensure api_keys columns: %w", err)
	}
	if err := EnsureSQLiteColumns(ctx, database.SqlDB, "user_credits", userCreditsLiteColumnAdditions); err != nil {
		return fmt.Errorf("ensure user_credits columns: %w", err)
	}
	if err := EnsureSQLiteColumns(ctx, database.SqlDB, "model_registry", modelRegistryLiteColumnAdditions); err != nil {
		return fmt.Errorf("ensure model_registry columns: %w", err)
	}
	if err := EnsureSQLiteColumns(ctx, database.SqlDB, "provider_keys", providerKeysLiteColumnAdditions); err != nil {
		return fmt.Errorf("ensure provider_keys columns: %w", err)
	}

	for _, ddl := range indexes {
		if _, err := database.SqlDB.ExecContext(ctx, ddl); err != nil {
			return fmt.Errorf("apply lite index ddl: %w\nDDL: %s", err, ddl)
		}
	}

	logger.Info("auto_migrate_complete", "type", "sqlite", "tables", len(tables), "indexes", len(indexes))
	return nil
}
