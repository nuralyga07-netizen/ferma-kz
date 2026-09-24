package repositories

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/models"
)

type FavoriteRepo struct {
	pool *pgxpool.Pool
}

func NewFavoriteRepo(pool *pgxpool.Pool) *FavoriteRepo { return &FavoriteRepo{pool: pool} }

func (r *FavoriteRepo) List(ctx context.Context, customerID string) ([]models.Product, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT pr.id, pr.farmer_id, p.full_name, p.city, c.name, pr.name, pr.description,
			pr.price, pr.old_price, pr.unit, pr.quantity_available, pr.images,
			pr.is_active, pr.is_featured, pr.organic, pr.rating, pr.review_count,
			pr.created_at, pr.updated_at
		FROM favorites f
		JOIN products pr ON pr.id = f.product_id
		JOIN profiles p ON p.id = pr.farmer_id
		LEFT JOIN categories c ON c.id = pr.category_id
		WHERE f.customer_id=$1 AND pr.is_active
		ORDER BY f.created_at DESC`, customerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Product
	for rows.Next() {
		p, err := scanProduct(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r *FavoriteRepo) Add(ctx context.Context, customerID, productID string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO favorites (customer_id, product_id) VALUES ($1,$2)
		 ON CONFLICT (customer_id, product_id) DO NOTHING`, customerID, productID)
	return err
}

func (r *FavoriteRepo) Remove(ctx context.Context, customerID, productID string) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM favorites WHERE customer_id=$1 AND product_id=$2`, customerID, productID)
	return err
}
