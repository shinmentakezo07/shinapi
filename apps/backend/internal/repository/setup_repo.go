package repository

import (
	"context"
	"errors"

	"dra-platform/backend/internal/db"
	"dra-platform/backend/internal/domain"
)

// ErrFirstAdminAlreadyExists is returned by CreateFirstAdmin when the
// admin_users table already has rows. Callers should map this to 403.
var ErrFirstAdminAlreadyExists = errors.New("first admin already exists")

// SetupRepo wraps the operations needed by the first-time bootstrap flow:
// counting existing admins and creating the first one inside a transaction
// that holds a Postgres advisory lock to serialize concurrent bootstrap
// attempts.
type SetupRepo struct {
	db *db.DB
}

func NewSetupRepo(d *db.DB) *SetupRepo { return &SetupRepo{db: d} }

// CountAdmins returns the total row count of admin_users. Used to populate
// the in-memory needsSetup flag on startup.
func (r *SetupRepo) CountAdmins(ctx context.Context) (int, error) {
	var n int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM admin_users`).Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}

// CreateFirstAdmin inserts a fresh user (role=superadmin) and the matching
// admin_users row atomically with pg_advisory_xact_lock(54321) so two
// bootstrap requests racing in the same instant cannot both succeed.
func (r *SetupRepo) CreateFirstAdmin(ctx context.Context, name, email, hashedPassword string) (userID string, err error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	// Take a transaction-scoped advisory lock so concurrent bootstrap
	// requests serialize through this point.
	if _, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(54321)`); err != nil {
		return "", err
	}

	// Re-check inside the lock: if any admin already exists, abort with
	// the typed sentinel — no need to keep waiting for the lock.
	var n int
	if err = tx.QueryRow(ctx, `SELECT COUNT(*) FROM admin_users`).Scan(&n); err != nil {
		return "", err
	}
	if n > 0 {
		err = ErrFirstAdminAlreadyExists
		return "", err
	}

	userID = domain.NewID()
	// User row — role hardcoded to superadmin. tier/rate-limit default to
	// "free" via the users schema defaults, which is fine for an admin.
	if _, err = tx.Exec(ctx,
		`INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, 'superadmin')`,
		userID, name, email, hashedPassword,
	); err != nil {
		return "", err
	}

	// admin_users row — first admin creates themselves (self-reference on
	// created_by) and gets the wildcard permissions array.
	if _, err = tx.Exec(ctx,
		`INSERT INTO admin_users (user_id, role, permissions, is_active, created_by)
		 VALUES ($1, 'superadmin', ARRAY['*'], true, $1)`,
		userID,
	); err != nil {
		return "", err
	}

	if err = tx.Commit(ctx); err != nil {
		return "", err
	}
	return userID, nil
}
