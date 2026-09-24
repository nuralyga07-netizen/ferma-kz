package services

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgconn"

	"ferma-kz/backend/internal/dto"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/repositories"
)

type ReviewService struct {
	reviews *repositories.ReviewRepo
	orders  *repositories.OrderRepo
}

func NewReviewService(reviews *repositories.ReviewRepo, orders *repositories.OrderRepo) *ReviewService {
	return &ReviewService{reviews: reviews, orders: orders}
}

func (s *ReviewService) ListByProduct(ctx context.Context, productID string, limit, offset int) ([]models.Review, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	return s.reviews.ListByProduct(ctx, productID, limit, offset)
}

// Create — отзыв по доставленному заказу; один отзыв на (order, product).
func (s *ReviewService) Create(ctx context.Context, customerID string, req *dto.ReviewRequest) (*models.Review, error) {
	if err := req.Validate(); err != nil {
		return nil, httpx.BadRequest(err.Error())
	}
	// Заказ должен существовать, быть доставлен и принадлежать покупателю.
	o, err := s.orders.Get(ctx, req.OrderID)
	if err != nil {
		return nil, httpx.NotFound("Заказ не найден")
	}
	if o.CustomerID != customerID {
		return nil, httpx.Forbidden("Это не ваш заказ")
	}
	if o.Status != models.StatusDelivered {
		return nil, httpx.BadRequest("Отзыв можно оставить после доставки заказа")
	}
	already, err := s.reviews.HasReviewed(ctx, req.OrderID, req.ProductID)
	if err != nil {
		return nil, err
	}
	if already {
		return nil, httpx.Conflict("Вы уже оценили этот товар в этом заказе")
	}

	rv, err := s.reviews.Create(ctx, req.OrderID, req.ProductID, customerID, req.Rating, req.Comment)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, httpx.Conflict("Вы уже оценили этот товар в этом заказе")
		}
		return nil, err
	}
	if err := s.reviews.RecalcRating(ctx, req.ProductID); err != nil {
		return nil, err
	}
	return rv, nil
}
