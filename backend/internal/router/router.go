package router

import (
	"errors"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	chicors "github.com/go-chi/cors"
	"golang.org/x/time/rate"

	"ferma-kz/backend/internal/auth"
	"ferma-kz/backend/internal/config"
	"ferma-kz/backend/internal/handlers"
	"ferma-kz/backend/internal/ws"
)

// Deps — зависимости для сборки роутера.
type Deps struct {
	Cfg       *config.Config
	JWT       *auth.JWT
	Auth      *handlers.AuthHandler
	Products  *handlers.ProductHandler
	Farmers   *handlers.FarmerHandler
	Cart      *handlers.CartHandler
	Orders    *handlers.OrderHandler
	Reviews   *handlers.ReviewHandler
	Fav       *handlers.FavoriteHandler
	Chat      *handlers.ChatHandler
	Referral  *handlers.ReferralHandler
	Admin     *handlers.AdminHandler
	Uploads   *handlers.UploadHandler
	UploadDir string
	WSHub     *ws.Hub
}

// RateLimiter — простой per-IP limiter (golang.org/x/time/rate).
type RateLimiter struct {
	rate  rate.Limit
	burst int
	mu    sync.Mutex
	byIP  map[string]*ipEntry
}

type ipEntry struct {
	lim  *rate.Limiter
	seen time.Time
}

func NewRateLimiter(r rate.Limit, burst int) *RateLimiter {
	rl := &RateLimiter{rate: r, burst: burst, byIP: make(map[string]*ipEntry)}
	go rl.gcLoop()
	return rl
}

