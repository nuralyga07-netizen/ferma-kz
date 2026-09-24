package handlers

import (
	"encoding/json"
	"net/http"

	"ferma-kz/backend/internal/auth"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/services"
)

type OrderHandler struct {
	orders *services.OrderService
}

func NewOrderHandler(svc *services.OrderService) *OrderHandler { return &OrderHandler{orders: svc} }

// Checkout — POST /orders/checkout (auth). Создаёт заказы по корзине.
func (h *OrderHandler) Checkout(w http.ResponseWriter, r *http.Request) {
	var req struct {
		DeliveryMethod  string  `json:"delivery_method"`
		DeliveryAddress *string `json:"delivery_address"`
		Notes           *string `json:"notes"`
		PaymentMethod   string  `json:"payment_method"`
		PromoCode       *string `json:"promo_code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}

	in := &services.CheckoutInput{
		DeliveryMethod:  models.DeliveryMethod(req.DeliveryMethod),
		DeliveryAddress: req.DeliveryAddress,
		Notes:           req.Notes,
		PaymentMethod:   req.PaymentMethod,
		PromoCode:       req.PromoCode,
	}

	// Адрес доставки обязателен при доставке курьером
	if in.DeliveryMethod == models.MethodDelivery && (req.DeliveryAddress == nil || *req.DeliveryAddress == "") {
		httpx.Fail(w, http.StatusBadRequest, "Укажите адрес доставки")
		return
	}

	userID := auth.UserID(r.Context())
	created, err := h.orders.Checkout(r.Context(), userID, in)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, map[string]any{"orders": created}, http.StatusCreated)
}

// List — GET /orders?status= (auth): свои / для фермера / для админа.
func (h *OrderHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserID(r.Context())
	role := models.Role(auth.Role(r.Context()))
	status := r.URL.Query().Get("status")
	list, err := h.orders.List(r.Context(), userID, role, status)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, list, http.StatusOK)
}

// Get — GET /orders/{id} (auth): с проверкой участия.
func (h *OrderHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserID(r.Context())
	role := models.Role(auth.Role(r.Context()))
	o, err := h.orders.Get(r.Context(), r.PathValue("id"), userID, role)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, o, http.StatusOK)
}

// UpdateStatus — PATCH /orders/{id}/status {status} (auth):
// клиент отменяет pending; фермер двигает свой заказ; админ — любые.
func (h *OrderHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Status == "" {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	userID := auth.UserID(r.Context())
	role := models.Role(auth.Role(r.Context()))
	o, err := h.orders.UpdateStatus(r.Context(), r.PathValue("id"), userID, role, models.OrderStatus(req.Status))
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, o, http.StatusOK)
}
