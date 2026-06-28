package testutil

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

// SQLiteUser is the SQLite-path representation of a user row. Mirrors the
// shape of domain.User but uses a string-encoded RFC3339 timestamp.
type SQLiteUser struct {
	ID        string
	Name      string
	Email     string
	Password  string
	Role      string
	CreatedAt time.Time
}

// SQLiteUserRepo is a minimal SQLite-only repository for tests that don't
// need the full pgx-coupled stack. Existing pgx-backed repository.UserRepo
// continues to use the Postgres path.
type SQLiteUserRepo struct {
	db *SQLiteTestDB
}

func NewSQLiteUserRepo(d *SQLiteTestDB) *SQLiteUserRepo {
	return &SQLiteUserRepo{db: d}
}

// Create inserts a new user. The caller supplies the id (typically a UUID
// generated in Go). Returns the row populated from the DB so the generated
// created_at is consistent with what's stored.
func (r *SQLiteUserRepo) Create(ctx context.Context, id, name, email, password, role string) (*SQLiteUser, error) {
	if id == "" {
		return nil, fmt.Errorf("id required")
	}
	if role == "" {
		role = "user"
	}
	_, err := r.db.DB.ExecContext(ctx,
		`INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
		id, name, email, password, role,
	)
	if err != nil {
		return nil, fmt.Errorf("insert user: %w", err)
	}
	return r.ByID(ctx, id)
}

func (r *SQLiteUserRepo) ByID(ctx context.Context, id string) (*SQLiteUser, error) {
	row := r.db.DB.QueryRowContext(ctx,
		`SELECT id, name, email, password, role, created_at FROM users WHERE id = ?`, id,
	)
	var u SQLiteUser
	var createdAt string
	if err := row.Scan(&u.ID, &u.Name, &u.Email, &u.Password, &u.Role, &createdAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("scan user by id: %w", err)
	}
	u.CreatedAt = parseTS(createdAt)
	return &u, nil
}

func (r *SQLiteUserRepo) ByEmail(ctx context.Context, email string) (*SQLiteUser, error) {
	row := r.db.DB.QueryRowContext(ctx,
		`SELECT id, name, email, password, role, created_at FROM users WHERE email = ?`, email,
	)
	var u SQLiteUser
	var createdAt string
	if err := row.Scan(&u.ID, &u.Name, &u.Email, &u.Password, &u.Role, &createdAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("scan user by email: %w", err)
	}
	u.CreatedAt = parseTS(createdAt)
	return &u, nil
}

// SQLiteCredits mirrors the user_credits row shape.
type SQLiteCredits struct {
	UserID         string
	Balance        int64
	TotalPurchased int64
	TotalSpent     int64
}

// SQLiteCreditsRepo is the SQLite-only credit ledger.
type SQLiteCreditsRepo struct {
	db *SQLiteTestDB
}

func NewSQLiteCreditsRepo(d *SQLiteTestDB) *SQLiteCreditsRepo {
	return &SQLiteCreditsRepo{db: d}
}

// Upsert inserts or updates the credit row for the given user. Idempotent.
// Uses the implicit unique index on user_id for ON CONFLICT.
func (r *SQLiteCreditsRepo) Upsert(ctx context.Context, userID string, balance, totalPurchased int64) error {
	_, err := r.db.DB.ExecContext(ctx, `
		INSERT INTO user_credits (id, user_id, balance, total_purchased, total_spent)
		VALUES (?, ?, ?, ?, 0)
		ON CONFLICT(user_id) DO UPDATE SET
			balance         = excluded.balance,
			total_purchased = excluded.total_purchased
	`, "cre-"+userID, userID, balance, totalPurchased)
	if err != nil {
		return fmt.Errorf("upsert credits: %w", err)
	}
	return nil
}

func (r *SQLiteCreditsRepo) ByUser(ctx context.Context, userID string) (*SQLiteCredits, error) {
	row := r.db.DB.QueryRowContext(ctx,
		`SELECT user_id, balance, total_purchased, total_spent FROM user_credits WHERE user_id = ?`, userID,
	)
	var c SQLiteCredits
	if err := row.Scan(&c.UserID, &c.Balance, &c.TotalPurchased, &c.TotalSpent); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("scan credits: %w", err)
	}
	return &c, nil
}

// Deduct attempts to subtract amount atomically. Returns (false, nil) on
// insufficient balance — matching the contract of the pgx credits.Deduct.
func (r *SQLiteCreditsRepo) Deduct(ctx context.Context, userID string, amount int64) (bool, error) {
	if amount <= 0 {
		return false, fmt.Errorf("amount must be positive")
	}
	res, err := r.db.DB.ExecContext(ctx, `
		UPDATE user_credits
		SET balance      = balance - ?,
		    total_spent  = total_spent + ?
		WHERE user_id = ? AND balance >= ?
	`, amount, amount, userID, amount)
	if err != nil {
		return false, fmt.Errorf("deduct credits: %w", err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return false, fmt.Errorf("rows affected: %w", err)
	}
	return n == 1, nil
}

// SQLiteTx mirrors the credit_transactions row shape.
type SQLiteTx struct {
	ID             string
	UserID         string
	Amount         int64
	Type           string
	Description    string
	RelatedLogID   string
	StripePaymentID string
	CreatedAt      time.Time
}

type SQLiteTxRepo struct {
	db *SQLiteTestDB
}

func NewSQLiteTxRepo(d *SQLiteTestDB) *SQLiteTxRepo {
	return &SQLiteTxRepo{db: d}
}

func (r *SQLiteTxRepo) Insert(ctx context.Context, t *SQLiteTx) error {
	if t.ID == "" {
		return fmt.Errorf("id required")
	}
	_, err := r.db.DB.ExecContext(ctx, `
		INSERT INTO credit_transactions
			(id, user_id, amount, type, description, related_log_id, stripe_payment_id)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, t.ID, t.UserID, t.Amount, t.Type, t.Description,
		nullable(t.RelatedLogID), nullable(t.StripePaymentID))
	return err
}

func (r *SQLiteTxRepo) ByUser(ctx context.Context, userID string, limit, offset int) ([]SQLiteTx, int, error) {
	rows, err := r.db.DB.QueryContext(ctx, `
		SELECT id, user_id, amount, type, description,
		       IFNULL(related_log_id, ''), IFNULL(stripe_payment_id, ''), created_at
		FROM credit_transactions
		WHERE user_id = ?
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("query tx: %w", err)
	}
	defer rows.Close()

	var out []SQLiteTx
	for rows.Next() {
		var t SQLiteTx
		var createdAt string
		if err := rows.Scan(&t.ID, &t.UserID, &t.Amount, &t.Type, &t.Description,
			&t.RelatedLogID, &t.StripePaymentID, &createdAt); err != nil {
			return nil, 0, fmt.Errorf("scan tx: %w", err)
		}
		t.CreatedAt = parseTS(createdAt)
		out = append(out, t)
	}

	var total int
	if err := r.db.DB.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM credit_transactions WHERE user_id = ?`, userID,
	).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count tx: %w", err)
	}
	return out, total, rows.Err()
}

// parseTS accepts the RFC3339Nano string produced by
// strftime('%Y-%m-%dT%H:%M:%fZ','now') and falls back to time.Now() if
// parsing fails (which should never happen — defensive).
func parseTS(s string) time.Time {
	if t, err := time.Parse(time.RFC3339Nano, s); err == nil {
		return t
	}
	return time.Now()
}

func nullable(s string) any {
	if s == "" {
		return nil
	}
	return s
}
