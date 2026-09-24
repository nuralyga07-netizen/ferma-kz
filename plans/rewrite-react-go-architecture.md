# Ferma.kz — Перезапись: архитектура React (TS) + Go + PostgreSQL

> Полный план рефакторинга с «монолита на Next.js + Supabase» в разделённую систему:
> **фронтенд** — React 19 + TypeScript (Vite SPA), **бэкенд** — Go (chi + pgx) + PostgreSQL.
> Документ: `plans/rewrite-react-go-architecture.md`. Дата: 22.09.2026.

---

## 1. Ключевые решения (архитектурные)

| # | Решение | Обоснование |
|---|---|---|
| 1 | **Фронтенд: Vite + React 19 SPA** (без SSR) | Пользователь указал «TS React». При наличии реального REST+WS API SSR не нужен; SEO компенсируем meta-тегами на клиенте и (опционально) пререндером ключевых страниц позже. |
| 2 | **Бэкенд: Go + chi + pgx v5** | chi — лёгкий идиоматичный роутер на net/http; pgx — нативный Postgres-драйвер с пулом. |
| 3 | **Auth: собственный JWT (access 15 мин + refresh 30 дн.)** | Supabase больше не нужен. Пароли — bcrypt. Refresh-токен — httpOnly-cookie + hash в БД (отзываемый). RBAC: customer / farmer / admin. |
| 4 | **RLS не используем** | Авторизацию делает Go-бэкенд (сервисный слой) — Postgres без RLS-политик, что упрощает схему и ускоряет запросы. |
| 5 | **Чат: REST + WebSocket** (gorilla/websocket, hub в Go) | Реалтайм-доставка сообщений + статусы прочтения. |
| 6 | **Заказы формируются по одному фермеру** | Корзина может содержать товары разных фермеров → при оформлении разбиваем на N заказов (по оригинальной схеме `orders.farmer_id`). |
| 7 | **Миграции: goose (SQL-файлы)** | Версионированная схема, seed категорий и админа. |
| 8 | **Инфраструктура: docker-compose** (Postgres 16 + Go API + Nginx) | Единый `docker compose up` = весь проект. Dev-режим: `go run` + `vite` (proxy на :8080). |
| 9 | **Загрузка картинок**: POST `/uploads` → локальный том + static-сервирование `/uploads/*` | S3-совместимость оставляем интерфейсом (реализуем позже, если понадобится). |
| 10 | **Стек фронтенда** | react-router-dom v7, zustand (auth + cart), Tailwind v4 (сохраняем существующий glass-дизайн), framer-motion, lucide-react, sonner. |

### Охват (scope)

**Включено в перезапись:**
- Auth: регистрация (покупатель/фермер), логин, refresh, logout, /me.
- Каталог: категории (seed 10 шт.), товары (CRUD фермером, поиск, фильтры, сортировка), загрузка картинок.
- Фермеры: список, профиль, заявка «Стать фермером», модерация админом (смена роли).
- Корзина (в БД), оформление заказа (адрес, доставка/самовывоз, промокод), жизненный цикл заказа со статусами, скидка/доставка.
- Отзывы (после доставленного заказа) + пересчёт рейтинга товара.
- Избранное.
- Чат в реальном времени (WS).
- Промокоды (CRUD у админа, применение при checkout).
- Реферальная программа (лёгкая: код при регистрации, статусы).
- Админ-панель: статистика + график, заявки, пользователи (блок/роль), заказы, акции.
- XP/уровни покупателя (минимально: +10 XP за доставленный заказ).

**Вне scope (заложили места для расширения, реализуем позже):**
- Платные тарифы фермеров (`farmer_subscriptions`).
- Подписки на еженедельные корзины.
- Оплата онлайн (Kaspi/карты) — только «оплата при получении» + выбор метода.
- Email-уведомления (forgot-password — заглушка-статус «в разработке»).
- DeepSeek-рекомендации, Telegram-бот.

---

## 2. Структура репозитория (monorepo)

