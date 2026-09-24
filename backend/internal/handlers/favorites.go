package handlers

import (
	"net/http"

	"ferma-kz/backend/internal/auth"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/services"
)

type FavoriteHandler struct {
	fav *services.FavoriteService
}

func NewFavoriteHandler(svc *services.FavoriteService) *FavoriteHandler {
	return &FavoriteHandler{fav: svc}
}

// List — GET /favorites (auth)
func (h *FavoriteHandler) List(w http.ResponseWriter, r *http.Request) {
	list, err := h.fav.List(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, list, http.StatusOK)
}

// Add — POST /favorites/{productId} (auth)
func (h *FavoriteHandler) Add(w http.ResponseWriter, r *http.Request) {
	if err := h.fav.Add(r.Context(), auth.UserID(r.Context()), r.PathValue("productId")); err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OKNoData(w, http.StatusCreated)
}

// Remove — DELETE /favorites/{productId} (auth)
func (h *FavoriteHandler) Remove(w http.ResponseWriter, r *http.Request) {
	if err := h.fav.Remove(r.Context(), auth.UserID(r.Context()), r.PathValue("productId")); err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OKNoData(w, http.StatusOK)
}
