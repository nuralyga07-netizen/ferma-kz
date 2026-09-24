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

// ErrAdminCannotBlock — администраторов блокировать нельзя (иначе останется без управления).
var ErrAdminCannotBlock = errors.New("admin cannot be blocked")

type ProfileRepo struct {
	pool *pgxpool.Pool
}

func NewProfileRepo(pool *pgxpool.Pool) *ProfileRepo { return &ProfileRepo{pool: pool} }

const profileColumns = `id, email, password_hash, full_name, phone, telegram, avatar_url,
	role, city, address, bio, farm_name, is_active, xp, level, created_at, updated_at`

func scanProfile(row interface{ Scan(dest ...any) error }) (models.Profile, error) {
	var p models.Profile
	err := row.Scan(&p.ID, &p.Email, &p.PasswordHash, &p.FullName, &p.Phone, &p.Telegram,
		&p.AvatarURL, &p.Role, &p.City, &p.Address, &p.Bio, &p.FarmName,
		&p.IsActive, &p.XP, &p.Level, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func (r *ProfileRepo) Create(ctx context.Context, p *models.Profile) error {
	id, err := uuid.NewRandom()
	if err != nil {
		return err
	}
	p.ID = id.String()
	err = r.pool.QueryRow(ctx,
		`INSERT INTO profiles (id, email, password_hash, full_name, phone, role, city, xp, level)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,0,1)
		 RETURNING `+profileColumns,
		p.ID, p.Email, p.PasswordHash, p.FullName, p.Phone, p.Role, p.City,
	).Scan(&p.ID, &p.Email, &p.PasswordHash, &p.FullName, &p.Phone, &p.Telegram,
		&p.AvatarURL, &p.Role, &p.City, &p.Address, &p.Bio, &p.FarmName,
		&p.IsActive, &p.XP, &p.Level, &p.CreatedAt, &p.UpdatedAt)
	return err
}

func (r *ProfileRepo) GetByID(ctx context.Context, id string) (models.Profile, error) {
	p, err := scanProfile(r.pool.QueryRow(ctx, `SELECT `+profileColumns+` FROM profiles WHERE id=$1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return p, fmt.Errorf("profile not found")
	}
	return p, err
}

func (r *ProfileRepo) GetByEmail(ctx context.Context, email string) (models.Profile, error) {
	p, err := scanProfile(r.pool.QueryRow(ctx, `SELECT `+profileColumns+` FROM profiles WHERE email=$1`, email))
	if errors.Is(err, pgx.ErrNoRows) {
		return p, fmt.Errorf("profile not found")
	}
	return p, err
}

// GetByReferralCode — поиск по реферальному коду (логин-части email).
func (r *ProfileRepo) GetByReferralCode(ctx context.Context, code string) (models.Profile, error) {
	p, err := scanProfile(r.pool.QueryRow(ctx,
		`SELECT `+profileColumns+` FROM profiles WHERE split_part(email, '@', 1) = $1`,
		strings.ToLower(code)))
	if errors.Is(err, pgx.ErrNoRows) {
		return p, fmt.Errorf("profile not found")
	}
	return p, err
}

func (r *ProfileRepo) Update(ctx context.Context, p *models.Profile) error {
	res, err := r.pool.Exec(ctx,
		`UPDATE profiles SET full_name=$2, phone=$3, telegram=$4, avatar_url=$5, address=$6, bio=$7, city=$8
		 WHERE id=$1`,
		p.ID, p.FullName, p.Phone, p.Telegram, p.AvatarURL, p.Address, p.Bio, p.City)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("profile not found")
	}
	return nil
}

func (r *ProfileRepo) SetRole(ctx context.Context, id string, role models.Role, farmName *string, city *string) error {
	res, err := r.pool.Exec(ctx, `UPDATE profiles SET role=$2, farm_name=COALESCE($3, farm_name), city=COALESCE($4, city), updated_at=now() WHERE id=$1`,
		id, role, farmName, city)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("profile not found")
	}
	return nil
}

func (r *ProfileRepo) SetActive(ctx context.Context, id string, active bool) error {
	// Админа нельзя заблокировать (в т.ч. самого себя) — останется без управления;
	// разблокировка разрешена.
	if !active {
		var role string
		if err := r.pool.QueryRow(ctx, `SELECT role::text FROM profiles WHERE id=$1`, id).Scan(&role); err != nil {
			return err
		}
		if role == "admin" {
			return ErrAdminCannotBlock
		}
	}
	res, err := r.pool.Exec(ctx, `UPDATE profiles SET is_active=$2, updated_at=now() WHERE id=$1`, id, active)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("profile not found")
	}
	return nil
}

func (r *ProfileRepo) AddXP(ctx context.Context, id string, xp int) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE profiles SET xp = xp + $2, level = CASE
			WHEN xp + $2 >= 1000 THEN LEAST(10, level + 1)
			WHEN xp + $2 >= 200  THEN LEAST(10, GREATEST(level, 3))
			ELSE level
			END, updated_at=now() WHERE id=$1`, id, xp)
	return err
}

type FarmerRow struct {
	ID           string
	FullName     string
	City         string
	Bio          *string
	FarmName     *string
	AvatarURL    *string
	Phone        *string
	ProductCount int
	Rating       *float64
	ReviewCount  *int
}

func (r *ProfileRepo) ListFarmers(ctx context.Context, q string, limit, offset int) ([]FarmerRow, error) {
	where := `WHERE p.role = 'farmer' AND p.is_active`
	args := []any{}
	if q != "" {
		where += ` AND (p.full_name ILIKE $1 OR p.farm_name ILIKE $1 OR p.city ILIKE $1)`
		args = append(args, "%"+q+"%")
	}
	// лимит/офсет идут после args
	limitIdx := len(args) + 1
	offsetIdx := len(args) + 2
	args = append(args, limit, offset)

	query := `
		SELECT p.id, p.full_name, p.city, p.bio, p.farm_name, p.avatar_url, p.phone,
			COUNT(pr.id)::int AS product_count,
			AVG(pr.rating) AS rating,
			COUNT(rv.id)::int AS review_count
		FROM profiles p
		LEFT JOIN products pr ON pr.farmer_id = p.id AND pr.is_active
		LEFT JOIN reviews rv ON rv.product_id = pr.id
		` + where + `
		GROUP BY p.id
		ORDER BY p.created_at DESC
		LIMIT ` + intPlaceholder(limitIdx) + ` OFFSET ` + intPlaceholder(offsetIdx)
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []FarmerRow
	for rows.Next() {
		var f FarmerRow
		if err := rows.Scan(&f.ID, &f.FullName, &f.City, &f.Bio, &f.FarmName, &f.AvatarURL, &f.Phone,
			&f.ProductCount, &f.Rating, &f.ReviewCount); err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

func (r *ProfileRepo) GetFarmer(ctx context.Context, id string) (*FarmerRow, error) {
	var f FarmerRow
	err := r.pool.QueryRow(ctx, `
		SELECT p.id, p.full_name, p.city, p.bio, p.farm_name, p.avatar_url, p.phone,
			COUNT(pr.id)::int, AVG(pr.rating), COUNT(rv.id)::int
		FROM profiles p
		LEFT JOIN products pr ON pr.farmer_id = p.id AND pr.is_active
		LEFT JOIN reviews rv ON rv.product_id = pr.id
		WHERE p.id=$1 AND p.role='farmer'
		GROUP BY p.id`, id).
		Scan(&f.ID, &f.FullName, &f.City, &f.Bio, &f.FarmName, &f.AvatarURL, &f.Phone,
			&f.ProductCount, &f.Rating, &f.ReviewCount)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("farmer not found")
	}
	if err != nil {
		return nil, err
	}
	return &f, nil
}

// ListUsers — поиск пользователей для админа.
func (r *ProfileRepo) ListUsers(ctx context.Context, q, role string, limit, offset int) ([]models.UserSummary, error) {
	where := []string{"TRUE"}
	args := []any{}
	if q != "" {
		where = append(where, "(p.email ILIKE $1 OR p.full_name ILIKE $1)")
		args = append(args, "%"+q+"%")
	}
	if role != "" {
		where = append(where, fmt.Sprintf("p.role = $%d", len(args)+1))
		args = append(args, role)
	}
	limitIdx := len(args) + 1
	offsetIdx := len(args) + 2
	args = append(args, limit, offset)

	query := `
		SELECT p.id, p.email, p.full_name, p.role, p.is_active, p.created_at
		FROM profiles p
		WHERE ` + joinOr(where) + `
		ORDER BY p.created_at DESC
		LIMIT ` + intPlaceholder(limitIdx) + ` OFFSET ` + intPlaceholder(offsetIdx)
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.UserSummary
	for rows.Next() {
		var u models.UserSummary
		if err := rows.Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &u.IsActive, &u.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func joinOr(conds []string) string {
	out := ""
	for i, c := range conds {
		if i > 0 {
			out += " AND "
		}
		out += c
	}
	return out
}

// intPlaceholder — "$N" для динамических нумерованных параметров.
func intPlaceholder(n int) string { return fmt.Sprintf("$%d", n) }
