package repositories

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/models"
)

type ReferralRepo struct {
	pool *pgxpool.Pool
}

func NewReferralRepo(pool *pgxpool.Pool) *ReferralRepo { return &ReferralRepo{pool: pool} }

// ReferralCode — публичный код реферера (логин-часть email).
func ReferralCode(email string) string {
	local := strings.SplitN(email, "@", 2)[0]
	return strings.ToLower(local)
}

// ListByReferrer — приглашённые пользователем (с именем приглашённого).
func (r *ReferralRepo) ListByReferrer(ctx context.Context, referrerID string) ([]models.Referral, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT rf.id, rf.referrer_id, rf.referred_id, rp.full_name,
			rf.reward_amount, rf.status, rf.created_at
		FROM referrals rf
		JOIN profiles rp ON rp.id = rf.referred_id
		WHERE rf.referrer_id = $1
		ORDER BY rf.created_at DESC`, referrerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Referral
	for rows.Next() {
		var rf models.Referral
		var name *string
		if err := rows.Scan(&rf.ID, &rf.ReferrerID, &rf.ReferredID, &name,
			&rf.RewardAmount, &rf.Status, &rf.CreatedAt); err != nil {
			return nil, err
		}
		rf.ReferredName = name
		out = append(out, rf)
	}
	return out, rows.Err()
}

// RewardByReferredID — переводит pending-запись приглашённого в rewarded
// и начисляет XP рефереру (вызывается после первого заказа приглашённого).
func (r *ReferralRepo) RewardByReferredID(ctx context.Context, referredID string, xp int) error {
	_, err := r.pool.Exec(ctx, `
		WITH rewarded AS (
			UPDATE referrals SET status = 'rewarded'
			WHERE referred_id = $1 AND status = 'pending'
			RETURNING referrer_id
		)
		UPDATE profiles
		SET xp = xp + $2,
		    level = GREATEST(level, 1 + FLOOR((xp + $2) / 500)),
		    updated_at = now()
		WHERE id = (SELECT referrer_id FROM rewarded)`, referredID, xp)
	return err
}
