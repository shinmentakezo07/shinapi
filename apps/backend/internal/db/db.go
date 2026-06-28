package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"dra-platform/backend/internal/pkg/logger"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/v2/mongo"

	_ "modernc.org/sqlite"
)

type DBType string

const (
	DBTypePostgres DBType = "postgres"
	DBTypeNeon     DBType = "neon"
	DBTypeMongoDB  DBType = "mongodb"
	DBTypeSQLite   DBType = "sqlite"
)

// ErrMongoNotConfigured is returned when a MongoDB-specific operation is
// attempted on a DB whose MongoDB handle is nil (e.g. on a Postgres or
// SQLite runtime). Declared here so the transaction layer (tx.go) and
// factory (factory.go) share one sentinel.
var ErrMongoNotConfigured = errors.New("mongodb not configured")

// DB is a unified database wrapper that supports PostgreSQL (including Neon),
// MongoDB, and SQLite (runtime lite path). It implements the Querier
// interface so repositories can use it directly without caring about the
// underlying driver.
//
// In SQLite mode, Pool is nil and SqlDB/sq are populated. Repos that call
// into Pool directly will nil-deref in SQLite mode and need a separate
// port; the Querier-surface flow works with zero source changes.
type DB struct {
	Type    DBType
	Pool    *pgxpool.Pool
	MongoDB *mongo.Database
	SqlDB   *sql.DB

	mq *mongoQuerier
	sq *sqliteQuerier
}

func NewPostgres(databaseURL string) (*DB, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse db config: %w", err)
	}

	cfg.MaxConns = 20
	cfg.MinConns = 2
	cfg.MaxConnLifetime = time.Hour
	cfg.MaxConnIdleTime = 30 * time.Minute
	cfg.HealthCheckPeriod = 5 * time.Minute
	cfg.ConnConfig.ConnectTimeout = 5 * time.Second

	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	logger.Info("database connected", "type", "postgres", "max_conns", cfg.MaxConns, "min_conns", cfg.MinConns)
	return &DB{Type: DBTypePostgres, Pool: pool}, nil
}

// NewSQLite opens (and creates if missing) a SQLite file at the given path
// (modernc.org/sqlite accepts file:/abs or path or :memory:). Caller is
// responsible for invoking AutoMigrate / AutoSeed to apply the lite schema
// and canonical seed.
func NewSQLite(databaseURL string) (*DB, error) {
	sdb, err := sql.Open("sqlite", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	// Foreign keys and a small busy timeout make the SQLite runtime
	// behave closer to the Postgres path used by repos (and tests).
	if _, err := sdb.ExecContext(context.Background(),
		"PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;"); err != nil {
		_ = sdb.Close()
		return nil, fmt.Errorf("set pragmas: %w", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := sdb.PingContext(ctx); err != nil {
		_ = sdb.Close()
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}
	logger.Info("database connected", "type", "sqlite", "url", databaseURL)
	return &DB{Type: DBTypeSQLite, SqlDB: sdb, sq: &sqliteQuerier{db: sdb}}, nil
}

func (db *DB) Close() {
	if db.Pool != nil {
		logger.Info("database connection pool closing")
		db.Pool.Close()
	}
	if db.MongoDB != nil {
		logger.Info("mongodb client disconnecting")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if client := db.MongoDB.Client(); client != nil {
			_ = client.Disconnect(ctx)
		}
	}
	if db.SqlDB != nil {
		logger.Info("sqlite db closing")
		_ = db.SqlDB.Close()
	}
}

func (db *DB) Health(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	switch db.Type {
	case DBTypeMongoDB:
		if db.MongoDB == nil {
			return fmt.Errorf("mongodb not connected")
		}
		return db.MongoDB.Client().Ping(ctx, nil)
	case DBTypeSQLite:
		if db.SqlDB == nil {
			return fmt.Errorf("sqlite not connected")
		}
		return db.SqlDB.PingContext(ctx)
	default:
		if db.Pool == nil {
			return fmt.Errorf("postgres pool not connected")
		}
		return db.Pool.Ping(ctx)
	}
}

// ---------------------------------------------------------------------------
// Querier implementation
// ---------------------------------------------------------------------------

func (db *DB) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	switch db.Type {
	case DBTypeMongoDB:
		if db.mq == nil {
			db.mq = newMongoQuerier(db.MongoDB)
		}
		return db.mq.Query(ctx, sql, args...)
	case DBTypeSQLite:
		if db.sq == nil {
			db.sq = &sqliteQuerier{db: db.SqlDB}
		}
		return db.sq.Query(ctx, sql, args...)
	default:
		return db.Pool.Query(ctx, sql, args...)
	}
}

func (db *DB) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	switch db.Type {
	case DBTypeMongoDB:
		if db.mq == nil {
			db.mq = newMongoQuerier(db.MongoDB)
		}
		return db.mq.QueryRow(ctx, sql, args...)
	case DBTypeSQLite:
		if db.sq == nil {
			db.sq = &sqliteQuerier{db: db.SqlDB}
		}
		return db.sq.QueryRow(ctx, sql, args...)
	default:
		return db.Pool.QueryRow(ctx, sql, args...)
	}
}

func (db *DB) Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	switch db.Type {
	case DBTypeMongoDB:
		if db.mq == nil {
			db.mq = newMongoQuerier(db.MongoDB)
		}
		return db.mq.Exec(ctx, sql, args...)
	case DBTypeSQLite:
		if db.sq == nil {
			db.sq = &sqliteQuerier{db: db.SqlDB}
		}
		return db.sq.Exec(ctx, sql, args...)
	default:
		return db.Pool.Exec(ctx, sql, args...)
	}
}

// ---------------------------------------------------------------------------
// Transaction support
// ---------------------------------------------------------------------------

// Tx extends Querier with commit/rollback for explicit transaction control.
type Tx interface {
	Querier
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
}

// Begin starts a new transaction.
func (db *DB) Begin(ctx context.Context) (Tx, error) {
	switch db.Type {
	case DBTypeMongoDB:
		return db.beginMongoTx(ctx)
	case DBTypeSQLite:
		if db.SqlDB == nil {
			return nil, fmt.Errorf("sqlite not connected")
		}
		stx, err := db.SqlDB.BeginTx(ctx, nil)
		if err != nil {
			return nil, fmt.Errorf("begin sqlite tx: %w", err)
		}
		return &sqliteTx{q: &sqliteQuerier{db: db.SqlDB, tx: stx}, tx: stx}, nil
	default:
		return db.Pool.Begin(ctx)
	}
}

// (No exported SQLiteQuerier accessor; migrate/seed reach *sql.DB through
// db.SqlDB when they need it, and tests use testutil.OpenSQLite directly.)
