package dto

import (
	"errors"
	"regexp"
	"strings"
)

var emailRe = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

type RegisterRequest struct {
	Email        string `json:"email"`
	Password     string `json:"password"`
	FullName     string `json:"full_name"`
	Role         string `json:"role"`
	Phone        string `json:"phone"`
	ReferralCode string `json:"referral_code"`
}

func (r *RegisterRequest) Validate() error {
	if !emailRe.MatchString(strings.TrimSpace(r.Email)) {
		return errors.New("Введите корректный email")
	}
	if len(r.Password) < 6 {
		return errors.New("Пароль должен быть не менее 6 символов")
	}
	if len(strings.TrimSpace(r.FullName)) < 2 {
		return errors.New("Имя должно содержать минимум 2 символа")
	}
	if r.Role != "customer" && r.Role != "farmer" {
		return errors.New("Роль должна быть 'customer' или 'farmer'")
	}
	return nil
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r *LoginRequest) Validate() error {
	if r.Email == "" || r.Password == "" {
		return errors.New("Email и пароль обязательны")
	}
	return nil
}

type MeResponse struct {
	ID        string  `json:"id"`
	Email     string  `json:"email"`
	FullName  string  `json:"full_name"`
	Phone     *string `json:"phone,omitempty"`
	Telegram  *string `json:"telegram,omitempty"`
	AvatarURL *string `json:"avatar_url,omitempty"`
	Role      string  `json:"role"`
	City      string  `json:"city"`
	Address   *string `json:"address,omitempty"`
	Bio       *string `json:"bio,omitempty"`
	FarmName  *string `json:"farm_name,omitempty"`
	XP        int     `json:"xp"`
	Level     int     `json:"level"`
}

type ProfileUpdateRequest struct {
	FullName  *string `json:"full_name"`
	Phone     *string `json:"phone"`
	Telegram  *string `json:"telegram"`
	AvatarURL *string `json:"avatar_url"`
	City      *string `json:"city"`
	Address   *string `json:"address"`
	Bio       *string `json:"bio"`
}
