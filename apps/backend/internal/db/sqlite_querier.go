// File: apps/backend/internal/db/sqlite_querier.go
//
// SQLite adapter that satisfies the same pgx-flavored Querier contract that
// pgxpool.Pool and the MongoDB adapter (mongo_querier.go) expose to
// repositories. Wraps *sql.DB / *sql.Tx so existing pgx-shaped repo code
// can run against SQLite without per-repo rewrites.
//
// Coverage matrix for assign(): *string, *int, *int64, *bool, *float64,
// *[]byte, *any, *time.Time (parses RFC3339Nano/RFC3339), *uuid.UUID
// (parses), *sql.NullString/Int64/Bool/Float64. Anything outside this
// set fails the scan. Notably NOT covered today: pgtype.Text, pgtype.Bool,
// pgtype.Timestamptz (custom pgx types), pointers to pgx row decoders.
// Repos that Scan into pgtype.* need an extension.
package db

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// sqliteQuerier is the SQLite-backed Querier. Constructed once per DB
// (in factory.NewSQLite) and per transaction (DB.Begin).
type sqliteQuerier struct {
	db *sql.DB
	tx *sql.Tx
}

func (q *sqliteQuerier) Query(ctx context.Context, qStr string, args ...any) (pgx.Rows, error) {
	rows, err := q.queryCtx(ctx, qStr, args...)
	if err != nil {
		return nil, err
	}
	return &sqliteRows{Rows: rows}, nil
}

func (q *sqliteQuerier) QueryRow(ctx context.Context, qStr string, args ...any) pgx.Row {
	return &sqliteRow{ctx: ctx, q: q, sqlText: qStr, args: args}
}

func (q *sqliteQuerier) Exec(ctx context.Context, qStr string, args ...any) (pgconn.CommandTag, error) {
	var (
		res sql.Result
		err error
	)
	if q.tx != nil {
		res, err = q.tx.ExecContext(ctx, qStr, args...)
	} else {
		res, err = q.db.ExecContext(ctx, qStr, args...)
	}
	if err != nil {
		return pgconn.CommandTag{}, err
	}
	ra, _ := res.RowsAffected()
	return sqliteTag(ra, sqliteOpKeyword(qStr)), nil
}

func (q *sqliteQuerier) queryCtx(ctx context.Context, qStr string, args ...any) (*sql.Rows, error) {
	if q.tx != nil {
		return q.tx.QueryContext(ctx, qStr, args...)
	}
	return q.db.QueryContext(ctx, qStr, args...)
}

// sqliteRows wraps *sql.Rows to satisfy the pgx.Rows surface that repos
// call. Methods that don't have a 1:1 *sql.Rows mapping return safe no-ops.
type sqliteRows struct{ *sql.Rows }

func (r *sqliteRows) Scan(dest ...any) error { return r.Rows.Scan(dest...) }

func (r *sqliteRows) Values() ([]any, error) {
	if r == nil || r.Rows == nil {
		return nil, fmt.Errorf("nil rows")
	}
	return scanValues(r.Rows)
}

func (r *sqliteRows) RawValues() [][]byte {
	// Note: must be called after Next(); otherwise nil. Same as pgx.
	if r == nil || r.Rows == nil {
		return nil
	}
	raw, err := scanRawValues(r.Rows)
	if err != nil {
		return nil
	}
	return raw
}

func (r *sqliteRows) FieldDescriptions() []pgconn.FieldDescription {
	if r == nil || r.Rows == nil {
		return nil
	}
	cols, err := r.Rows.Columns()
	if err != nil {
		return nil
	}
	out := make([]pgconn.FieldDescription, 0, len(cols))
	for _, c := range cols {
		out = append(out, pgconn.FieldDescription{Name: c})
	}
	return out
}

func (r *sqliteRows) Close()                        { _ = r.Rows.Close() }
func (r *sqliteRows) Err() error                    { return r.Rows.Err() }
func (r *sqliteRows) CommandTag() pgconn.CommandTag { return pgconn.CommandTag{} }
func (r *sqliteRows) Conn() *pgx.Conn               { return nil }
func (r *sqliteRows) Next() bool                    { return r.Rows.Next() }

// sqliteRow implements pgx.Row with lazy fetch — Scan triggers the query.
// Mirrors mongoRow pattern.
type sqliteRow struct {
	ctx     context.Context
	q       *sqliteQuerier
	sqlText string
	args    []any
	err     error
	vals    []any
	once    bool
}