// gcLoop периодически чистит устаревшие записи.
func (rl *RateLimiter) gcLoop() {
	t := time.NewTicker(5 * time.Minute)
	defer t.Stop()
	for range t.C {
		rl.mu.Lock()
		for ip, e := range rl.byIP {
			if time.Since(e.seen) > time.Hour {
				delete(rl.byIP, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// Allow — разрешён ли ещё запрос для IP.
func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	e, ok := rl.byIP[ip]
	now := time.Now()
	if !ok || now.Sub(e.seen) > time.Hour {
		e = &ipEntry{lim: rate.NewLimiter(rl.rate, rl.burst), seen: now}
		rl.byIP[ip] = e
	}
	rl.mu.Unlock()
	return e.lim.Allow()
}

func clientIP(r *http.Request) string {
	// За доверенным реверсом берём X-Forwarded-For, иначе remote addr
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// RateLimitMiddleware возвращает 429 при превышении лимита.
func RateLimitMiddleware(rl *RateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !rl.Allow(clientIP(r)) {
				w.Header().Set("Retry-After", "60")
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.WriteHeader(http.StatusTooManyRequests)
				_, _ = w.Write([]byte(`{"success":false,"data":null,"error":"Слишком много попыток, попробуйте позже"}`))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		h.Set("Content-Security-Policy", "default-src 'self'")
		next.ServeHTTP(w, r)
	})
}

// New — собирает роутер приложения.
func New(d Deps) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(securityHeaders)

	// CORS
	cors := chicors.New(chicors.Options{
		AllowedOrigins:   d.Cfg.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	})
	r.Use(cors.Handler)

	// Health
	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Статика: загруженные изображения
	r.Get("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir(d.UploadDir))).ServeHTTP)

	// Rate-limit на чувствительных маршрутах
	loginLimiter := NewRateLimiter(rate.Every(30*time.Second), 20)   // ~20/мин
	registerLimiter := NewRateLimiter(rate.Every(12*time.Minute), 5) // ~5/час

	r.Route("/api/v1", func(api chi.Router) {
		// Auth (rate-limit на чувствительных маршрутах)
		api.With(RateLimitMiddleware(registerLimiter)).Post("/auth/register", d.Auth.Register)
		api.With(RateLimitMiddleware(loginLimiter)).Post("/auth/login", d.Auth.Login)
		api.Post("/auth/refresh", d.Auth.Refresh)
		api.Post("/auth/forgot-password", d.Auth.ForgotPassword)

		// Публичные каталоги (опциональная авторизация: mine=true, свои неактивные)
		api.With(d.JWT.OptionalMiddleware).Get("/products", d.Products.List)
		api.With(d.JWT.OptionalMiddleware).Get("/products/{id}", d.Products.Get)
		api.Get("/products/{id}/reviews", d.Reviews.List)
		api.Get("/categories", d.Products.Categories)
		api.Get("/farmers", d.Farmers.List)
		api.Get("/farmers/{id}", d.Farmers.Get)

		// Только авторизованные
		api.Group(func(authed chi.Router) {
			authed.Use(d.JWT.Middleware)

			// Профиль
			authed.Get("/auth/me", d.Auth.Me)
			authed.Patch("/auth/me", d.Auth.UpdateMe)
			authed.Post("/auth/logout", d.Auth.Logout)

			// Корзина
			authed.Get("/cart", d.Cart.List)
			authed.Post("/cart", d.Cart.Add)
			authed.Patch("/cart/{productId}", d.Cart.SetQuantity)
			authed.Delete("/cart/{productId}", d.Cart.Remove)

			// Заказы
			authed.Post("/orders/checkout", d.Orders.Checkout)
			authed.Get("/orders", d.Orders.List)
			authed.Get("/orders/{id}", d.Orders.Get)
			authed.Patch("/orders/{id}/status", d.Orders.UpdateStatus)
			authed.Post("/orders/{id}/reviews", d.Reviews.Create)

			// Избранное
			authed.Get("/favorites", d.Fav.List)
			authed.Post("/favorites/{productId}", d.Fav.Add)
			authed.Delete("/favorites/{productId}", d.Fav.Remove)

			// Чат
			authed.Get("/conversations", d.Chat.List)
			authed.Post("/conversations", d.Chat.Start)
			authed.Get("/conversations/{id}/messages", d.Chat.ListMessages)
			authed.Post("/conversations/{id}/messages", d.Chat.Send)
			authed.Post("/conversations/{id}/read", d.Chat.MarkRead)

			// Рефералы
			authed.Get("/referrals", d.Referral.Mine)
			authed.Get("/referrals/code", d.Referral.Code)

			// Загрузка фото
			authed.Post("/uploads", d.Uploads.Upload)

			// Фермер (заявка)
			authed.Post("/farmers/apply", d.Farmers.Apply)
			authed.Get("/farmers/apply/mine", d.Farmers.Mine)

			// CRUD товаров — только фермеры
			authed.Group(func(farmer chi.Router) {
				farmer.Use(auth.RoleMiddleware("farmer", "admin"))
				farmer.Post("/products", d.Products.Create)
				farmer.Patch("/products/{id}", d.Products.Update)
				farmer.Delete("/products/{id}", d.Products.Deactivate)
			})

			// Админ
			authed.Group(func(admin chi.Router) {
				admin.Use(auth.RoleMiddleware("admin"))
				admin.Get("/admin/stats", d.Admin.Stats)
				admin.Get("/admin/users", d.Admin.ListUsers)
				admin.Patch("/admin/users/{id}/status", d.Admin.SetActive)
				admin.Get("/admin/applications", d.Admin.ListApplications)
				admin.Post("/admin/applications/{id}/review", d.Admin.ReviewApplication)
				admin.Get("/admin/promotions", d.Admin.ListPromos)
				admin.Post("/admin/promotions", d.Admin.CreatePromo)
				admin.Patch("/admin/promotions/{id}", d.Admin.UpdatePromo)
				admin.Delete("/admin/promotions/{id}", d.Admin.DeletePromo)
			})
		})
	})

	// WebSocket: /ws?token=<access_token> (или Bearer в заголовке)
	r.Get("/ws", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, err := wsAuth(r, d.JWT)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		d.WSHub.ServeWS(w, r, func(*http.Request) (string, error) { return userID, nil })
	}))

	return r
}

// wsAuth — проверяет access-токен из query (?token=) или Authorization.
func wsAuth(r *http.Request, j *auth.JWT) (string, error) {
	tok := r.URL.Query().Get("token")
	if tok == "" {
		if h := r.Header.Get("Authorization"); strings.HasPrefix(h, "Bearer ") {
			tok = strings.TrimPrefix(h, "Bearer ")
		}
	}
	if tok == "" {
		return "", errors.New("token required")
	}
	claims, err := j.ParseAccessToken(tok)
	if err != nil {
		return "", err
	}
	return claims.UserID, nil
}