```
ferma-kz/
├── frontend/                     # React 19 + Vite + TS
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx               # Router + ThemeProvider + Toaster
│   │   ├── api/                  # http-клиент + модули: auth, products, orders, chat, admin...
│   │   │   ├── client.ts         # fetch-обёртка: base URL, access token, refresh on 401, envelope {success,data,error}
│   │   │   ├── types.ts          # все DTO-типы (зеркалят бэкенд)
│   │   │   └── *.ts
│   │   ├── store/                # zustand: auth-store (persist), cart-store (persist+sync), ui-store (theme)
│   │   ├── hooks/                # useAuth, useMe, useProducts, useWebSocket
│   │   ├── components/
│   │   │   ├── ui/               # Button, Card, Input, Badge, Modal, Skeleton, Avatar (наконец реально используем)
│   │   │   ├── layout/           # Header, Footer, MobileNav, ThemeProvider, ProtectedRoute, Page
│   │   │   └── features/         # ProductCard, CartItemRow, CheckoutSteps, Chat, StatsCard, StatusBadge...
│   │   ├── pages/
│   │   │   ├── Home.tsx, Catalog.tsx, Product.tsx, Farmers.tsx, FarmerProfile.tsx,
│   │   │   │   About.tsx, Terms.tsx
│   │   │   ├── Login.tsx, Register.tsx, ForgotPassword.tsx
│   │   │   ├── Cart.tsx, Checkout.tsx, Chat.tsx
│   │   │   ├── Dashboard.tsx, Orders.tsx, OrderDetail.tsx, Favorites.tsx, Profile.tsx
│   │   │   ├── FarmerDashboard.tsx, FarmerProducts.tsx, FarmerProductForm.tsx, FarmerOrders.tsx
│   │   │   └── AdminDashboard.tsx, AdminApplications.tsx, AdminUsers.tsx, AdminOrders.tsx, AdminPromotions.tsx
│   │   ├── styles/globals.css    # перенос дизайн-системы: темы, .glass, .glass-card, gradient-hero, анимации
│   │   └── utils/                # cn, formatPrice (₸), dates
│   ├── index.html
│   ├── vite.config.ts            # dev-proxy: /api, /ws, /uploads → localhost:8080
│   ├── tsconfig.json
│   ├── Dockerfile                # node build → nginx
│   └── nginx.conf                # SPA fallback, прокси /api /ws /uploads
├── backend/
│   ├── cmd/api/main.go           # инициализация: config → db → migrations → router → ws hub → http server, graceful shutdown
│   ├── internal/
│   │   ├── config/config.go      # env: PORT, DATABASE_URL, JWT_SECRET, CORS_ORIGINS, UPLOAD_DIR, DELIVERY_FREE_FROM...
│   │   ├── database/             # pgx pool, goose-migrations, seed
│   │   ├── middleware/           # Auth, Role, CORS, Recover, RequestID, RateLimit (auth-роуты)
│   │   ├── auth/                 # jwt.go (access/refresh), bcrypt, refresh-token repo
│   │   ├── models/               # Profile, Product, Order, OrderItem, Review, Category, Conversation, Message, Promotion, Referral, FarmerApplication
│   │   ├── dto/                  # Request/Response + валидация (go-playground/validator)
│   │   ├── repositories/         # profiles, categories, products, cart, orders, reviews, favorites,
│   │   │                         # applications, conversations, messages, promotions, referrals, refresh_tokens
│   │   ├── services/             # бизнес-логика: AuthService, ProductService, OrderService (checkout!),
│   │   │                         # ReviewService (rating), ChatService, PromoService, ReferralService, AdminService, XpService
│   │   ├── handlers/             # http-хендлеры по доменам (тонкие: parse → service → response)
│   │   ├── ws/                   # hub.go (register/unregister/broadcast), client.go, auth via token query
│   │   ├── storage/              # interface Storage { Save(name, r) (url, error) }; localfs.go (том), S3 — позже
│   │   └── router/router.go      # chi mux: /api/v1/*, /uploads static, /healthz
│   ├── migrations/               # 0001_init.up/down.sql, 0002_seed.up.sql ...
│   ├── api/openapi.yaml          # контракт API (генерируется вручную по хендлерам)
│   ├── go.mod
│   ├── Dockerfile                # multistage: go build → scratch/alpine
│   └── Makefile                  # run, test, migrate, seed, docker
├── docker-compose.yml            # postgres:16 (volume), backend (build, 8080), frontend (nginx, 3000)
├── .env.example                  # DATABASE_URL, JWT_SECRET, CORS_ORIGINS, ...
├── Makefile                      # up, down, dev-backend, dev-frontend, migrate, seed, test
├── README.md                     # архитектура (mermaid), quickstart, описание API, деплой
└── plans/                        # доки (текущие файлы сохраняем)
```

