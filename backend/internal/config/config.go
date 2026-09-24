package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config — все настройки приложения из переменных окружения.
type Config struct {
	Port             string
	DatabaseURL      string
	JWTSecret        string
	AccessTTL        time.Duration
	RefreshTTL       time.Duration
	CORSOrigins      []string
	UploadDir        string
	DeliveryFee      int64 // ₸
	DeliveryFreeFrom int64 // ₸
	ReferralReward   int64 // ₸
	AdminEmail       string
	AdminPassword    string
}

func Load() (*Config, error) {
	c := &Config{
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		JWTSecret:     os.Getenv("JWT_SECRET"),
		AccessTTL:     getDuration("JWT_ACCESS_TTL", 15*time.Minute),
		RefreshTTL:    getDuration("JWT_REFRESH_TTL", 30*24*time.Hour),
		UploadDir:     getEnv("UPLOAD_DIR", "./storage/uploads"),
		AdminEmail:    getEnv("ADMIN_EMAIL", "admin@ferma.kz"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "admin123"),
	}

	if c.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if len(c.JWTSecret) < 32 {
		return nil, fmt.Errorf("JWT_SECRET must be at least 32 characters")
	}

	for _, o := range splitComma(os.Getenv("CORS_ORIGINS")) {
		if o != "" {
			c.CORSOrigins = append(c.CORSOrigins, o)
		}
	}

	fee, err := int64FromEnv("DELIVERY_FEE", 500)
	if err != nil {
		return nil, err
	}
	c.DeliveryFee = fee

	freeFrom, err := int64FromEnv("DELIVERY_FREE_FROM", 10000)
	if err != nil {
		return nil, err
	}
	c.DeliveryFreeFrom = freeFrom

	reward, err := int64FromEnv("REFERRAL_REWARD", 500)
	if err != nil {
		return nil, err
	}
	c.ReferralReward = reward

	return c, nil
}

func getEnv(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}

func getDuration(key string, def time.Duration) time.Duration {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return def
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return def
	}
	return d
}

func int64FromEnv(key string, def int64) (int64, error) {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return def, nil
	}
	n, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("%s must be an integer: %w", key, err)
	}
	return n, nil
}

func splitComma(s string) []string {
	var out []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == ',' {
			out = append(out, trimSpace(s[start:i]))
			start = i + 1
		}
	}
	out = append(out, trimSpace(s[start:]))
	return out
}

func trimSpace(s string) string {
	a, b := 0, len(s)
	for a < b && (s[a] == ' ' || s[a] == '\t') {
		a++
	}
	for b > a && (s[b-1] == ' ' || s[b-1] == '\t') {
		b--
	}
	return s[a:b]
}
