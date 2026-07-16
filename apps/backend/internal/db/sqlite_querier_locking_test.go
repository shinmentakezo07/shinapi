package db

import "testing"

// TestNormalizeSQLiteSQLStripsRowLocking verifies that Postgres row-locking
// clauses are dropped when translating a query for the SQLite lite runtime.
// The lite runtime is single-process and SQLite has no row locks, so the
// clauses are both unsupported (syntax error) and unnecessary. Regression
// guard for the webhook retry worker's "near FOR: syntax error" log spam.
func TestNormalizeSQLiteSQLStripsRowLocking(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want string
	}{
		{
			name: "webhook ListPendingRetries",
			in: `SELECT id, webhook_id, event_type, payload, status_code, error, attempts, max_attempts, status, delivered_at, next_retry_at, created_at
			FROM webhook_deliveries
			WHERE status = 'pending' AND delivered_at IS NULL AND next_retry_at IS NOT NULL AND next_retry_at <= NOW()
			ORDER BY next_retry_at ASC
			LIMIT $1
				FOR UPDATE SKIP LOCKED`,
			want: `SELECT id, webhook_id, event_type, payload, status_code, error, attempts, max_attempts, status, delivered_at, next_retry_at, created_at
			FROM webhook_deliveries
			WHERE status = 'pending' AND delivered_at IS NULL AND next_retry_at IS NOT NULL AND next_retry_at <= strftime('%Y-%m-%dT%H:%M:%fZ','now')
			ORDER BY next_retry_at ASC
			LIMIT $1
				`,
		},
		{
			name: "admin_features redeemPromo bare FOR UPDATE",
			in:   `SELECT id,code,type,value FROM promo_codes WHERE code=$1 FOR UPDATE`,
			want: `SELECT id,code,type,value FROM promo_codes WHERE code=$1 `,
		},
		{
			name: "FOR SHARE",
			in:   `SELECT balance FROM user_credits WHERE user_id=$1 FOR SHARE`,
			want: `SELECT balance FROM user_credits WHERE user_id=$1 `,
		},
		{
			name: "FOR UPDATE OF table.col NOWAIT",
			in:   `SELECT a FROM t WHERE k=$1 FOR UPDATE OF t.col NOWAIT`,
			want: `SELECT a FROM t WHERE k=$1 `,
		},
		{
			name: "FOR NO KEY UPDATE SKIP LOCKED multi-table",
			in:   `SELECT a FROM t1, t2 WHERE k=$1 FOR NO KEY UPDATE OF t1, t2 SKIP LOCKED`,
			want: `SELECT a FROM t1, t2 WHERE k=$1 `,
		},
		{
			name: "guarded: literal FOR in WHERE not stripped",
			in:   `SELECT a FROM t WHERE note=$1 -- for future use`,
			want: `SELECT a FROM t WHERE note=$1 -- for future use`,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := normalizeSQLiteSQL(tc.in)
			if got != tc.want {
				t.Errorf("normalizeSQLiteSQL mismatch\nin:   %q\nwant: %q\ngot:  %q", tc.in, tc.want, got)
			}
		})
	}
}