**Удаляется при перезаписи:** старый `src/` (Next.js), `supabase-schema.sql`, `farmer-applications.sql`,
`vercel.json`, `wrangler.jsonc`, `open-next.config.ts`, `next.config.ts`, `.github/workflows/deploy.yml`
(заменится на новый workflow при необходимости), `sitemap.ts`.

---

## 3. Схема PostgreSQL

```sql
-- 0001_init.up.sql

CREATE TYPE user_role      AS ENUM ('customer','farmer','admin');
CREATE TYPE order_status   AS ENUM ('pending','confirmed','preparing','delivering','delivered','cancelled');
CREATE TYPE delivery_method AS ENUM ('delivery','pickup');
CREATE TYPE app_status     AS ENUM ('pending','approved','rejected');
CREATE TYPE referral_status AS ENUM ('pending','rewarded');

CREATE TABLE profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  telegram      TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'customer',
  city          TEXT NOT NULL DEFAULT 'Актобе',
  address       TEXT,
  bio           TEXT,
  farm_name     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  xp            INTEGER NOT NULL DEFAULT 0,
  level         INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  description TEXT,
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id        UUID REFERENCES categories(id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  description        TEXT,
  price              NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  old_price          NUMERIC(10,2),
  unit               TEXT NOT NULL DEFAULT 'кг',
  quantity_available INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  images             TEXT[] NOT NULL DEFAULT '{}',
  is_active          BOOLEAN NOT NULL DEFAULT true,
  is_featured        BOOLEAN NOT NULL DEFAULT false,
  organic            BOOLEAN NOT NULL DEFAULT false,
  rating             NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count       INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_farmer    ON products(farmer_id);
CREATE INDEX idx_products_category  ON products(category_id);
CREATE INDEX idx_products_active    ON products(is_active) WHERE is_active;
CREATE INDEX idx_products_featured  ON products(is_featured) WHERE is_featured;
CREATE INDEX idx_products_created   ON products(created_at DESC);

CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, product_id)
);

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    SERIAL UNIQUE,
  customer_id     UUID NOT NULL REFERENCES profiles(id),
  farmer_id       UUID NOT NULL REFERENCES profiles(id),
  status          order_status NOT NULL DEFAULT 'pending',
  subtotal        NUMERIC(10,2) NOT NULL,
  discount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL,
  delivery_method delivery_method NOT NULL DEFAULT 'delivery',
  delivery_address TEXT,
  notes           TEXT,
  payment_method  TEXT NOT NULL DEFAULT 'cash',
  promo_code      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_farmer   ON orders(farmer_id);
CREATE INDEX idx_orders_status   ON orders(status);
CREATE INDEX idx_orders_created  ON orders(created_at DESC);

CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(10,2) NOT NULL,
  total        NUMERIC(10,2) NOT NULL
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id),
  product_id  UUID NOT NULL REFERENCES products(id),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id)
);
CREATE INDEX idx_reviews_product ON reviews(product_id);

CREATE TABLE favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, product_id)
);

CREATE TABLE farmer_applications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  phone      TEXT NOT NULL,
  farm_name  TEXT NOT NULL,
  city       TEXT NOT NULL DEFAULT 'Актобе',
  products   TEXT NOT NULL,
  experience TEXT,
  bio        TEXT,
  status     app_status NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_applications_status ON farmer_applications(status);

CREATE TABLE conversations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_b  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (participant_a, participant_b),
  CHECK (participant_a <> participant_b)
);
CREATE INDEX idx_conv_a ON conversations(participant_a);
CREATE INDEX idx_conv_b ON conversations(participant_b);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id),
  text            TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;

CREATE TABLE promotions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT NOT NULL UNIQUE,
  description      TEXT,
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
  min_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses         INTEGER NOT NULL DEFAULT 100,
  current_uses     INTEGER NOT NULL DEFAULT 0,
  expires_at       TIMESTAMPTZ,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID NOT NULL REFERENCES profiles(id),
  referred_id   UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  reward_amount NUMERIC(10,2) NOT NULL DEFAULT 500,
  status        referral_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
```

