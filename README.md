# Ferma.kz 🌿

**Свежие фермерские продукты напрямую, без посредников.**

Маркетплейс для прямых продаж от фермеров к покупателям в Казахстане. Next.js 15, Supabase, Tailwind CSS.

## 🚀 Быстрый старт

```bash
npm install
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

## 🏗 Архитектура

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/           # Публичные страницы
│   ├── (auth)/             # Аутентификация
│   ├── (dashboard)/        # Дашборды
│   └── api/                # API роуты
├── components/
│   ├── ui/                 # UI-кит (Button, Card, Input...)
│   ├── layout/             # Header, Footer, ThemeProvider
│   └── features/           # Чат, Корзина, и т.д.
├── lib/
│   ├── supabase/           # Supabase клиент (browser, server, middleware)
│   └── utils/              # Утилиты
├── store/                  # Zustand (auth, cart)
└── types/                  # TypeScript типы
```

## 🛠 Стек

- **Framework:** Next.js 16 (App Router)
- **Язык:** TypeScript
- **Стили:** Tailwind CSS v4
- **Анимации:** Framer Motion
- **Состояние:** Zustand
- **База данных:** Supabase (PostgreSQL)
- **Аутентификация:** Supabase Auth (Email + Google)
- **Деплой:** Vercel

## 📄 Страницы

- `/` — Главная с Hero, преимуществами, FAQ
- `/catalog` — Каталог продуктов с поиском и фильтрами
- `/product/[id]` — Детальная страница товара
- `/cart` — Корзина
- `/checkout` — Оформление заказа
- `/login` — Вход
- `/register` — Регистрация (покупатель/фермер)
- `/dashboard` — Дашборд покупателя
- `/farmer` — Дашборд фермера
- `/chat` — Чат с фермером
- `/about` — О проекте
- `/farmers` — Все фермеры
- `/terms` — Условия использования

## ⚙️ Переменные окружения

Скопируйте `.env.local.example` в `.env.local` и заполните:

```bash
cp .env.local.example .env.local
```

| Переменная | Описание |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный ключ Supabase |
| `DEEPSEEK_API_KEY` | AI для рекомендаций (опционально) |

## 📦 Деплой на Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nuralyga07-netizen/ferma-kz)

Или вручную:
1. Открой [vercel.com/new](https://vercel.com/new)
2. Импортируй `nuralyga07-netizen/ferma-kz`
3. Нажми **Deploy** 🚀

## 🗄 База данных Supabase

SQL схема в `supabase-schema.sql`. Включите в Supabase SQL Editor.

## 👨‍🌾 Автор

**Nuraly** — 15 лет, Актобе, Казахстан
- Telegram: [@nuraly_channel](https://t.me/your_channel)

---

<p align="center">Сделано с ❤️ для фермеров Казахстана</p>
