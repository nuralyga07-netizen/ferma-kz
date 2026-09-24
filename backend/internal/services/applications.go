package services

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/repositories"
)

type ApplicationService struct {
	pool     *pgxpool.Pool
	profiles *repositories.ProfileRepo
}

func NewApplicationService(pool *pgxpool.Pool, profiles *repositories.ProfileRepo) *ApplicationService {
	return &ApplicationService{pool: pool, profiles: profiles}
}

type ApplyInput struct {
	FullName   string
	Phone      string
	FarmName   string
	City       string
	Products   string
	Experience *string
	Bio        *string
}

func (s *ApplicationService) Create(ctx context.Context, userID string, in ApplyInput) (*models.FarmerApplication, error) {
	// Запрет второй pending-заявки
	var exists bool
	err := s.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM farmer_applications WHERE user_id=$1 AND status='pending')`,
		userID).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, httpx.Conflict("У вас уже есть заявка на рассмотрении")
	}

	app := models.FarmerApplication{
		UserID:     userID,
		FullName:   in.FullName,
		Phone:      in.Phone,
		FarmName:   in.FarmName,
		City:       in.City,
		Products:   in.Products,
		Experience: in.Experience,
		Bio:        in.Bio,
		Status:     models.AppPending,
	}
	err = s.pool.QueryRow(ctx,
		`INSERT INTO farmer_applications (user_id, full_name, phone, farm_name, city, products, experience, bio)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		 RETURNING id, created_at`,
		userID, in.FullName, in.Phone, in.FarmName, in.City, in.Products, in.Experience, in.Bio,
	).Scan(&app.ID, &app.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &app, nil
}

const applicationSelect = `
	SELECT fa.id, fa.user_id, p.full_name, p.email, fa.full_name, fa.phone, fa.farm_name,
		fa.city, fa.products, fa.experience, fa.bio, fa.status, fa.reviewed_at, fa.created_at
	FROM farmer_applications fa
	JOIN profiles p ON p.id = fa.user_id`

func scanApplication(row interface{ Scan(dest ...any) error }) (models.FarmerApplication, error) {
	var a models.FarmerApplication
	err := row.Scan(&a.ID, &a.UserID, &a.UserName, &a.UserEmail, &a.FullName, &a.Phone,
		&a.FarmName, &a.City, &a.Products, &a.Experience, &a.Bio, &a.Status,
		&a.ReviewedAt, &a.CreatedAt)
	return a, err
}

func (s *ApplicationService) List(ctx context.Context, status string) ([]models.FarmerApplication, error) {
	query := applicationSelect
	args := []any{}
	if status != "" {
		query += ` WHERE fa.status=$1`
		args = append(args, status)
	}
	query += ` ORDER BY fa.created_at DESC`
	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.FarmerApplication
	for rows.Next() {
		a, err := scanApplication(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *ApplicationService) Mine(ctx context.Context, userID string) (*models.FarmerApplication, error) {
	a, err := scanApplication(s.pool.QueryRow(ctx,
		applicationSelect+` WHERE fa.user_id=$1 ORDER BY fa.created_at DESC LIMIT 1`, userID))
	if err != nil {
		return nil, httpx.NotFound("Заявка не найдена")
	}
	return &a, nil
}

// Review — approve/reject (только из pending). При approval роль меняется на farmer.
func (s *ApplicationService) Review(ctx context.Context, id string, status models.AppStatus) (*models.FarmerApplication, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var (
		userID   string
		farmName string
		city     string
	)
	err = tx.QueryRow(ctx,
		`UPDATE farmer_applications
		 SET status=$2, reviewed_at=now(), updated_at=now()
		 WHERE id=$1 AND status='pending'
		 RETURNING user_id, farm_name, city`,
		id, status,
	).Scan(&userID, &farmName, &city)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, httpx.NotFound("Заявка не найдена или уже обработана")
	}
	if err != nil {
		return nil, err
	}

	if status == models.AppApproved {
		if _, err := tx.Exec(ctx,
			`UPDATE profiles SET role='farmer', farm_name=$2, city=$3, updated_at=now() WHERE id=$1`,
			userID, farmName, city); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	a, err := scanApplication(s.pool.QueryRow(ctx, applicationSelect+` WHERE fa.id=$1`, id))
	if err != nil {
		return nil, err
	}
	return &a, nil
}
