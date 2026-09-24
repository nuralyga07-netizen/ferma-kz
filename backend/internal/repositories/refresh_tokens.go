package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrTokenNotFound — refresh-токен не найден (отозван или истёк).
var ErrTokenNotFound = errors.New("refresh token not found")

type RefreshTokenRepo struct {
	pool *pgxpool.Pool
}

func NewRefreshTokenRepo(pool *pgxpool.Pool) *RefreshTokenRepo {
	return &RefreshTokenRepo{pool: pool}
}

func (r *RefreshTokenRepo) Create(ctx context.Context, userID, tokenHash string, ttl time.Duration) error {
	id, _ := uuid.NewRandom()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1,$2,$3, now() + $4::interval)`,
		id.String(), userID, tokenHash, fmt.Sprintf("%d seconds", int(ttl.Seconds())))
	return err
}

// Rotate: старая строка отзывается, создаётся новая (в одной транзакции).
func (r *RefreshTokenRepo) Rotate(ctx context.Context, userID, oldHash, newHash string, ttl time.Duration) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	tag, err := tx.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id=$1 AND token_hash=$2 AND revoked_at IS NULL`,
		userID, oldHash)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrTokenNotFound
	}

	id, _ := uuid.NewRandom()
	_, err = tx.Exec(ctx,
		`INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1,$2,$3, now() + $4::interval)`,
		id.String(), userID, newHash, fmt.Sprintf("%d seconds", int(ttl.Seconds())))
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// Validate проверяет токен: существует, не отозван, не истёк.
func (r *RefreshTokenRepo) Validate(ctx context.Context, userID, tokenHash string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM refresh_tokens
			WHERE user_id=$1 AND token_hash=$2 AND revoked_at IS NULL AND expires_at > now())`,
		userID, tokenHash).Scan(&exists)
	return exists, err
}

// FindOwnerByHash возвращает userID владельца валидного токена.
func (r *RefreshTokenRepo) FindOwnerByHash(ctx context.Context, tokenHash string) (string, error) {
	var userID string
	err := r.pool.QueryRow(ctx,
		`SELECT user_id FROM refresh_tokens
			WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at > now()`, tokenHash).Scan(&userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrTokenNotFound
		}
		return "", err
	}
	return userID, nil
}

func (r *RefreshTokenRepo) Revoke(ctx context.Context, userID, tokenHash string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id=$1 AND token_hash=$2 AND revoked_at IS NULL`,
		userID, tokenHash)
	return err
}

func (r *RefreshTokenRepo) RevokeAll(ctx context.Context, userID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id=$1 AND revoked_at IS NULL`, userID)
	return err
}
