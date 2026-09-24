// seed — демо-данные для разработки: фермеры, товары, промокоды.
//
// Использование:
//
//	DATABASE_URL=postgres://... go run ./cmd/seed
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/database"
)

type farmer struct {
	email, name, phone, farm, city, bio, avatar string
}

type product struct {
	farmerIdx int
	category  string // slug
	name      string
	desc      string
	price     float64
	oldPrice  *float64
	unit      string
	qty       int
	images    []string
	featured  bool
	organic   bool
}

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		slog.Error("DATABASE_URL is required")
		os.Exit(1)
	}
	ctx := context.Background()

	// Сначала гарантируем, что миграции применены (seed после migrate).
	if err := database.Migrate(ctx, dsn); err != nil {
		slog.Error("migrate failed", "err", err)
		os.Exit(1)
	}

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		slog.Error("pool create failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Идиотентность: если есть хотя бы один товар — считаем данные уже зосианы.
	var cnt int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*)::int FROM products`).Scan(&cnt); err != nil {
		slog.Error("query failed", "err", err)
		os.Exit(1)
	}
	if cnt > 0 {
		fmt.Printf("Seed skipped: %d products already exist\n", cnt)
		return
	}

	farmers := []farmer{
		{"ayana.demo@ferma.kz", "Аяна Нурланова", "+7 701 100 20 01", "Ферма «Аяна»", "Актобе",
			"Семейная ферма в предгорьях. Куры на выгуле с детства, свежее каждый день.", ""},
		{"baurzhan.demo@ferma.kz", "Бауыржан Саттаров", "+7 705 200 30 02", "«Сарыарка Агρο»", "Кызылорда",
			"Молочная ферма: коровы айрширской породы, натуральный творог и сметана по бабушкиным рецептам.", ""},
		{"dastan.demo@ferma.kz", "Дастан Керимов", "+7 707 300 40 03", "Овощи от Дастана", "Актобе",
			"Овощи и зелень с собственных грядок, без химии. Собираем утром — привозим вечером.", ""},
		{"gulnara.demo@ferma.kz", "Гульнара Оспанова", "+7 702 400 50 04", "Медовая усадьба", "Атырау",
			"Семейная пасека, мёд с горного разнотравья, липа и акация. Всё без подогрева.", ""},
		{"erlan.demo@ferma.kz", "Ерлан Бекетаев", "+7 708 500 60 05", "Мясо от Ерлана", "Костанай",
			"Откорм барана и говядина на естественных пастбищах. Резка по запросу.", ""},
		{"aziza.demo@ferma.kz", "Азия Сапарова", "+7 706 600 70 06", "Выпечка Азины", "Актобе",
			"Домашняя выпечка на домашнем масле и молоке от «Сарыарка Агро». Хлеб, баурсаки, чалап.", ""},
	}

	products := []product{
		{0, "yaytsa", "Яйца домашние (десяток)", "Крепкие деревенские яйца от кур на свободном выгуле. Собираем каждое утро.", 900, nil, "десяток", 50, []string{"/uploads/eggs-1.jpg"}, true, true},
		{0, "molochnye", "Молоко деревенское", "Свежее коровье молоко, разлив по бутылкам. Жирность 4%.", 450, nil, "л", 40, []string{"/uploads/milk-1.jpg"}, true, true},
		{0, "molochnye", "Творог домашний", "Рассыпчатый творог, сквашиваем утром. 0,5 кг.", 1200, ptr(1400), "кг", 25, []string{"/uploads/cottage-1.jpg"}, false, true},
		{1, "molochnye", "Сметана 20%", "Густая деревенская сметана, идеальна для окрошки.", 1100, nil, "кг", 30, []string{"/uploads/cream-1.jpg"}, false, true},
		{1, "molochnye", "Сыр «Косичка»", "Ряженый сыр-косичка, 10 дней выдержки.", 2500, nil, "кг", 15, []string{"/uploads/cheese-1.jpg"}, true, false},
		{1, "molochnye", "Масло сливочное", "Сбитое сливочное масло 82,5%.", 2800, nil, "кг", 20, []string{"/uploads/butter-1.jpg"}, false, true},
		{2, "ovoshi", "Помидоры черри", "Сладкие черри с грядки, собираем в день отгрузки.", 1500, nil, "кг", 60, []string{"/uploads/tomato-1.jpg"}, true, true},
		{2, "ovoshi", "Огурцы тепличные", "Хрустящие огурцы, без нитратов.", 900, nil, "кг", 80, []string{"/uploads/cucumber-1.jpg"}, false, true},
		{2, "zelen", "Зелёный лук", "Пучок свежего зелёного лука с грядки.", 200, nil, "пучок", 100, []string{"/uploads/green-onion-1.jpg"}, false, true},
		{3, "med", "Мёд цветочный", "Летний мёд с разнотравья. Стеклянная банка.", 2200, ptr(2500), "кг", 45, []string{"/uploads/honey-1.jpg"}, true, true},
		{3, "med", "Мёд акациевый", "Лёгкий акациевый мёд, долго не кристаллизуется.", 2600, nil, "кг", 30, []string{"/uploads/honey-2.jpg"}, false, true},
		{4, "myaso", "Баранина (резка)", "Отборное мясо от откормленных баранов. Любая резка по запросу.", 3800, nil, "кг", 40, []string{"/uploads/mutton-1.jpg"}, true, false},
		{4, "myaso", "Говядина тушёная", "Тонкокожая говядина, идеально для плова и жаркого.", 3200, nil, "кг", 35, []string{"/uploads/beef-1.jpg"}, false, false},
		{5, "vypechka", "Лаваш домашний", "Тонкий лаваш, печём на тандыре каждое утро.", 350, nil, "шт", 70, []string{"/uploads/flatbread-1.jpg"}, true, false},
		{5, "vypechka", "Баурсаки", "Хрустящие баурсаки с домашним маслом. 0,5 кг.", 1300, nil, "кг", 25, []string{"/uploads/baursak-1.jpg"}, false, false},
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		slog.Error("tx begin", "err", err)
		os.Exit(1)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var farmerIDs []string
	for i, f := range farmers {
		var id string
		err = tx.QueryRow(ctx, `
			INSERT INTO profiles (email, password_hash, full_name, phone, role, city, bio, farm_name)
			VALUES ($1, $2, $3, $4, 'farmer', $5, $6, $7)
			RETURNING id`,
			f.email, demoHash(), f.name, f.phone, f.city, f.bio, f.farm,
		).Scan(&id)
		if err != nil {
			slog.Error("insert farmer", "idx", i, "err", err)
			os.Exit(1)
		}
		farmerIDs = append(farmerIDs, id)
	}

	for i, p := range products {
		images := p.images
		if images == nil {
			images = []string{}
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO products (farmer_id, category_id, name, description, price, old_price, unit,
				quantity_available, images, is_featured, organic)
			VALUES ($1,
				(SELECT id FROM categories WHERE slug=$2),
				$3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			farmerIDs[p.farmerIdx], p.category, p.name, p.desc, p.price, p.oldPrice,
			p.unit, p.qty, images, p.featured, p.organic,
		)
		if err != nil {
			slog.Error("insert product", "idx", i, "err", err)
			os.Exit(1)
		}
	}

	// Демо-промокоды
	for _, code := range []struct {
		code string
		pct  int
		min  float64
	}{
		{"FARMA10", 10, 3000},
		{"FARMA15", 15, 8000},
	} {
		_, err = tx.Exec(ctx, `
			INSERT INTO promotions (code, description, discount_percent, min_amount, max_uses, expires_at)
			VALUES ($1, 'Промокод от Ferma.kz', $2, $3, 100, now() + interval '30 days')`,
			code.code, code.pct, code.min)
		if err != nil {
			slog.Error("insert promo", "code", code.code, "err", err)
			os.Exit(1)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		slog.Error("commit", "err", err)
		os.Exit(1)
	}

	fmt.Printf("Seeded %d farmers, %d products, 2 promos\n", len(farmers), len(products))
}

func ptr(v float64) *float64 { return &v }

// demoHash — фиксированный bcrypt-хэш для demo-пароля "demo1234".
// (Сгенерирован заранее, чтобы не тянуть x/crypto в seed.)
func demoHash() string {
	return "$2a$10$6pKr.Y41wmMgf97mCvwDRewuQdOyIkddvPhWHoN3drLopRNi0dtrS"
}
