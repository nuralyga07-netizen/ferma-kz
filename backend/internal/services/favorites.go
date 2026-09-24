package services

import (
	"context"

	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/repositories"
)

type FavoriteService struct {
	fav      *repositories.FavoriteRepo
	products *repositories.ProductRepo
}

func NewFavoriteService(fav *repositories.FavoriteRepo, products *repositories.ProductRepo) *FavoriteService {
	return &FavoriteService{fav: fav, products: products}
}

func (s *FavoriteService) List(ctx context.Context, customerID string) ([]models.Product, error) {
	items, err := s.fav.List(ctx, customerID)
	if err != nil {
		return nil, err
	}
	if items == nil {
		items = []models.Product{}
	}
	return items, nil
}

// Add — проверить существование товара и добавить в избранное.
func (s *FavoriteService) Add(ctx context.Context, customerID, productID string) error {
	p, err := s.products.Get(ctx, productID, "")
	if err != nil {
		return httpx.NotFound("Товар не найден")
	}
	_ = p
	return s.fav.Add(ctx, customerID, productID)
}

func (s *FavoriteService) Remove(ctx context.Context, customerID, productID string) error {
	return s.fav.Remove(ctx, customerID, productID)
}
