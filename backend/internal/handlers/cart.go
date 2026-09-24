package handlers

import (
	"encoding/json"
	"net/http"

	"ferma-kz/backend/internal/auth"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/services"
)

type CartHandler struct {
	cart *services.CartService
}

func NewCartHandler(svc *services.CartService) *CartHandler { return &CartHandler{cart: svc} }

// List — GET /cart (auth)
func (h *CartHandler) List(w http.ResponseWriter, r *http.Request) {
	cart, err := h.cart.List(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, cart, http.StatusOK)
}

// Add — POST /cart {product_id, quantity} (auth)
func (h *CartHandler) Add(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProductID string `json:"product_id"`
		Quantity  int    `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ProductID == "" {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	cart, err := h.cart.Add(r.Context(), auth.UserID(r.Context()), req.ProductID, req.Quantity)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, cart, http.StatusOK)
}

// SetQuantity — PATCH /cart/{productId} {quantity} (auth)
func (h *CartHandler) SetQuantity(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Quantity int `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	cart, err := h.cart.SetQuantity(r.Context(), auth.UserID(r.Context()), r.PathValue("productId"), req.Quantity)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, cart, http.StatusOK)
}

// Remove — DELETE /cart/{productId} (auth)
func (h *CartHandler) Remove(w http.ResponseWriter, r *http.Request) {
	cart, err := h.cart.Remove(r.Context(), auth.UserID(r.Context()), r.PathValue("productId"))
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, cart, http.StatusOK)
}
