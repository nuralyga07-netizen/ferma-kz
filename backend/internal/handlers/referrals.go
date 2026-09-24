package handlers

import (
	"net/http"

	"ferma-kz/backend/internal/auth"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/services"
)

type ReferralHandler struct {
	referrals *services.ReferralService
}

func NewReferralHandler(svc *services.ReferralService) *ReferralHandler {
	return &ReferralHandler{referrals: svc}
}

// Code — GET /referrals/code (auth)
func (h *ReferralHandler) Code(w http.ResponseWriter, r *http.Request) {
	code, err := h.referrals.MyCode(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, map[string]string{"code": code}, http.StatusOK)
}

// Mine — GET /referrals (auth)
func (h *ReferralHandler) Mine(w http.ResponseWriter, r *http.Request) {
	list, err := h.referrals.Mine(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, list, http.StatusOK)
}
