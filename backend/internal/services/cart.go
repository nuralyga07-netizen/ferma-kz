package services

import (
	"context"
	"strings"

	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/repositories"
)

type CartService struct {
	cart *repositories.CartRepo
}

func NewCartService(cart *repositories.CartRepo) *CartService { return &CartService{cart: cart} }

func (s *CartService) List(ctx context.Context, customerID string) (*models.Cart, error) {
	rows, err := s.cart.List(ctx, customerID)
	if err != nil {
		return nil, err
	}
	cart := &models.Cart{Items: make([]models.CartItem, 0, len(rows))}
	for _, r := range rows {
		total := round2(float64(r.Quantity) * r.Product.Price)
		cart.Items = append(cart.Items, models.CartItem{
			Product:  r.Product,
			Quantity: r.Quantity,
			Total:    total,
		})
		cart.Subtotal = round2(cart.Subtotal + total)
	}
	return cart, nil
}

// Add — добавить/обновить количество (1..100).
func (s *CartService) Add(ctx context.Context, customerID, productID string, quantity int) (*models.Cart, error) {
	if quantity < 1 || quantity > 100 {
		return nil, httpx.BadRequest("Количество должно быть от 1 до 100")
	}
	ok, err := s.cart.Upsert(ctx, customerID, productID, quantity)
	if err != nil {
		msg := err.Error()
		if msg == "product not found" {
			return nil, httpx.NotFound("Товар не найден или недоступен")
		}
		if strings.HasPrefix(msg, "Недостаточно") {
			return nil, httpx.BadRequest(msg)
		}
		return nil, err
	}
	_ = ok
	return s.List(ctx, customerID)
}

// SetQuantity — изменить количество позиции.
func (s *CartService) SetQuantity(ctx context.Context, customerID, productID string, quantity int) (*models.Cart, error) {
	return s.Add(ctx, customerID, productID, quantity)
}

func (s *CartService) Remove(ctx context.Context, customerID, productID string) (*models.Cart, error) {
	if err := s.cart.Remove(ctx, customerID, productID); err != nil {
		return nil, err
	}
	return s.List(ctx, customerID)
}

func (s *CartService) Clear(ctx context.Context, customerID string) error {
	return s.cart.Clear(ctx, customerID)
}