**0002_seed.up.sql** — 10 категорий (как в текущем проекте: myaso, molochnye, owooshi→ovoshi, frukty, med, yaytsa, zelen, konservy, vyapechka→vypechka, maslo) + админ-пользователь
(`admin@ferma.kz` / из env `ADMIN_EMAIL`/`ADMIN_PASSWORD`, роль `admin`).

> Демонстрационные данные (фермеры, товары) — отдельный опциональный `make seed:demo`
> (скрипт с 6 мок-фермерами и 12 товарами из текущего проекта), чтобы фронтенд сразу жил.

---

## 4. REST API (`/api/v1`)

Ответ-конверт везде: `{"success": boolean, "data": T|null, "error": string|null}` (как сейчас).

### Auth
| Метод | Путь | Описание |
|---|---|---|
| POST | `/auth/register` | `{email,password,full_name,role:"customer"\|"farmer",phone?,referral_code?}` → 201. farmer-роль не выдаётся сразу: создаётся application (pending). |
| POST | `/auth/login` | `{email,password}` → access JWT в теле + refresh в httpOnly-cookie. Rate-limit. |
| POST | `/auth/refresh` | cookie refresh → новый access (rotate refresh). |
| POST | `/auth/logout` | отзыв refresh. |
| GET  | `/auth/me` | профиль текущего. |
| POST | `/auth/forgot-password` | заглушка: валидация email, ответ «в разработке». |

### Каталог
| Метод | Путь | Доступ |
|---|---|---|
| GET | `/categories` | public |
| GET | `/products?category=&farmer=&q=&min_price=&max_price=&sort=&featured=&page=&limit=` | public |
| GET | `/products/{id}` | public (404 если неактивный и не владелец) |
| POST | `/products` | farmer |
| PATCH | `/products/{id}` | владелец-farmer |
| DELETE | `/products/{id}` | владелец-farmer (soft: is_active=false) |
| POST | `/products/{id}/images` (multipart) | владелец-farmer → добавляет в `images[]` |
| DELETE | `/products/{id}/images?url=` | владелец |

### Фермеры и заявки
| Метод | Путь | Доступ |
|---|---|---|
| GET | `/farmers?city=&q=` | public (role=farmer, active) |
| GET | `/farmers/{id}` | public: профиль + товары + рейтинг |
| POST | `/farmers/apply` | auth: `{full_name,phone,farm_name,city,products,experience?,bio?}` |
| GET | `/farmers/apply/mine` | auth: статус своей заявки |

### Корзина
| Метод | Путь |
|---|---|
| GET | `/cart` (посты с product/farmer/ценой) |
| PUT | `/cart/{product_id}` `{quantity}` |
| DELETE | `/cart/{product_id}` |
| DELETE | `/cart` |

### Заказы
| Метод | Путь | Доступ |
|---|---|---|
| POST | `/orders` `{delivery_method, delivery_address?, notes?, payment_method, promo_code?}` | auth. checkout: корзина → группировка по farmer → N заказов; валидация остатков; промо; стоимость доставки (0 от 10 000 ₸ иначе 500 ₸); очистка корзины. |
| GET | `/orders?status=` | customer — свои; farmer — входящие; admin — все (через `/admin/orders`) |
| GET | `/orders/{id}` | участник / admin |
| PATCH | `/orders/{id}/status` `{status}` | farmer: allowed transitions pending→confirmed→preparing→delivering→delivered, *→cancelled; customer: pending→cancelled. На delivered: +XP, отзывы становятся доступными. |

