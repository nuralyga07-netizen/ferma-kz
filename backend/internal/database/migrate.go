package database

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"log/slog"

	_ "github.com/jackc/pgx/v5/stdlib" // драйвер "pgx" для database/sql
	"github.com/pressly/goose/v3"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Migrate применяет все миграции goose из ./migrations (embedded).
func Migrate(ctx context.Context, dsn string) error {
	goose.SetBaseFS(migrationsFS)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("open db for migration: %w", err)
	}
	defer db.Close()

	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	if err := goose.RunContext(ctx, "up", db, "migrations"); err != nil {
		return fmt.Errorf("run migrations: %w", err)
	}
	slog.Info("migrations applied")
	return nil
}

// MigrateDown откатывает последнюю миграцию.
func MigrateDown(ctx context.Context, dsn string) error {
	goose.SetBaseFS(migrationsFS)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("open db for migration: %w", err)
	}
	defer db.Close()

	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	return goose.RunContext(ctx, "down", db, "migrations")
}
