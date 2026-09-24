package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"ferma-kz/backend/internal/auth"
	"ferma-kz/backend/internal/config"
	"ferma-kz/backend/internal/dto"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/services"
)

const refreshCookie = "ferma_refresh"

type AuthHandler struct {
	auth           *services.AuthService
	cfg            *config.Config
	profileService *services.ProfileService
}

func NewAuthHandler(svc *services.AuthService, cfg *config.Config, ps *services.ProfileService) *AuthHandler {
	return &AuthHandler{auth: svc, cfg: cfg, profileService: ps}
}

func setRefreshCookie(w http.ResponseWriter, token string, ttl time.Duration) {
	http.SetCookie(w, &http.Cookie{
		Name:     refreshCookie,
		Value:    token,
		Path:     "/api/v1/auth",
		MaxAge:   int(ttl.Seconds()),
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	if err := req.Validate(); err != nil {
		httpx.Fail(w, http.StatusBadRequest, err.Error())
		return
	}

	in := &services.RegisterInput{
		Email:          req.Email,
		Password:       req.Password,
		FullName:       strings.TrimSpace(req.FullName),
		Role:           models.Role(req.Role),
		ReferralReward: float64(h.cfg.ReferralReward),
	}
	if req.Phone != "" {
		in.Phone = &req.Phone
	}
	if req.ReferralCode != "" {
		in.ReferralCode = &req.ReferralCode
	}

	res, err := h.auth.Register(r.Context(), in)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}

	setRefreshCookie(w, res.RefreshToken, h.cfg.RefreshTTL)
	httpx.OK(w, map[string]any{
		"access_token": res.AccessToken,
		"user":         services.PublicView(res.Profile),
	}, http.StatusCreated)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	if err := req.Validate(); err != nil {
		httpx.Fail(w, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.auth.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}

	setRefreshCookie(w, res.RefreshToken, h.cfg.RefreshTTL)
	httpx.OK(w, map[string]any{
		"access_token": res.AccessToken,
		"user":         services.PublicView(res.Profile),
	}, http.StatusOK)
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(refreshCookie)
	if err != nil || cookie.Value == "" {
		httpx.Fail(w, http.StatusUnauthorized, "Сессия истекла, войдите снова")
		return
	}

	// Cookie содержит сам opaque-токен (без userID) — сервис найдёт владельца по хэшу.
	res, err := h.auth.RefreshByToken(r.Context(), cookie.Value)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}

	setRefreshCookie(w, res.RefreshToken, h.cfg.RefreshTTL)
	httpx.OK(w, map[string]any{
		"access_token": res.AccessToken,
		"user":         services.PublicView(res.Profile),
	}, http.StatusOK)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserID(r.Context())
	if cookie, err := r.Cookie(refreshCookie); err == nil {
		_ = h.auth.Logout(r.Context(), userID, cookie.Value)
	}
	http.SetCookie(w, &http.Cookie{Name: refreshCookie, Value: "", Path: "/api/v1/auth", MaxAge: -1})
	httpx.OKNoData(w, http.StatusOK)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserID(r.Context())
	profile, err := h.profileService.GetByID(r.Context(), userID)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, services.PublicView(profile), http.StatusOK)
}

func (h *AuthHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserID(r.Context())
	var req dto.ProfileUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	profile, err := h.profileService.Update(r.Context(), userID, &req)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, services.PublicView(profile), http.StatusOK)
}

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	httpx.OK(w, map[string]string{"message": "Функция восстановления пароля скоро будет доступна"}, http.StatusOK)
}
