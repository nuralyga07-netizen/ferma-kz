package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/repositories"
	"ferma-kz/backend/internal/services"
)

type AdminHandler struct {
	profiles     *repositories.ProfileRepo
	orders       *repositories.OrderRepo
	applications *services.ApplicationService
	promos       *services.PromoService
}

func NewAdminHandler(
	profiles *repositories.ProfileRepo,
	orders *repositories.OrderRepo,
	app *services.ApplicationService,
	promos *services.PromoService,
) *AdminHandler {
	return &AdminHandler{profiles: profiles, orders: orders, applications: app, promos: promos}
}

// Stats — GET /admin/stats
func (h *AdminHandler) Stats(w http.ResponseWriter, r *http.Request) {
	st, err := h.orders.AdminStats(r.Context())
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, st, http.StatusOK)
}

// ListUsers — GET /admin/users?q=&role=
func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	if limit <= 0 {
		limit = 50
	}
	users, err := h.profiles.ListUsers(r.Context(), q.Get("q"), q.Get("role"), limit, offset)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, users, http.StatusOK)
}

// SetActive — PATCH /admin/users/{id}/status {is_active}
func (h *AdminHandler) SetActive(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	if err := h.profiles.SetActive(r.Context(), r.PathValue("id"), req.IsActive); err != nil {
		if errors.Is(err, repositories.ErrAdminCannotBlock) {
			httpx.Fail(w, http.StatusBadRequest, "Нельзя заблокировать администратора")
			return
		}
		httpx.HandleError(w, err)
		return
	}
	httpx.OKNoData(w, http.StatusOK)
}

// ListApplications — GET /admin/applications?status=
func (h *AdminHandler) ListApplications(w http.ResponseWriter, r *http.Request) {
	list, err := h.applications.List(r.Context(), r.URL.Query().Get("status"))
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, list, http.StatusOK)
}

// ReviewApplication — POST /admin/applications/{id}/review {status: approved|rejected}
func (h *AdminHandler) ReviewApplication(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	status := models.AppStatus(req.Status)
	if status != models.AppApproved && status != models.AppRejected {
		httpx.Fail(w, http.StatusBadRequest, "Статус должен быть 'approved' или 'rejected'")
		return
	}
	app, err := h.applications.Review(r.Context(), r.PathValue("id"), status)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, app, http.StatusOK)
}

// ListPromos — GET /admin/promotions
func (h *AdminHandler) ListPromos(w http.ResponseWriter, r *http.Request) {
	list, err := h.promos.List(r.Context())
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, list, http.StatusOK)
}

// CreatePromo — POST /admin/promotions
func (h *AdminHandler) CreatePromo(w http.ResponseWriter, r *http.Request) {
	in, msg := decodePromoInput(r)
	if msg != "" {
		httpx.Fail(w, http.StatusBadRequest, msg)
		return
	}
	p, err := h.promos.Create(r.Context(), in)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, p, http.StatusCreated)
}

// UpdatePromo — PATCH /admin/promotions/{id}
func (h *AdminHandler) UpdatePromo(w http.ResponseWriter, r *http.Request) {
	in, msg := decodePromoInput(r)
	if msg != "" {
		httpx.Fail(w, http.StatusBadRequest, msg)
		return
	}
	p, err := h.promos.Update(r.Context(), r.PathValue("id"), in)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, p, http.StatusOK)
}

// DeletePromo — DELETE /admin/promotions/{id}
func (h *AdminHandler) DeletePromo(w http.ResponseWriter, r *http.Request) {
	if err := h.promos.Delete(r.Context(), r.PathValue("id")); err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OKNoData(w, http.StatusOK)
}

// decodePromoInput парсит тело запроса промокода; msg — текст ошибки ("" если OK).
func decodePromoInput(r *http.Request) (*services.PromotionInput, string) {
	var body struct {
		Code            string  `json:"code"`
		Description     *string `json:"description"`
		DiscountPercent int     `json:"discount_percent"`
		MinAmount       float64 `json:"min_amount"`
		MaxUses         int     `json:"max_uses"`
		ExpiresAt       *string `json:"expires_at"` // RFC3339
		IsActive        *bool   `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		return nil, "Некорректный запрос"
	}
	if body.Code == "" {
		return nil, "Код промокода обязателен"
	}
	in := &services.PromotionInput{
		Code:            body.Code,
		Description:     body.Description,
		DiscountPercent: body.DiscountPercent,
		MinAmount:       body.MinAmount,
		MaxUses:         body.MaxUses,
		IsActive:        body.IsActive,
	}
	if body.ExpiresAt != nil {
		t, err := time.Parse(time.RFC3339, *body.ExpiresAt)
		if err != nil {
			return nil, "Некорректная дата expires_at (ожидается RFC3339)"
		}
		in.ExpiresAt = &t
	}
	return in, ""
}
