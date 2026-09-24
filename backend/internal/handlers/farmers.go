package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"ferma-kz/backend/internal/auth"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/repositories"
	"ferma-kz/backend/internal/services"
)

type FarmerHandler struct {
	profiles *repositories.ProfileRepo
	products *services.ProductService
	appSvc   *services.ApplicationService
}

func NewFarmerHandler(
	repo *repositories.ProfileRepo,
	ps *services.ProductService,
	app *services.ApplicationService,
) *FarmerHandler {
	return &FarmerHandler{profiles: repo, products: ps, appSvc: app}
}

// List — GET /farmers (public)
func (h *FarmerHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	if limit <= 0 {
		limit = 50
	}
	rows, err := h.profiles.ListFarmers(r.Context(), q.Get("q"), limit, offset)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, f := range rows {
		out = append(out, map[string]any{
			"id":            f.ID,
			"full_name":     f.FullName,
			"farm_name":     f.FarmName,
			"city":          f.City,
			"bio":           f.Bio,
			"avatar_url":    f.AvatarURL,
			"product_count": f.ProductCount,
			"rating":        f.Rating,
			"review_count":  f.ReviewCount,
		})
	}
	httpx.OK(w, out, http.StatusOK)
}

// Get — GET /farmers/{id} (public): профиль + товары
func (h *FarmerHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	farmer, err := h.profiles.GetFarmer(r.Context(), id)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	f := &repositories.ProductFilter{FarmerID: id, Limit: 100}
	page, err := h.products.List(r.Context(), f)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, map[string]any{
		"id":            farmer.ID,
		"full_name":     farmer.FullName,
		"farm_name":     farmer.FarmName,
		"city":          farmer.City,
		"bio":           farmer.Bio,
		"avatar_url":    farmer.AvatarURL,
		"phone":         farmer.Phone,
		"product_count": farmer.ProductCount,
		"rating":        farmer.Rating,
		"review_count":  farmer.ReviewCount,
		"products":      page.Items,
	}, http.StatusOK)
}

// Apply — POST /farmers/apply (auth)
func (h *FarmerHandler) Apply(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FullName   string  `json:"full_name"`
		Phone      string  `json:"phone"`
		FarmName   string  `json:"farm_name"`
		City       string  `json:"city"`
		Products   string  `json:"products"`
		Experience *string `json:"experience"`
		Bio        *string `json:"bio"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	if req.FullName == "" || req.Phone == "" || req.FarmName == "" || req.City == "" || req.Products == "" {
		httpx.Fail(w, http.StatusBadRequest, "Заполните все обязательные поля")
		return
	}
	userID := auth.UserID(r.Context())
	in := services.ApplyInput{
		FullName:   req.FullName,
		Phone:      req.Phone,
		FarmName:   req.FarmName,
		City:       req.City,
		Products:   req.Products,
		Experience: req.Experience,
		Bio:        req.Bio,
	}
	app, err := h.appSvc.Create(r.Context(), userID, in)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, app, http.StatusCreated)
}

// Mine — GET /farmers/apply/mine (auth): статус своей заявки
func (h *FarmerHandler) Mine(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserID(r.Context())
	app, err := h.appSvc.Mine(r.Context(), userID)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, app, http.StatusOK)
}