### Отзывы / избранное
| Метод | Путь |
|---|---|
| GET | `/products/{id}/reviews?page=` |
| POST | `/orders/{id}/reviews` `{product_id, rating, comment}` — только по доставленному, unique (order,product); пересчёт `products.rating/review_count`. |
| GET | `/favorites` |
| POST | `/favorites` `{product_id}` |
| DELETE | `/favorites/{product_id}` |

### Чат
| Метод | Путь |
|---|---|
| GET | `/chat/conversations` — список: собеседник, product (опц.), last_message, unread_count |
| GET | `/chat/conversations/{id}/messages` (+ помечает входящие read) |
| POST | `/chat/messages` `{recipient_id, text, product_id?}` — creates-or-gets conversation |
| WS  | `/ws?token=<access>` — сервер шлёт `{type:"message"|"read", payload}`; клиент → `{type:"ping"}` |

### Рефералы
| Метод | Путь |
|---|---|
| GET | `/referrals/mine` — код (первая часть email/создаваемый при первом запросе), список, статусы |

### Admin
| Метод | Путь |
|---|---|
| GET | `/admin/stats` — users/farmers/orders/revenue + weekly chart (7 дней) |
| GET | `/admin/users?role=&q=&page=` |
| PATCH | `/admin/users/{id}` `{is_active?, role?}` |
| GET | `/admin/applications?status=` |
| PATCH | `/admin/applications/{id}` `{status:"approved"\|"rejected"}` → при approved: `profiles.role=farmer` + farm_name/city из заявки |
| GET | `/admin/orders?status=` |
| GET/POST | `/admin/promotions` |
| PATCH/DELETE | `/admin/promotions/{id}` |

### Прочее
- `GET /healthz` — liveness (без auth).
- `POST /uploads` (multipart, auth, farmer) → `{url}`; static `GET /uploads/*`.
- Ошибки: 400 (валидация, RU-сообщения), 401, 403, 404, 409, 422 (бизнес), 500.

---

## 5. Ключевые бизнес-процессы

### 5.1 Регистрация фермера → модерация
```mermaid
flowchart LR
  A["POST /auth/register role=farmer"] --> B["profiles: role=customer"]
  B --> C["farmer_applications: pending"]
  C --> D["Админ: PATCH applications approved"]
  D --> E["profiles: role=farmer, farm_name, city"]
  E --> F["Открывается /farmer дашборд и CRUD товаров"]
```

### 5.2 Checkout
```mermaid
flowchart TB
  A["POST /orders + promo_code"] --> B["Читаем корзину с ценами из БД"]
  B --> C["Группируем по farmer"]
  C --> D["Валидация остатков и promo"]
  D --> E["Создаём N заказов + order_items в одной транзакции"]
  E --> F["Уменьшаем quantity_available"]
  E --> G["Считаем: subtotal, discount, delivery_fee, total"]
  E --> H["Очищаем корзину, +uses у promo"]
```
Доставка: бесплатно при subtotal ≥ 10 000 ₸, иначе 500 ₸ (константа из config).

### 5.3 Статусы заказа
```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> confirmed: farmer
  pending --> cancelled: customer/farmer
  confirmed --> preparing: farmer
  preparing --> delivering: farmer
  delivering --> delivered: farmer
  delivered --> [*]: отзывы + XP
  cancelled --> [*]
```

### 5.4 Чат (WS)
```mermaid
sequenceDiagram
  participant C1 as Покупатель
  participant API as Go API
  participant WS as WS Hub
  participant C2 as Фермер
  C1->>API: POST /chat/messages
  API->>API: INSERT messages + conversation
  API->>WS: broadcast(user=farmer)
  WS-->>C2: WebSocket message event
  C2->>API: GET messages (read)
  API->>WS: broadcast read event
  WS-->>C1: read event
```

---

## 6. Фронтенд: маршруты и роли

