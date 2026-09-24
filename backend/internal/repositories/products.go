package repositories

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/models"
)

type ProductRepo struct {
	pool *pgxpool.Pool
}

func NewProductRepo(pool *pgxpool.Pool) *ProductRepo { return &ProductRepo{pool: pool} }

type ProductFilter struct {
	Category              string
	FarmerID              string
	Query                 string
	MinPrice              *float64
	MaxPrice              *float64
	Organic               *bool
	Featured              *bool
	Sort                  string // new | price_asc | price_desc | rating
	Page                  int
	Limit                 int
	IncludeInactiveFarmer string // uuid владельца (видит свои неактивные)
}

func (f *ProductFilter) Normalize() {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 || f.Limit > 100 {
		f.Limit = 20
	}
	if f.Sort == "" {
		f.Sort = "new"
	}
}

const productSelect = `
	SELECT pr.id, pr.farmer_id, p.full_name, p.city, c.name, pr.name, pr.description,
		pr.price, pr.old_price, pr.unit, pr.quantity_available, pr.images,
		pr.is_active, pr.is_featured, pr.organic, pr.rating, pr.review_count,
		pr.created_at, pr.updated_at
	FROM products pr
	JOIN profiles p ON p.id = pr.farmer_id
	LEFT JOIN categories c ON c.id = pr.category_id`

func scanProduct(row interface{ Scan(dest ...any) error }) (models.Product, error) {
	var (
		p   models.Product
		cat *string
	)
	err := row.Scan(&p.ID, &p.FarmerID, &p.FarmerName, &p.FarmerCity, &cat,
		&p.Name, &p.Description, &p.Price, &p.OldPrice, &p.Unit, &p.QuantityAvailable,
		&p.Images, &p.IsActive, &p.IsFeatured, &p.Organic, &p.Rating, &p.ReviewCount,
		&p.CreatedAt, &p.UpdatedAt)
	if cat != nil {
		p.CategoryID = cat
		p.CategoryName = cat
	}
	return p, err
}

// List возвращает товары с пагинацией.
func (r *ProductRepo) List(ctx context.Context, f *ProductFilter) ([]models.Product, int, error) {
	f.Normalize()

	// Пустая строка в сравнении с uuid даёт 22P02 — передаём NULL.
	var ownerArg any
	if f.IncludeInactiveFarmer != "" {
		ownerArg = f.IncludeInactiveFarmer
	}
	where := []string{`(pr.is_active = true OR pr.farmer_id = $1)`}
	args := []any{ownerArg}
	addArg := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	if f.Category != "" {
		where = append(where, "c.slug = "+addArg(f.Category))
	}
	if f.FarmerID != "" {
		where = append(where, "pr.farmer_id = "+addArg(f.FarmerID))
	}
	if f.Query != "" {
		like := "%" + f.Query + "%"
		where = append(where, "(pr.name ILIKE "+addArg(like)+` OR p.full_name ILIKE `+addArg(like)+`)`)
	}
	if f.MinPrice != nil {
		where = append(where, "pr.price >= "+addArg(*f.MinPrice))
	}
	if f.MaxPrice != nil {
		where = append(where, "pr.price <= "+addArg(*f.MaxPrice))
	}
	if f.Organic != nil && *f.Organic {
		where = append(where, "pr.organic = true")
	}
	if f.Featured != nil && *f.Featured {
		where = append(where, "pr.is_featured = true")
	}

	order := "pr.created_at DESC"
	switch f.Sort {
	case "price_asc":
		order = "pr.price ASC"
	case "price_desc":
		order = "pr.price DESC"
	case "rating":
		order = "pr.rating DESC, pr.review_count DESC"
	}

	var total int
	countQuery := "SELECT COUNT(*) FROM products pr " +
		"JOIN profiles p ON p.id = pr.farmer_id " +
		"LEFT JOIN categories c ON c.id = pr.category_id WHERE " + strings.Join(where, " AND ")
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (f.Page - 1) * f.Limit
	limitIdx := addArg(f.Limit)
	offsetIdx := addArg(offset)

	rows, err := r.pool.Query(ctx,
		productSelect+" WHERE "+strings.Join(where, " AND ")+
			" ORDER BY "+order+" LIMIT "+limitIdx+" OFFSET "+offsetIdx, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var out []models.Product
	for rows.Next() {
		p, err := scanProduct(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, p)
	}
	return out, total, rows.Err()
}

func (r *ProductRepo) Get(ctx context.Context, id, viewerFarmerID string) (models.Product, error) {
	var viewerArg any
	if viewerFarmerID != "" {
		viewerArg = viewerFarmerID
	}
	p, err := scanProduct(r.pool.QueryRow(ctx,
		productSelect+` WHERE pr.id=$1 AND (pr.is_active = true OR pr.farmer_id = $2)`,
		id, viewerArg))
	if errors.Is(err, pgx.ErrNoRows) {
		return p, fmt.Errorf("product not found")
	}
	return p, err
}

type ProductInput struct {
	CategoryID        *string
	Name              string
	Description       *string
	Price             float64
	OldPrice          *float64
	Unit              string
	QuantityAvailable int
	Images            []string
	IsFeatured        bool
	Organic           bool
}

func (r *ProductRepo) Create(ctx context.Context, farmerID string, in *ProductInput) (models.Product, error) {
	id, _ := uuid.NewRandom()
	images := in.Images
	if images == nil {
		images = []string{}
	}
	p := models.Product{ID: id.String(), FarmerID: farmerID}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO products (id, farmer_id, category_id, name, description, price, old_price, unit,
			quantity_available, images, is_featured, organic)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
		id, farmerID, in.CategoryID, in.Name, in.Description, in.Price, in.OldPrice,
		in.Unit, in.QuantityAvailable, images, in.IsFeatured, in.Organic,
	).Scan(&p.ID)
	if err != nil {
		return models.Product{}, err
	}
	return r.Get(ctx, p.ID, farmerID)
}

