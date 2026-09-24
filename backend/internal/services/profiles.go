package services

import (
	"context"

	"ferma-kz/backend/internal/dto"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/repositories"
)

type ProfileService struct {
	repo *repositories.ProfileRepo
}

func NewProfileService(repo *repositories.ProfileRepo) *ProfileService {
	return &ProfileService{repo: repo}
}

func (s *ProfileService) GetByID(ctx context.Context, id string) (models.Profile, error) {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return p, httpx.NotFound("Пользователь не найден")
	}
	return p, nil
}

// Update — частичное обновление профиля.
func (s *ProfileService) Update(ctx context.Context, id string, req *dto.ProfileUpdateRequest) (models.Profile, error) {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return p, httpx.NotFound("Пользователь не найден")
	}
	if req.FullName != nil {
		p.FullName = *req.FullName
	}
	if req.Phone != nil {
		p.Phone = req.Phone
	}
	if req.Telegram != nil {
		p.Telegram = req.Telegram
	}
	if req.AvatarURL != nil {
		p.AvatarURL = req.AvatarURL
	}
	if req.City != nil {
		p.City = *req.City
	}
	if req.Address != nil {
		p.Address = req.Address
	}
	if req.Bio != nil {
		p.Bio = req.Bio
	}
	if err := s.repo.Update(ctx, &p); err != nil {
		return p, err
	}
	return p, nil
}
