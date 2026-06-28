package db

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// Querier abstracts pgxpool.Pool, pgx.Tx, the SQLite facade, and the
// MongoDB facade so repositories can run inside transactions regardless
// of the underlying driver.
type Querier interface {
	Query(ctx context.Context, q string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, q string, args ...any) pgx.Row
	Exec(ctx context.Context, q string, args ...any) (pgconn.CommandTag, error)
}

// (Tx interface lives in db.go so Begin/WithTx dispatch stay next to the DB
// struct. Querier is declared here because all the per-driver Tx impls in
// this file implement it.)

// -----------------------------------------------------------------------
// SQLite transaction
// -----------------------------------------------------------------------

type sqliteTx struct {
	q  *sqliteQuerier
	tx *sql.Tx
}

func (t *sqliteTx) Query(ctx context.Context, q string, args ...any) (pgx.Rows, error) {
	return t.q.Query(ctx, q, args...)
}

func (t *sqliteTx) QueryRow(ctx context.Context, q string, args ...any) pgx.Row {
	return t.q.QueryRow(ctx, q, args...)
}

func (t *sqliteTx) Exec(ctx context.Context, q string, args ...any) (pgconn.CommandTag, error) {
	return t.q.Exec(ctx, q, args...)
}

// Commit/Rollback swallow ctx: Go 1.21+ stdlib *sql.Tx has no context-aware
// commit/rollback, so cancellation cannot be honored at tx commit time.
func (t *sqliteTx) Commit(ctx context.Context) error   { return t.tx.Commit() }
func (t *sqliteTx) Rollback(ctx context.Context) error { return t.tx.Rollback() }

// -----------------------------------------------------------------------
// MongoDB transaction (mongo-driver/v2)
//
// Repos currently call Querier.Query/Exec with the outer ctx, which never
// carries a SessionContext — so multi-statement operations executed via
// mongoTx will not actually roll back atomically. CommitTransaction /
// AbortTransaction are real calls, but rollback is best-effort until we
// plumb `mongo.WithSession(ctx, sess)` through Querier. Mongo's per-doc
// atomicity still keeps single-document ops safe; multi-doc Mongo
// transactions need SessionContext plumbing (tracked, not done).
// -----------------------------------------------------------------------

// In v2 mongo-driver, Client.StartSession() returns *mongo.Session
// (pointer to the concrete session struct) — not the Session interface.
// We store the pointer here so method calls resolve correctly.
type mongoTx struct {
	q    *mongoQuerier
	sess *mongo.Session
}

func (t *mongoTx) Query(ctx context.Context, q string, args ...any) (pgx.Rows, error) {
	return t.q.Query(ctx, q, args...)
}

func (t *mongoTx) QueryRow(ctx context.Context, q string, args ...any) pgx.Row {
	return t.q.QueryRow(ctx, q, args...)
}

func (t *mongoTx) Exec(ctx context.Context, q string, args ...any) (pgconn.CommandTag, error) {
	return t.q.Exec(ctx, q, args...)
}

// Commit/Rollback chain EndSession after the transactional call so the
// session returns to mongo-driver's connection pool. Without this the
// session leaks until GC, which degrades under load.
func (t *mongoTx) Commit(ctx context.Context) error {
	err := t.sess.CommitTransaction(ctx)
	t.sess.EndSession(ctx)
	return err
}

func (t *mongoTx) Rollback(ctx context.Context) error {
	err := t.sess.AbortTransaction(ctx)
	t.sess.EndSession(ctx)
	return err
}

// v2 API notes for beginMongoTx:
//   - client.StartSession()     → (mongo.Session, error)
//   - sess.StartTransaction()   → error (no SessionContext return)
//   - sess.EndSession(ctx)      → void (no return value)
func (db *DB) beginMongoTx(ctx context.Context) (Tx, error) {
	if db.MongoDB == nil {
		return nil, ErrMongoNotConfigured
	}
	sess, err := db.MongoDB.Client().StartSession()
	if err != nil {
		return nil, fmt.Errorf("start mongo session: %w", err)
	}
	if err := sess.StartTransaction(); err != nil {
		sess.EndSession(ctx)
		return nil, fmt.Errorf("start mongo tx: %w", err)
	}
	if db.mq == nil {
		db.mq = newMongoQuerier(db.MongoDB)
	}
	return &mongoTx{q: db.mq, sess: sess}, nil
}

// WithTx runs fn inside a transaction. Dispatch happens via DB.Begin, so
// this helper is driver-agnostic. fn is invoked with the Querier view of
// the active Tx interface.
func (db *DB) WithTx(ctx context.Context, fn func(Querier) error) error {
	tx, err := db.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback(ctx)
			panic(p)
		}
	}()
	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			return fmt.Errorf("rollback: %w (after err: %v)", rbErr, err)
		}
		return err
	}
	return tx.Commit(ctx)
}
