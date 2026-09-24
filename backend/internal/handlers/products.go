package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"ferma-kz/backend/internal/auth"
	"ferma-kz/backend/internal/dto"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/repositories"
	"ferma-kz/backend/internal/services"
)

type ProductHandler struct {
	products *services.ProductService
}

func NewProductHandler(svc *services.ProductService) *ProductHandler {
	return &ProductHandler{products: svc}
}

// List — GET /products (public)
func (h *ProductHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	f := &repositories.ProductFilter{
		Category: q.Get("category"),
		FarmerID: q.Get("farmer"),
		Query:    q.Get("q"),
		Sort:     q.Get("sort"),
	}
	if v, err := strconv.ParseFloat(q.Get("min_price"), 64); err == nil && v > 0 {
		f.MinPrice = &v
	}
	if v, err := strconv.ParseFloat(q.Get("max_price"), 64); err == nil && v > 0 {
		f.MaxPrice = &v
	}
	if q.Get("organic") == "true" {
		b := true
		f.Organic = &b
	}
	if q.Get("featured") == "true" {
		b := true
		f.Featured = &b
	}
	if v, err := strconv.Atoi(q.Get("page")); err == nil {
		f.Page = v
	}
	if v, err := strconv.Atoi(q.Get("limit")); err == nil {
		f.Limit = v
	}

	userID := auth.UserID(r.Context())
	role, _ := r.Context().Value(auth.CtxRole).(string)

	// mine=true — только свои товары (кабинет фермера, включая неактивные)
	if q.Get("mine") == "true" && userID != "" {
		f.FarmerID = userID
	}

	// Владелец видит свои неактивные товары
	if role == "farmer" {
		f.IncludeInactiveFarmer = userID
	}

	page, err := h.products.List(r.Context(), f)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, page, http.StatusOK)
}

// Get — GET /products/{id} (public)
func (h *ProductHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	viewerID := ""
	if role, _ := r.Context().Value(auth.CtxRole).(string); role == "farmer" {
		viewerID = auth.UserID(r.Context())
	}
	p, err := h.products.Get(r.Context(), id, viewerID)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, p, http.StatusOK)
}

// Create — POST /products (farmer)
func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.ProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	if err := req.Validate(); err != nil {
		httpx.Fail(w, http.StatusBadRequest, err.Error())
		return
	}
	farmerID := auth.UserID(r.Context())
	p, err := h.products.Create(r.Context(), farmerID, &req)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, p, http.StatusCreated)
}

// Update — PATCH /products/{id} (владелец)
func (h *ProductHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req dto.ProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	if err := req.Validate(); err != nil {
		httpx.Fail(w, http.StatusBadRequest, err.Error())
		return
	}
	farmerID := auth.UserID(r.Context())
	p, err := h.products.Update(r.Context(), id, farmerID, &req)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, p, http.StatusOK)
}

// Deactivate — DELETE /products/{id} (владелец)
func (h *ProductHandler) Deactivate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	farmerID := auth.UserID(r.Context())
	if err := h.products.Deactivate(r.Context(), id, farmerID); err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OKNoData(w, http.StatusOK)
}

// Categories — GET /categories (public)
func (h *ProductHandler) Categories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.products.Categories(r.Context())
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, cats, http.StatusOK)
}