func (r *sqliteRow) Scan(dest ...any) error {
	if !r.once {
		r.once = true
		rows, err := r.q.queryCtx(r.ctx, r.sqlText, r.args...)
		if err != nil {
			r.err = err
			return err
		}
		defer rows.Close()
		if !rows.Next() {
			if err := rows.Err(); err != nil {
				r.err = err
				return err
			}
			r.err = sql.ErrNoRows
			return sql.ErrNoRows
		}
		vals, err := scanColumns(rows)
		if err != nil {
			r.err = err
			return err
		}
		r.vals = vals
	}
	if r.err != nil {
		return r.err
	}
	if len(dest) != len(r.vals) {
		return fmt.Errorf("scan: %d destination args for %d columns", len(dest), len(r.vals))
	}
	for i := range dest {
		if err := assign(dest[i], r.vals[i]); err != nil {
			return err
		}
	}
	return nil
}

// scanValues reads the current row and returns its column values.
func scanValues(rows *sql.Rows) ([]any, error) {
	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, err
		}
		return nil, sql.ErrNoRows
	}
	return scanColumns(rows)
}

// scanRawValues returns raw [][]byte column data for the current row.
func scanRawValues(rows *sql.Rows) ([][]byte, error) {
	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, err
		}
		return nil, sql.ErrNoRows
	}
	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	raw := make([][]byte, len(cols))
	ptrs := make([]any, len(cols))
	for i := range raw {
		ptrs[i] = &raw[i]
	}
	if err := rows.Scan(ptrs...); err != nil {
		return nil, err
	}
	return raw, nil
}

// scanColumns reads the current row and returns normalized column values
// ([]byte → string).
func scanColumns(rows *sql.Rows) ([]any, error) {
	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	raw := make([]any, len(cols))
	ptrs := make([]any, len(cols))
	for i := range raw {
		ptrs[i] = &raw[i]
	}
	if err := rows.Scan(ptrs...); err != nil {
		return nil, err
	}
	out := make([]any, len(raw))
	for i, v := range raw {
		out[i] = normalizeValue(v)
	}
	return out, nil
}

