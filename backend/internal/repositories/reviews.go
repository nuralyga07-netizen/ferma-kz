package repositories

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/models"
)

type ReviewRepo struct {
	pool *pgxpool.Pool
}

func NewReviewRepo(pool *pgxpool.Pool) *ReviewRepo { return &ReviewRepo{pool: pool} }

const reviewSelect = `
	SELECT rv.id, rv.order_id, rv.product_id, rv.customer_id, cu.full_name,
		rv.rating, rv.comment, rv.created_at
	FROM reviews rv
	JOIN profiles cu ON cu.id = rv.customer_id`

func (r *ReviewRepo) ListByProduct(ctx context.Context, productID string, limit, offset int) ([]models.Review, error) {
	rows, err := r.pool.Query(ctx,
		reviewSelect+` WHERE rv.product_id=$1 ORDER BY rv.created_at DESC LIMIT $2 OFFSET $3`,
		productID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Review
	for rows.Next() {
		var rv models.Review
		if err := rows.Scan(&rv.ID, &rv.OrderID, &rv.ProductID, &rv.CustomerID, &rv.CustomerName,
			&rv.Rating, &rv.Comment, &rv.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, rv)
	}
	return out, rows.Err()
}

// Create — отзыв по доставленному заказу (уникальность (order, product) на уровне БД).
func (r *ReviewRepo) Create(ctx context.Context, orderID, productID, customerID string, rating int, comment *string) (*models.Review, error) {
	id, _ := uuid.NewRandom()
	var rv models.Review
	err := r.pool.QueryRow(ctx,
		`INSERT INTO reviews (id, order_id, product_id, customer_id, rating, comment)
		 VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, order_id, product_id, customer_id, rating, comment, created_at`,
		id.String(), orderID, productID, customerID, rating, comment,
	).Scan(&rv.ID, &rv.OrderID, &rv.ProductID, &rv.CustomerID, &rv.Rating, &rv.Comment, &rv.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &rv, nil
}

// HasReviewed — оставлял ли клиент отзыв по этому заказу и товару.
func (r *ReviewRepo) HasReviewed(ctx context.Context, orderID, productID string) (bool, error) {
	var b bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM reviews WHERE order_id=$1 AND product_id=$2)`,
		orderID, productID).Scan(&b)
	return b, err
}

// RecalcRating — среднее по товару.
func (r *ReviewRepo) RecalcRating(ctx context.Context, productID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE products SET
			rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id=$1), 0),
			review_count = (SELECT COUNT(*)::int FROM reviews WHERE product_id=$1),
			updated_at=now()
		 WHERE id=$1`, productID)
	return err
}
