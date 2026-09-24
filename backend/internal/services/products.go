package services

import (
	"context"

	"ferma-kz/backend/internal/dto"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/repositories"
)

type ProductService struct {
	repo *repositories.ProductRepo
}

func NewProductService(repo *repositories.ProductRepo) *ProductService {
	return &ProductService{repo: repo}
}

type Page struct {
	Items []models.Product `json:"items"`
	Total int              `json:"total"`
	Page  int              `json:"page"`
	Limit int              `json:"limit"`
	Pages int              `json:"pages"`
}

func (s *ProductService) List(ctx context.Context, f *repositories.ProductFilter) (*Page, error) {
	items, total, err := s.repo.List(ctx, f)
	if err != nil {
		return nil, err
	}
	if items == nil {
		items = []models.Product{}
	}
	pages := 0
	if total > 0 {
		pages = total / f.Limit
		if total%f.Limit > 0 {
			pages++
		}
	}
	return &Page{Items: items, Total: total, Page: f.Page, Limit: f.Limit, Pages: pages}, nil
}

func (s *ProductService) Get(ctx context.Context, id, viewerID string) (*models.Product, error) {
	p, err := s.repo.Get(ctx, id, viewerID)
	if err != nil {
		return nil, httpx.NotFound("Товар не найден")
	}
	return &p, nil
}

func (s *ProductService) Categories(ctx context.Context) ([]models.Category, error) {
	cats, err := s.repo.ListCategories(ctx)
	if err != nil {
		return nil, err
	}
	return cats, nil
}

// Create проверяет роль farmer и права.
func (s *ProductService) Create(ctx context.Context, farmerID string, in *dto.ProductRequest) (*models.Product, error) {
	p, err := s.repo.Create(ctx, farmerID, toInput(in))
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *ProductService) Update(ctx context.Context, productID, farmerID string, in *dto.ProductRequest) (*models.Product, error) {
	existing, err := s.repo.Get(ctx, productID, farmerID)
	if err != nil {
		return nil, httpx.NotFound("Товар не найден")
	}
	if existing.FarmerID != farmerID {
		return nil, httpx.Forbidden("Нет прав на этот товар")
	}
	p, err := s.repo.Update(ctx, productID, toInput(in))
	if err != nil {
		if err.Error() == "product not found" {
			return nil, httpx.NotFound("Товар не найден")
		}
		return nil, err
	}
	return &p, nil
}

func (s *ProductService) Deactivate(ctx context.Context, productID, farmerID string) error {
	existing, err := s.repo.Get(ctx, productID, farmerID)
	if err != nil {
		return httpx.NotFound("Товар не найден")
	}
	if existing.FarmerID != farmerID {
		return httpx.Forbidden("Нет прав на этот товар")
	}
	return s.repo.Deactivate(ctx, productID)
}

func toInput(in *dto.ProductRequest) *repositories.ProductInput {
	return &repositories.ProductInput{
		CategoryID:        in.CategoryID,
		Name:              in.Name,
		Description:       in.Description,
		Price:             in.Price,
		OldPrice:          in.OldPrice,
		Unit:              in.Unit,
		QuantityAvailable: in.QuantityAvailable,
		Images:            in.Images,
		IsFeatured:        in.IsFeatured,
		Organic:           in.Organic,
	}
}