// assign copies a row value v into dest, dispatching on destination type.
// Hand-rolled rather than reflect-based: faster, no silent mis-casts for
// unknown destinations (Scans into unrecognised types return an error).
func assign(dest any, v any) error {
	if v == nil {
		switch d := dest.(type) {
		case *string:
			*d = ""
		case *int:
			*d = 0
		case *int64:
			*d = 0
		case *bool:
			*d = false
		case *float64:
			*d = 0
		case *[]byte:
			*d = nil
		case *any:
			*d = nil
		case *time.Time:
			*d = time.Time{}
		case *uuid.UUID:
			*d = uuid.Nil
		case *sql.NullString:
			*d = sql.NullString{}
		case *sql.NullInt64:
			*d = sql.NullInt64{}
		case *sql.NullBool:
			*d = sql.NullBool{}
		case *sql.NullFloat64:
			*d = sql.NullFloat64{}
		default:
			return fmt.Errorf("scan: cannot assign NULL into %T", dest)
		}
		return nil
	}
	switch d := dest.(type) {
	case *string:
		s, ok := v.(string)
		if !ok {
			if b, isBytes := v.([]byte); isBytes {
				*d = string(b)
				return nil
			}
			*d = fmt.Sprintf("%v", v)
			return nil
		}
		*d = s
	case *int:
		n, ok := toInt64(v)
		if !ok {
			return fmt.Errorf("scan: cannot assign %T to *int", v)
		}
		*d = int(n)
	case *int64:
		n, ok := toInt64(v)
		if !ok {
			return fmt.Errorf("scan: cannot assign %T to *int64", v)
		}
		*d = n
	case *bool:
		if b, ok := v.(bool); ok {
			*d = b
			return nil
		}
		if n, ok := toInt64(v); ok {
			*d = n != 0
			return nil
		}
		return fmt.Errorf("scan: cannot assign %T to *bool", v)
	case *float64:
		f, ok := v.(float64)
		if !ok {
			return fmt.Errorf("scan: cannot assign %T to *float64", v)
		}
		*d = f
	case *[]byte:
		b, ok := v.([]byte)
		if !ok {
			return fmt.Errorf("scan: cannot assign %T to *[]byte", v)
		}
		*d = b
	case *any:
		*d = v
	case *time.Time:
		if t, ok := v.(time.Time); ok {
			*d = t
			return nil
		}
		if s, ok := v.(string); ok {
			for _, layout := range []string{time.RFC3339Nano, time.RFC3339, "2006-01-02 15:04:05"} {
				if t, err := time.Parse(layout, s); err == nil {
					*d = t
					return nil
				}
			}
		}
		return fmt.Errorf("scan: cannot assign %T(%v) to *time.Time", v, v)
	case *uuid.UUID:
		if u, ok := v.(uuid.UUID); ok {
			*d = u
			return nil
		}
		if u, ok := v.(*uuid.UUID); ok && u != nil {
			*d = *u
			return nil
		}
		if s, ok := v.(string); ok {
			if u, err := uuid.Parse(s); err == nil {
				*d = u
				return nil
			}
		}
		if b, ok := v.([]byte); ok {
			if u, err := uuid.Parse(string(b)); err == nil {
				*d = u
				return nil
			}
		}
		return fmt.Errorf("scan: cannot assign %T(%v) to *uuid.UUID", v, v)
	case *sql.NullString:
		d.Valid = false
		switch x := v.(type) {
		case string:
			d.String, d.Valid = x, true
		case []byte:
			d.String, d.Valid = string(x), true
		default:
			d.String, d.Valid = fmt.Sprintf("%v", v), true
		}
	case *sql.NullInt64:
		if n, ok := toInt64(v); ok {
			d.Int64, d.Valid = n, true
			return nil
		}
		if s, ok := v.(string); ok {
			if n, err := strconv.ParseInt(s, 10, 64); err == nil {
				d.Int64, d.Valid = n, true
				return nil
			}
		}
		d.Valid = false
	case *sql.NullBool:
		if b, ok := v.(bool); ok {
			d.Bool, d.Valid = b, true
			return nil
		}
		if n, ok := toInt64(v); ok {
			d.Bool, d.Valid = n != 0, true
			return nil
		}
		d.Valid = false
	case *sql.NullFloat64:
		if f, ok := v.(float64); ok {
			d.Float64, d.Valid = f, true
			return nil
		}
		if n, ok := toInt64(v); ok {
			d.Float64, d.Valid = float64(n), true
			return nil
		}
		d.Valid = false
	default:
		return fmt.Errorf("scan: unsupported destination type %T", dest)
	}
	return nil
}

func toInt64(v any) (int64, bool) {
	switch x := v.(type) {
	case int64:
		return x, true
	case int:
		return int64(x), true
	case int32:
		return int64(x), true
	case float64:
		return int64(x), true
	case string:
		if n, err := strconv.ParseInt(x, 10, 64); err == nil {
			return n, true
		}
	}
	return 0, false
}

// normalizeValue converts driver-specific value shapes that *sql.Rows.Scan
// leaves unwrapped (notably []byte for TEXT) into the Go values downstream
// Scan destinations expect.
func normalizeValue(v any) any {
	switch x := v.(type) {
	case []byte:
		return string(x)
	default:
		return x
	}
}

// sqliteTag synthesises a pgconn.CommandTag from rowsAffected + the
// SQL statement's leading keyword (INSERT, UPDATE, DELETE, SELECT).
func sqliteTag(rowsAffected int64, op string) pgconn.CommandTag {
	if rowsAffected < 0 {
		return pgconn.CommandTag{}
	}
	if op == "" {
		op = "UPDATE"
	}
	return pgconn.NewCommandTag(op + " " + strconv.FormatInt(rowsAffected, 10))
}

// sqliteOpKeyword picks the leading SQL keyword. Trims leading whitespace
// and case-folds.
func sqliteOpKeyword(sql string) string {
	s := strings.TrimLeft(sql, " \t\n\r")
	upper := strings.ToUpper(s)
	for _, op := range []string{"INSERT", "UPDATE", "DELETE", "SELECT", "WITH", "REPLACE"} {
		if upper == op || strings.HasPrefix(upper, op+" ") || strings.HasPrefix(upper, op+"\t") || strings.HasPrefix(upper, op+"\n") {
			return op
		}
	}
	return ""
}
