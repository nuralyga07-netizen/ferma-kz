package services

import (
	"context"

	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/repositories"
)

type ReferralService struct {
	repo     *repositories.ReferralRepo
	profiles *repositories.ProfileRepo
}

func NewReferralService(repo *repositories.ReferralRepo, profiles *repositories.ProfileRepo) *ReferralService {
	return &ReferralService{repo: repo, profiles: profiles}
}

// MyCode — публичный реферальный код пользователя (логин-часть email).
func (s *ReferralService) MyCode(ctx context.Context, userID string) (string, error) {
	p, err := s.profiles.GetByID(ctx, userID)
	if err != nil {
		return "", httpx.NotFound("Пользователь не найден")
	}
	return repositories.ReferralCode(p.Email), nil
}

// Mine — список приглашённых.
func (s *ReferralService) Mine(ctx context.Context, userID string) ([]models.Referral, error) {
	list, err := s.repo.ListByReferrer(ctx, userID)
	if err != nil {
		return nil, err
	}
	if list == nil {
		list = []models.Referral{}
	}
	return list, nil
}

// RewardFirstOrder — если у покупателя есть pending-реферальная запись,
// перевести её в rewarded и начислить XP рефереру (вызывается после
// доставки первого заказа приглашённого).
func (s *ReferralService) RewardFirstOrder(ctx context.Context, customerID string) error {
	return s.repo.RewardByReferredID(ctx, customerID, 100)
}
