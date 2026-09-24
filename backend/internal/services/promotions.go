package services

import (
	"context"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
)

type PromoService struct {
	pool *pgxpool.Pool
}

func NewPromoService(pool *pgxpool.Pool) *PromoService { return &PromoService{pool: pool} }

// Validate проверяет промокод и возвращает скидку в ₸.
func (s *PromoService) Validate(ctx context.Context, code string, subtotal float64) (*models.Promotion, error) {
	if code == "" {
		return nil, httpx.BadRequest("Укажите промокод")
	}
	var p models.Promotion
	err := s.pool.QueryRow(ctx,
		`SELECT id, code, description, discount_percent, min_amount, max_uses, current_uses, expires_at, is_active, created_at
		 FROM promotions WHERE code=$1`, code).
		Scan(&p.ID, &p.Code, &p.Description, &p.DiscountPercent, &p.MinAmount,
			&p.MaxUses, &p.CurrentUses, &p.ExpiresAt, &p.IsActive, &p.CreatedAt)
	if err != nil {
		return nil, httpx.BadRequest("Промокод не найден")
	}
	if !p.IsActive {
		return nil, httpx.BadRequest("Промокод неактивен")
	}
	if p.ExpiresAt != nil && p.ExpiresAt.Before(time.Now()) {
		return nil, httpx.BadRequest("Промокод истёк")
	}
	if p.CurrentUses >= p.MaxUses {
		return nil, httpx.BadRequest("Промокод исчерпан")
	}
	if subtotal < p.MinAmount {
		return nil, httpx.BadRequest("Промокод действует от суммы " + strconv.FormatInt(int64(p.MinAmount), 10) + " ₸")
	}
	return &p, nil
}

// MarkUsed увеличивает счётчик использований.
func (s *PromoService) MarkUsed(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE promotions SET current_uses = current_uses + 1 WHERE id=$1`, id)
	return err
}

func (s *PromoService) List(ctx context.Context) ([]models.Promotion, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, code, description, discount_percent, min_amount, max_uses, current_uses, expires_at, is_active, created_at
		 FROM promotions ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Promotion
	for rows.Next() {
		var p models.Promotion
		if err := rows.Scan(&p.ID, &p.Code, &p.Description, &p.DiscountPercent, &p.MinAmount,
			&p.MaxUses, &p.CurrentUses, &p.ExpiresAt, &p.IsActive, &p.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

type PromotionInput struct {
	Code            string
	Description     *string
	DiscountPercent int
	MinAmount       float64
	MaxUses         int
	ExpiresAt       *time.Time
	IsActive        *bool
}

func (s *PromoService) Create(ctx context.Context, in *PromotionInput) (*models.Promotion, error) {
	if in.DiscountPercent < 1 || in.DiscountPercent > 90 {
		return nil, httpx.BadRequest("Процент скидки должен быть от 1 до 90")
	}
	if in.MaxUses <= 0 {
		in.MaxUses = 100
	}
	active := true
	if in.IsActive != nil {
		active = *in.IsActive
	}
	var p models.Promotion
	err := s.pool.QueryRow(ctx,
		`INSERT INTO promotions (code, description, discount_percent, min_amount, max_uses, expires_at, is_active)
		 VALUES ($1,$2,$3,$4,$5,$6,$7)
		 RETURNING id, code, description, discount_percent, min_amount, max_uses, current_uses, expires_at, is_active, created_at`,
		in.Code, in.Description, in.DiscountPercent, in.MinAmount, in.MaxUses, in.ExpiresAt, active).
		Scan(&p.ID, &p.Code, &p.Description, &p.DiscountPercent, &p.MinAmount,
			&p.MaxUses, &p.CurrentUses, &p.ExpiresAt, &p.IsActive, &p.CreatedAt)
	if err != nil {
		return nil, httpx.Conflict("Промокод с таким кодом уже существует")
	}
	return &p, nil
}

func (s *PromoService) Update(ctx context.Context, id string, in *PromotionInput) (*models.Promotion, error) {
	res, err := s.pool.Exec(ctx,
		`UPDATE promotions SET description=$2, discount_percent=$3, min_amount=$4, max_uses=$5, expires_at=$6, is_active=COALESCE($7, is_active) WHERE id=$1`,
		id, in.Description, in.DiscountPercent, in.MinAmount, in.MaxUses, in.ExpiresAt, in.IsActive)
	if err != nil {
		return nil, err
	}
	if res.RowsAffected() == 0 {
		return nil, httpx.NotFound("Промокод не найден")
	}
	rows, err := s.pool.Query(ctx,
		`SELECT id, code, description, discount_percent, min_amount, max_uses, current_uses, expires_at, is_active, created_at
		 FROM promotions WHERE id=$1`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var p models.Promotion
	if rows.Next() {
		_ = rows.Scan(&p.ID, &p.Code, &p.Description, &p.DiscountPercent, &p.MinAmount,
			&p.MaxUses, &p.CurrentUses, &p.ExpiresAt, &p.IsActive, &p.CreatedAt)
	}
	return &p, nil
}

func (s *PromoService) Delete(ctx context.Context, id string) error {
	res, err := s.pool.Exec(ctx, `DELETE FROM promotions WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return httpx.NotFound("Промокод не найден")
	}
	return nil
}

func round2(v float64) float64 {
	return float64(int64(v*100+0.5)) / 100
}