```
/                          Home (hero, категории, шаги, FAQ)        public
/catalog                   Каталог: поиск, чипы категорий, сортировка  public
/products/:id              Товар: галерея, qty, корзина, чат, отзывы   public
/farmers                   Список фермеров                          public
/farmers/:id               Профиль фермера + товары                  public
/about, /terms                                         public
/login, /register, /forgot-password                     public
/cart, /checkout, /chat                      auth (customer/farmer)
/dashboard, /dashboard/orders, /dashboard/orders/:id,
/dashboard/favorites, /dashboard/profile     role=customer
/farmer, /farmer/products, /farmer/products/new,
/farmer/products/:id/edit, /farmer/orders    role=farmer
/admin, /admin/applications, /admin/users,
/admin/orders, /admin/promotions             role=admin
*                            404
```

- `ProtectedRoute` — читает `useAuthStore` + `requireRole`; до загрузки /me — спиннер;
  после логина редирект по роли: customer→/dashboard, farmer→/farmer, admin→/admin.
- Cart-store: локально (zustand+persist) для гостя; при auth — синхронизация с `/cart` (DB — источник правды).
- Header/MobileNav/Footer/ThemeProvider — перенос существующего дизайна 1:1 (glass-система).
- Чат: `useWebSocket` с reconnect (backoff), список диалогов, непрочитанные, online-индикатор по последнему сообщению.

---

## 7. Безопасность

