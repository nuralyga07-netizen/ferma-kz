package auth

import (
	"context"
	"net/http"
	"strings"

	"ferma-kz/backend/internal/httpx"
)

type contextKey string

const (
	CtxUserID contextKey = "user_id"
	CtxRole   contextKey = "role"
)

// Middleware проверяет Bearer JWT и кладёт userID/role в context.
func (j *JWT) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if !strings.HasPrefix(h, "Bearer ") {
			httpx.Fail(w, http.StatusUnauthorized, "Требуется авторизация")
			return
		}
		claims, err := j.ParseAccessToken(strings.TrimPrefix(h, "Bearer "))
		if err != nil {
			httpx.Fail(w, http.StatusUnauthorized, "Сессия истекла или неверна")
			return
		}
		ctx := context.WithValue(r.Context(), CtxUserID, claims.UserID)
		ctx = context.WithValue(ctx, CtxRole, claims.Role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// OptionalMiddleware — если есть валидный Bearer-токен, кладёт userID/role в context;
// иначе (аноним или невалидный токен) продолжает как anonymous.
// Для публичных маршрутов, где авторизованный видит больше (mine=true, свои неактивные).
func (j *JWT) OptionalMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if strings.HasPrefix(h, "Bearer ") {
			if claims, err := j.ParseAccessToken(strings.TrimPrefix(h, "Bearer ")); err == nil {
				ctx := context.WithValue(r.Context(), CtxUserID, claims.UserID)
				ctx = context.WithValue(ctx, CtxRole, claims.Role)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

// RoleMiddleware — ограничение по ролям (использовать после Middleware).
func RoleMiddleware(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, _ := r.Context().Value(CtxRole).(string)
			for _, allowed := range roles {
				if role == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}
			httpx.Fail(w, http.StatusForbidden, "Недостаточно прав")
		})
	}
}

func UserID(ctx context.Context) string {
	v, _ := ctx.Value(CtxUserID).(string)
	return v
}

func Role(ctx context.Context) string {
	v, _ := ctx.Value(CtxRole).(string)
	return v
}
