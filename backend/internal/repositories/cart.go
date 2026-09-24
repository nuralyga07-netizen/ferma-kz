package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/models"
)

type CartRepo struct {
	pool *pgxpool.Pool
}

func NewCartRepo(pool *pgxpool.Pool) *CartRepo { return &CartRepo{pool: pool} }

const cartSelect = `
	SELECT pr.id, pr.farmer_id, p.full_name, p.city, c.name, pr.name, pr.description,
		pr.price, pr.old_price, pr.unit, pr.quantity_available, pr.images,
		pr.is_active, pr.is_featured, pr.organic, pr.rating, pr.review_count,
		pr.created_at, pr.updated_at, ci.quantity
	FROM cart_items ci
	JOIN products pr ON pr.id = ci.product_id
	JOIN profiles p ON p.id = pr.farmer_id
	LEFT JOIN categories c ON c.id = pr.category_id`

func (r *CartRepo) List(ctx context.Context, customerID string) ([]CartItemRow, error) {
	rows, err := r.pool.Query(ctx,
		cartSelect+` WHERE ci.customer_id=$1 AND pr.is_active
		 ORDER BY ci.created_at DESC`, customerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []CartItemRow
	for rows.Next() {
		var (
			row CartItemRow
			p   models.Product
			cat *string
		)
		if err := rows.Scan(&p.ID, &p.FarmerID, &p.FarmerName, &p.FarmerCity, &cat,
			&p.Name, &p.Description, &p.Price, &p.OldPrice, &p.Unit, &p.QuantityAvailable,
			&p.Images, &p.IsActive, &p.IsFeatured, &p.Organic, &p.Rating, &p.ReviewCount,
			&p.CreatedAt, &p.UpdatedAt, &row.Quantity); err != nil {
			return nil, err
		}
		if cat != nil {
			p.CategoryName = cat
		}
		row.Product = p
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *CartRepo) Upsert(ctx context.Context, customerID, productID string, quantity int) (bool, error) {
	// Проверка товара и остатка
	var available int
	err := r.pool.QueryRow(ctx,
		`SELECT quantity_available FROM products WHERE id=$1 AND is_active`, productID).Scan(&available)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, fmt.Errorf("product not found")
		}
		return false, err
	}
	if quantity > available {
		return false, fmt.Errorf("Недостаточно товара в наличии (доступно: %d)", available)
	}
	_, err = r.pool.Exec(ctx,
		`INSERT INTO cart_items (customer_id, product_id, quantity)
		 VALUES ($1,$2,$3)
		 ON CONFLICT (customer_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
		customerID, productID, quantity)
	return true, err
}

func (r *CartRepo) Remove(ctx context.Context, customerID, productID string) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM cart_items WHERE customer_id=$1 AND product_id=$2`, customerID, productID)
	return err
}

func (r *CartRepo) Clear(ctx context.Context, customerID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM cart_items WHERE customer_id=$1`, customerID)
	return err
}

// CartItemRow — позиция корзины с данными товара.
type CartItemRow struct {
	Product  models.Product
	Quantity int
}