// Update — полное обновление (клиент всегда шлёт полный список images).
func (r *ProductRepo) Update(ctx context.Context, id string, in *ProductInput) (models.Product, error) {
	res, err := r.pool.Exec(ctx,
		`UPDATE products SET category_id=$1, name=$2, description=$3, price=$4, old_price=$5, unit=$6,
			quantity_available=$7, images=$8, is_featured=$9, organic=$10, updated_at=now()
		 WHERE id=$11`,
		in.CategoryID, in.Name, in.Description, in.Price, in.OldPrice, in.Unit,
		in.QuantityAvailable, in.Images, in.IsFeatured, in.Organic, id)
	if err != nil {
		return models.Product{}, err
	}
	if res.RowsAffected() == 0 {
		return models.Product{}, fmt.Errorf("product not found")
	}
	return r.Get(ctx, id, "")
}

func (r *ProductRepo) Deactivate(ctx context.Context, id string) error {
	res, err := r.pool.Exec(ctx, `UPDATE products SET is_active=false, updated_at=now() WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("product not found")
	}
	return nil
}

// DecrementStock уменьшает остаток (только если достаточно).
func (r *ProductRepo) DecrementStock(ctx context.Context, productID string, qty int) (bool, error) {
	res, err := r.pool.Exec(ctx,
		`UPDATE products SET quantity_available = quantity_available - $2
		 WHERE id=$1 AND quantity_available >= $2`, productID, qty)
	if err != nil {
		return false, err
	}
	return res.RowsAffected() > 0, nil
}

func (r *ProductRepo) RecalculateRating(ctx context.Context, productID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE products SET
			rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id=$1), 0),
			review_count = (SELECT COUNT(*)::int FROM reviews WHERE product_id=$1)
		 WHERE id=$1`, productID)
	return err
}

func (r *ProductRepo) ListCategories(ctx context.Context) ([]models.Category, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, slug, icon, description, image_url, sort_order, created_at FROM categories ORDER BY sort_order`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Category
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Icon, &c.Description, &c.ImageURL, &c.SortOrder, &c.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *ProductRepo) CountByFarmer(ctx context.Context, farmerID string) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*)::int FROM products WHERE farmer_id=$1 AND is_active`, farmerID).Scan(&n)
	return n, err
}
