package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/auth"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/repositories"
)

type AuthService struct {
	profiles   *repositories.ProfileRepo
	refresh    *repositories.RefreshTokenRepo
	jwt        *auth.JWT
	pool       *pgxpool.Pool
	refreshTTL time.Duration
}

func NewAuthService(
	profiles *repositories.ProfileRepo,
	refresh *repositories.RefreshTokenRepo,
	jwt *auth.JWT,
	pool *pgxpool.Pool,
	refreshTTL time.Duration,
) *AuthService {
	return &AuthService{profiles: profiles, refresh: refresh, jwt: jwt, pool: pool, refreshTTL: refreshTTL}
}

type RegisterInput struct {
	Email          string
	Password       string
	FullName       string
	Role           models.Role
	Phone          *string
	ReferralCode   *string
	ReferralReward float64
}

type AuthResult struct {
	AccessToken  string
	RefreshToken string
	Profile      models.Profile
}

func (s *AuthService) Register(ctx context.Context, in *RegisterInput) (*AuthResult, error) {
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if _, err := s.profiles.GetByEmail(ctx, email); err == nil {
		return nil, httpx.Conflict("Этот email уже зарегистрирован")
	}

	hash, err := auth.HashPassword(in.Password)
	if err != nil {
		return nil, err
	}

	// Роль farmer при регистрации не выдаётся — сначала заявка на модерацию.
	role := models.RoleCustomer
	if in.Role == models.RoleFarmer {
		role = models.RoleCustomer
	}

	p := &models.Profile{
		Email:        email,
		PasswordHash: hash,
		FullName:     in.FullName,
		Role:         role,
		Phone:        in.Phone,
	}
	if err := s.profiles.Create(ctx, p); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, httpx.Conflict("Этот email уже зарегистрирован")
		}
		return nil, err
	}

	// Реферальная ссылка
	if in.ReferralCode != nil && *in.ReferralCode != "" {
		s.linkReferral(ctx, email, *in.ReferralCode, in.ReferralReward)
	}

	// Заявка фермера (если регистрировался как farmer)
	if in.Role == models.RoleFarmer {
		if err := s.createFarmerApplication(ctx, p.ID); err != nil {
			return nil, err
		}
	}

	return s.finishAuth(ctx, p)
}

// createFarmerApplication создаёт pending-заявку на основе профиля.
func (s *AuthService) createFarmerApplication(ctx context.Context, userID string) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO farmer_applications (user_id, full_name, phone, farm_name, city, products)
		 SELECT $1, full_name, COALESCE(phone, ''), COALESCE(farm_name, 'Хозяйство'), city, '—' FROM profiles WHERE id=$1`,
		userID)
	return err
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*AuthResult, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	p, err := s.profiles.GetByEmail(ctx, email)
	if err != nil {
		return nil, httpx.Unauthorized("Неверный email или пароль")
	}
	if !p.IsActive {
		return nil, httpx.Forbidden("Аккаунт заблокирован")
	}
	if !auth.CheckPassword(p.PasswordHash, password) {
		return nil, httpx.Unauthorized("Неверный email или пароль")
	}
	return s.finishAuth(ctx, &p)
}

func (s *AuthService) finishAuth(ctx context.Context, p *models.Profile) (*AuthResult, error) {
	access, err := s.jwt.NewAccessToken(p.ID, string(p.Role))
	if err != nil {
		return nil, err
	}
	refresh, err := auth.NewOpaqueToken()
	if err != nil {
		return nil, err
	}
	if err := s.refresh.Create(ctx, p.ID, auth.HashToken(refresh), s.refreshTTL); err != nil {
		return nil, err
	}
	return &AuthResult{AccessToken: access, RefreshToken: refresh, Profile: *p}, nil
}

// Refresh: валидация refresh-токена, ротация, новый access.
func (s *AuthService) Refresh(ctx context.Context, userID, refreshToken string) (*AuthResult, error) {
	hash := auth.HashToken(refreshToken)
	ok, err := s.refresh.Validate(ctx, userID, hash)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, httpx.Unauthorized("Сессия истекла, войдите снова")
	}

	p, err := s.profiles.GetByID(ctx, userID)
	if err != nil || !p.IsActive {
		return nil, httpx.Unauthorized("Сессия истекла, войдите снова")
	}

	newToken, err := auth.NewOpaqueToken()
	if err != nil {
		return nil, err
	}
	if err := s.refresh.Rotate(ctx, p.ID, hash, auth.HashToken(newToken), s.refreshTTL); err != nil {
		// Гонка: токен уже ротирован/отозван между Validate и Rotate.
		if errors.Is(err, repositories.ErrTokenNotFound) {
			return nil, httpx.Unauthorized("Сессия истекла, войдите снова")
		}
		return nil, err
	}
	access, err := s.jwt.NewAccessToken(p.ID, string(p.Role))
	if err != nil {
		return nil, err
	}
	return &AuthResult{AccessToken: access, RefreshToken: newToken, Profile: p}, nil
}

// RefreshByToken — ротация по самому токenu (cookie не несёт userID).
func (s *AuthService) RefreshByToken(ctx context.Context, refreshToken string) (*AuthResult, error) {
	hash := auth.HashToken(refreshToken)
	userID, err := s.refresh.FindOwnerByHash(ctx, hash)
	if err != nil {
		if errors.Is(err, repositories.ErrTokenNotFound) {
			return nil, httpx.Unauthorized("Сессия истекла, войдите снова")
		}
		return nil, err
	}
	return s.Refresh(ctx, userID, refreshToken)
}

func (s *AuthService) Logout(ctx context.Context, userID, refreshToken string) error {
	return s.refresh.Revoke(ctx, userID, auth.HashToken(refreshToken))
}

// linkReferral связывает нового пользователя с реферером по реферальному коду.
func (s *AuthService) linkReferral(ctx context.Context, referredEmail, referrerCode string, reward float64) {
	referred, err := s.profiles.GetByEmail(ctx, referredEmail)
	if err != nil {
		return
	}
	referrer, err := s.profiles.GetByReferralCode(ctx, referrerCode)
	if err != nil || referrer.ID == referred.ID {
		return
	}
	_, _ = s.pool.Exec(ctx,
		`INSERT INTO referrals (referrer_id, referred_id, reward_amount, status)
		 VALUES ($1,$2,$3,'pending') ON CONFLICT (referred_id) DO NOTHING`,
		referrer.ID, referred.ID, reward)
}

// PublicView — публичное представление профиля (без пароля).
func PublicView(p models.Profile) map[string]any {
	return map[string]any{
		"id":         p.ID,
		"email":      p.Email,
		"full_name":  p.FullName,
		"phone":      p.Phone,
		"telegram":   p.Telegram,
		"avatar_url": p.AvatarURL,
		"role":       p.Role,
		"city":       p.City,
		"address":    p.Address,
		"bio":        p.Bio,
		"farm_name":  p.FarmName,
		"is_active":  p.IsActive,
		"xp":         p.XP,
		"level":      p.Level,
		"created_at": p.CreatedAt,
	}
}
