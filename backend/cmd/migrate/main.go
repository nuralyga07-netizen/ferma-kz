// migrate — утилита применения/отката миграций.
//
// Использование:
//
//	go run ./cmd/migrate          # применить все миграции
//	go run ./cmd/migrate down     # откатить последнюю
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"ferma-kz/backend/internal/database"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		slog.Error("DATABASE_URL is required")
		os.Exit(1)
	}

	ctx := context.Background()
	if len(os.Args) > 1 && os.Args[1] == "down" {
		if err := database.MigrateDown(ctx, dsn); err != nil {
			slog.Error("migrate down failed", "err", err)
			os.Exit(1)
		}
		fmt.Println("Migrated down")
		return
	}
	if err := database.Migrate(ctx, dsn); err != nil {
		slog.Error("migrate failed", "err", err)
		os.Exit(1)
	}
	fmt.Println("Migrated up")
}
