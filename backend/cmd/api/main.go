package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/auth"
	"ferma-kz/backend/internal/config"
	"ferma-kz/backend/internal/database"
	"ferma-kz/backend/internal/handlers"
	"ferma-kz/backend/internal/repositories"
	"ferma-kz/backend/internal/router"
	"ferma-kz/backend/internal/services"
	"ferma-kz/backend/internal/storage"
	"ferma-kz/backend/internal/ws"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("config load failed", "err", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// База данных
	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("database connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Миграции при старте
	if err := database.Migrate(ctx, cfg.DatabaseURL); err != nil {
		slog.Error("migrations failed", "err", err)
		os.Exit(1)
	}

	// Seed администратора (идемпотентно)
	if err := seedAdmin(ctx, pool, cfg); err != nil {
		slog.Error("admin seed failed", "err", err)
	}

	// Реестр зависимостей
	jwt := auth.NewJWT(cfg.JWTSecret, cfg.AccessTTL)

	profileRepo := repositories.NewProfileRepo(pool)
	refreshRepo := repositories.NewRefreshTokenRepo(pool)
	productRepo := repositories.NewProductRepo(pool)
	cartRepo := repositories.NewCartRepo(pool)
	orderRepo := repositories.NewOrderRepo(pool)
	reviewRepo := repositories.NewReviewRepo(pool)
	favRepo := repositories.NewFavoriteRepo(pool)
	chatRepo := repositories.NewChatRepo(pool)
	referralRepo := repositories.NewReferralRepo(pool)

	authSvc := services.NewAuthService(profileRepo, refreshRepo, jwt, pool, cfg.RefreshTTL)
	profileSvc := services.NewProfileService(profileRepo)
	productSvc := services.NewProductService(productRepo)
	appSvc := services.NewApplicationService(pool, profileRepo)
	promoSvc := services.NewPromoService(pool)
	referralSvc := services.NewReferralService(referralRepo, profileRepo)
	orderSvc := services.NewOrderService(pool, cartRepo, orderRepo, promoSvc, referralSvc, cfg)
	cartSvc := services.NewCartService(cartRepo)
	reviewSvc := services.NewReviewService(reviewRepo, orderRepo)
	favSvc := services.NewFavoriteService(favRepo, productRepo)
	chatSvc := services.NewChatService(chatRepo, profileRepo)

	hub := ws.NewHub()
	uploads, err := storage.NewLocalFS(cfg.UploadDir)
	if err != nil {
		slog.Error("upload dir failed", "err", err)
		os.Exit(1)
	}

	handlerDeps := router.Deps{
		Cfg:       cfg,
		JWT:       jwt,
		Auth:      handlers.NewAuthHandler(authSvc, cfg, profileSvc),
		Products:  handlers.NewProductHandler(productSvc),
		Farmers:   handlers.NewFarmerHandler(profileRepo, productSvc, appSvc),
		Cart:      handlers.NewCartHandler(cartSvc),
		Orders:    handlers.NewOrderHandler(orderSvc),
		Reviews:   handlers.NewReviewHandler(reviewSvc),
		Fav:       handlers.NewFavoriteHandler(favSvc),
		Chat:      handlers.NewChatHandler(chatSvc, hub),
		Referral:  handlers.NewReferralHandler(referralSvc),
		Admin:     handlers.NewAdminHandler(profileRepo, orderRepo, appSvc, promoSvc),
		Uploads:   handlers.NewUploadHandler(uploads),
		UploadDir: cfg.UploadDir,
		WSHub:     hub,
	}

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router.New(handlerDeps),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		slog.Info("server starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("graceful shutdown failed", "err", err)
	}
	slog.Info("server stopped")
}

// seedAdmin создаёт администратора из ADMIN_EMAIL/ADMIN_PASSWORD,
// если его ещё нет.
func seedAdmin(ctx context.Context, pool *pgxpool.Pool, cfg *config.Config) error {
	hash, err := auth.HashPassword(cfg.AdminPassword)
	if err != nil {
		return err
	}
	res, err := pool.Exec(ctx, `
		INSERT INTO profiles (email, password_hash, full_name, role, city)
		VALUES ($1, $2, 'Администратор', 'admin', 'Актобе')
		ON CONFLICT (email) DO NOTHING`,
		cfg.AdminEmail, hash)
	if err != nil {
		return err
	}
	if res.RowsAffected() > 0 {
		slog.Info("admin created", "email", cfg.AdminEmail)
	}
	return nil
}
