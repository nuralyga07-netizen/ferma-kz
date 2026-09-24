package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"ferma-kz/backend/internal/auth"
	"ferma-kz/backend/internal/dto"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/services"
)

type ReviewHandler struct {
	reviews *services.ReviewService
}

func NewReviewHandler(svc *services.ReviewService) *ReviewHandler {
	return &ReviewHandler{reviews: svc}
}

// List — GET /products/{id}/reviews (public)
func (h *ReviewHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	list, err := h.reviews.ListByProduct(r.Context(), r.PathValue("id"), limit, offset)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, list, http.StatusOK)
}

// Create — POST /orders/{id}/reviews {product_id, rating, comment} (auth)
func (h *ReviewHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.ReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	req.OrderID = r.PathValue("id")
	rv, err := h.reviews.Create(r.Context(), auth.UserID(r.Context()), &req)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, rv, http.StatusCreated)
}