- bcrypt (cost 10); JWT RS256/HS256 (HS256 с `JWT_SECRET` ≥ 32 байт) access 15m, refresh 30d (rotate + store hash, revoke on logout).
- Middleware: `RequireAuth` (parse JWT, проверка is_active), `RequireRole(...)`.
- CORS: whitelist из `CORS_ORIGINS` (dev: http://localhost:5173).
- Rate-limit: `x/time/rate` на /auth/login (20/мин/IP) и /auth/register (5/час/IP).
- Валидация всех DTO (validator); размеры полей ограничены; uploads: MIME-проверка (jpeg/png/webp), ≤ 5 МБ, расширение из MIME.
- SQL — только параметризованные запросы (pgx); без RLS, но все репозитории принимают `userID` и фильтруют по нему.
- Заголовки: X-Content-Type-Options, X-Frame-Options, Referrer-Policy (middleware).
- Логи: slog, структурированные, без токенов/паролей.

---

## 8. Конфигурация и окружение

`.env.example` (корень, используется и compose, и dev):
```
PORT=8080
DATABASE_URL=postgres://ferma:ferma@localhost:5432/ferma?sslmode=disable
JWT_SECRET=change-me-32-bytes-min
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=720h
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
UPLOAD_DIR=./storage/uploads
DELIVERY_FEE=500
DELIVERY_FREE_FROM=10000
ADMIN_EMAIL=admin@ferma.kz
ADMIN_PASSWORD=admin123
POSTGRES_PASSWORD=ferma
FRONTEND_PORT=3000
```

`docker-compose.yml`:
- `db`: postgres:16-alpine, volume `pgdata`, healthcheck pg_isready, инициализация из `backend/migrations` через backend-миграции (goose) при старте API.
- `backend`: build `./backend`, env из `.env`, зависит от db (healthy), port 8080, volume `uploads`.
- `frontend`: build `./frontend` (nginx), port 3000, зависит от backend.

---

## 9. Тестирование

- **Go**: тесты сервисов (OrderService.checkout — расчёты, промо, остатки; ReviewService.rating; AuthService — jwt/refresh) на `testcontainers-go` (Postgres) или sqlmock для репозиториев; httptest для ключевых хендлеров (auth, orders, admin RBAC).
- **Frontend**: type-check + vite build как gate; e2e-сценарии вручную по чек-листу (опционально Playwright позже).
- CI (новый workflow): backend `go vet + go test + build`, frontend `tsc --noEmit + npm run build`.

---

## 10. Этапы выполнения (порядок работ)

### Этап 1 — Каркас монорепо
1. Удалить старый Next.js код (`src/`, next/supabase/vercel/wrangler конфиги, старый README-контент); создать структуру `frontend/`, `backend/`, корневые Makefile, .env.example, .gitignore (обновить), .dockerignore.

### Этап 2 — Бэкенд: фундамент
2. `go mod init`, config, slog, pgx pool, goose-запуск миграций, `/healthz`, CORS, Recover, RequestID, error envelope, `main.go` с graceful shutdown, Dockerfile backend.
3. Миграции: `0001_init` (все таблицы из §3), `0002_seed` (категории + admin), `0003_demo` (опц.: демо-фермеры/товары).
4. Auth: auth-пакет (jwt, bcrypt, refresh repo), хендлеры register/login/refresh/logout/me/forgot, middleware Auth/Role, rate-limit; репозиторий profiles.

### Этап 3 — Бэкенд: домены
5. Категории + товары: репозитории, сервисы (поиск/фильтры/пагинация), хендлеры CRUD + owner-проверки.
6. Загрузки: storage (localfs) + `/uploads` static + endpoint картинок товара.
7. Фермеры + заявки: список/профиль, apply, admin applications (approve → смена роли), admin users.
8. Корзина: репозиторий + хендлеры.
9. Заказы: OrderService (checkout-транзакция, статусы, XP), хендлеры, admin orders.
10. Промо: PromoService (validate/apply), admin CRUD.
11. Отзывы + рейтинг, избранное.
12. Чат: conversations/messages + WS hub (auth token, broadcast, read-события).
13. Рефералы (code, mine).
14. Admin stats (агрегаты + weekly chart).
15. Тесты бэкенда по чек-листу §9.

### Этап 4 — Фронтенд: фундамент
16. Vite-scaffold (React 19, TS strict, Tailwind v4, eslint), перенос globals.css-дизайн-системы, UI-кит (Button/Card/Input/Badge/Modal/Skeleton/Avatar), layout (Header/Footer/MobileNav/ThemeProvider/Toaster), API client + типы + auth-store + ProtectedRoute.
17. Страницы auth: Login, Register (role-switch, referral code), ForgotPassword.

### Этап 5 — Фронтенд: публичное
18. Home (реальные категории из API), Catalog (search/filter/sort/pagination), Product (галерея, qty, добавить в корзину, favorite, чат-CTA, отзывы, табы).
19. Farmers + FarmerProfile.
20. About, Terms, 404.

### Этап 6 — Фронтенд: покупатель
21. Cart (sync с API при auth), Checkout (шаги: доставка → промо/оплата → подтверждение; создание заказов).
22. Dashboard покупателя: stats (XP/уровень), заказы (статусы, отмена), заказ-детали, избранное, профиль (редактирование).

### Этап 7 — Фронтенд: фермер и админ
23. Чат (список + диалог, WS, непрочитанные).
24. Панель фермера: товары (таблица + форма + загрузка картинок), заказы (принять/статусы), mini-статистика.
25. Админка: дашборд (статы + бар-чарт недели), заявки (approve/reject), пользователи (поиск, блок, роль), заказы, акции (CRUD).

### Этап 8 — Инфра и финиш
26. docker-compose.yml + Dockerfile frontend (nginx: SPA fallback, /api /ws /uploads proxy) + Makefile (up/dev/migrate/seed/test).
27. README: архитектура (mermaid), quickstart (3 команды), API-таблица, env-таблица; .env.example; обновление .gitignore/.dockerignore.
28. Финальная проверка: `go test`, `tsc --noEmit`, `npm run build`, `docker compose up` smoke: регистрация → заявка → модерация → товар → корзина → заказ → чат.

---

## 11. Риски и заметки

- **SPA и SEO**: для MVP принимаем; при необходимости — статический пререндер /catalog и /products позже.
- **WebSocket за nginx**: включить `proxy_set_header Upgrade/Connection` (задачу учесть в nginx.conf).
- **Объём работ**: это полный rewrite; выполняем строго по этапам §10, каждый этап — компилируемое состояние.
- **Совместимость данных**: миграция данных со Supabase не планируется (демо-данные seed-скриптом).
- Дизайн, тексты страниц (terms/about/FAQ) и мок-данные переносятся из текущего проекта (см. `plans/ferma-kz-full-analysis.md` §21).
