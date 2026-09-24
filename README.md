# Ferma.kz 🌿

**Свежие фермерские продукты напрямую, без посредников.**

Маркетплейс для прямых продаж от фермеров к покупателям в Казахстане. Полностью переписан с чистого листа: отдельный Go-бэкенд и React-фронтенд, PostgreSQL.

---

## 🧱 Стек

| Слой | Технологии |
|---|---|
| **Фронтенд** | React 19, TypeScript (strict), Vite 7, Tailwind CSS v4, Zustand, Framer Motion, React Router v7, lucide-react, sonner |
| **Бэкенд** | Go 1.25, chi v5, pgx v5, gorilla/websocket, golang-jwt/v5, bcrypt, goose (миграции), x/time/rate |
| **База данных** | PostgreSQL 16 |
| **Инфраструктура** | Docker / Docker Compose, nginx (SPA + reverse-proxy) |

---

## 🏗 Архитектура

Monorepo из двух независимых приложений, которые общаются по REST + WebSocket через единый API-контракт (envelope `{"success","data","error"}`).

```
.
├── backend/                     # Go API (net/http + chi)
│   ├── cmd/
│   │   ├── api/                 # HTTP-сервер (DI-составка, graceful shutdown)
│   │   ├── migrate/             # goose up/down
│   │   └── seed/                # демо-данные (фермеры, товары, промокоды)
│   ├── internal/
│   │   ├── config/              # конфигурация из env
│   │   ├── database/            # pgxpool + goose + embed-миграции
│   │   ├── models/              # доменные структуры + типы
│   │   ├── dto/                 # запросы валидации
│   │   ├── auth/                # JWT, bcrypt, middleware (auth/role)
│   │   ├── httpx/               # envelope-ответы, ошибки
│   │   ├── repositories/        # слой доступа к данным (SQL)
│   │   ├── services/            # бизнес-логика (транзакции, правила)
│   │   ├── handlers/            # HTTP-хендлеры (тонкие)
│   │   ├── router/              # chi-роутер, CORS, rate-limit, /ws
│   │   ├── storage/             # локальная FS для загрузок
│   │   └── ws/                  # WebSocket-hub (чат в реальном времени)
│   └── Dockerfile
├── frontend/                    # React SPA (Vite)
│   ├── src/
│   │   ├── components/          # UI-кит, layout, фичи
│   │   ├── pages/               # страницы (public/account/farmer/admin/chat)
│   │   ├── store/               # Zustand (auth, cart, theme) + persist
│   │   ├── hooks/               # useAddToCart, useWebSocket
│   │   ├── lib/                 # api-клиент, утилиты
│   │   └── types.ts             # типы API (единый контракт)
│   ├── nginx.conf               # SPA fallback + proxy /api /ws /uploads
│   └── Dockerfile
├── docker-compose.yml           # db + backend + frontend
├── Makefile                     # up/down/dev/migrate/seed
├── .env.example
└── README.md
```

**Слои бэкенда** строго разделены: `handlers → services → repositories → PostgreSQL`. Транзакции и бизнес-правила живут в `services`, SQL — в `repositories`.

---

## 🚀 Быстрый старт

### Вариант A — Docker Compose (всё сразу)

```bash
cp .env.example .env       # при желании поправить секреты
docker compose up --build -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api/v1
- Healthcheck: http://localhost:8080/healthz

При первом старте бэкенд сам применяет миграции и создаёт администратора из `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### Вариант B — Локальная разработка

```bash
# 1. База данных
docker compose up -d db

# 2. Бэкенд (в отдельном терминале)
cd backend
cp ../.env.example .env   # или задайте env вручную
go run ./cmd/migrate      # миграции
go run ./cmd/seed         # демо-данные (опционально)
go run ./cmd/api          # API на :8080

# 3. Фронтенд (в третьем терминале)
cd frontend
npm install
npm run dev               # Vite на :3000, проксирует /api /ws /uploads → :8080
```

Откройте http://localhost:3000.

### Демо-доступ

- **Админ:** `admin@ferma.kz` / `admin123`
- **Фермер / покупатель:** зарегистрируйтесь или используйте `make seed-demo` (пароль демо-фермеров — `demo1234`).

---

## 🛠 Makefile

| Команда | Что делает |
|---|---|
| `make up` | Поднять весь стек (db + api + frontend) |
| `make down` | Остановить стек |
| `make dev-backend` | Запустить Go API локально |
| `make dev-frontend` | Запустить Vite dev-сервер |
| `make migrate` | Применить миграции |
| `make migrate-down` | Откатить последнюю миграцию |
| `make seed-demo` | Загрузить демо-данные |
| `make test` | `go vet` + `go test` + `tsc` + `vite build` |
| `make build` | Собрать Docker-образы |

---

## 📄 API (v1)

Все ответы обёрнуты в envelope: `{"success": bool, "data": T|null, "error": string|null}`.

**Auth**
- `POST /auth/register` · `POST /auth/login` (rate-limit по IP)
- `POST /auth/refresh` (httpOnly-cookie `ferma_refresh`) · `POST /auth/logout`
- `GET /auth/me` · `PATCH /auth/me`
- `POST /auth/forgot-password`

**Каталог (публично)**
- `GET /products?category=&q=&sort=&min_price=&max_price=&organic=&featured=&page=&limit=&mine=`
- `GET /products/{id}` · `GET /products/{id}/reviews` · `GET /categories`
- `GET /farmers?q=&limit=&offset=` · `GET /farmers/{id}`

**Корзина**
- `GET /cart` · `POST /cart` · `PATCH /cart/{productId}` · `DELETE /cart/{productId}`

**Заказы**
- `POST /orders/checkout` (корзина → N заказов по фермерам в одной транзакции)
- `GET /orders?status=` · `GET /orders/{id}` · `PATCH /orders/{id}/status`
- `POST /orders/{id}/reviews` (только для доставленных)

**Избранное**
- `GET /favorites` · `POST /favorites/{productId}` · `DELETE /favorites/{productId}`

**Чат**
- `GET /conversations` · `POST /conversations` · `GET /conversations/{id}/messages?before=`
- `POST /conversations/{id}/messages` · `POST /conversations/{id}/read`
- WebSocket: `GET /ws?token=<access_jwt>`

**Рефералы**
- `GET /referrals` · `GET /referrals/code`

**Загрузки / фермер**
- `POST /uploads` (multipart) · `POST /farmers/apply` · `GET /farmers/apply/mine`

**CRUD товаров (роль farmer/admin)**
- `POST /products` · `PATCH /products/{id}` · `DELETE /products/{id}` (деактивация)

**Админ (роль admin)**
- `GET /admin/stats` · `GET /admin/users` · `PATCH /admin/users/{id}/status`
- `GET /admin/applications` · `POST /admin/applications/{id}/review`
- `GET|POST /admin/promotions` · `PATCH|DELETE /admin/promotions/{id}`

### Роли
- `customer` — покупает, оценивает, общается.
- `farmer` — получает роль после **одобрения заявки** администратором; управляет товарами и заказами.
- `admin` — модерация, пользователи, промокоды, статистика.

### Поток заказа
`pending → confirmed → preparing → delivering → delivered` (или `cancelled`).
Покупатель отменяет только `pending`; фермер двигает свои заказы; админ — любые. При `delivered` покупателю начисляется +10 XP, рефереру — награда за первый заказ приглашённого.

---

## ⚙️ Переменные окружения

Скопируйте `.env.example` в `.env` и при необходимости заполните:

```bash
cp .env.example .env
```

| Переменная | По умолчанию | Описание |
|---|---|---|
| `PORT` | `8080` | Порт API |
| `DATABASE_URL` | — | DSN PostgreSQL |
| `JWT_SECRET` | — | Секрет подписи JWT (обязательно смените) |
| `JWT_ACCESS_TTL` | `15m` | Время жизни access-токена |
| `JWT_REFRESH_TTL` | `720h` | Время жизни refresh-токена |
| `CORS_ORIGINS` | `http://localhost:3000` | Разрешённые origins (через запятую) |
| `UPLOAD_DIR` | `./storage/uploads` | Каталог загрузок |
| `DELIVERY_FEE` | `500` | Стоимость доставки, ₸ |
| `DELIVERY_FREE_FROM` | `10000` | Порог бесплатной доставки, ₸ |
| `REFERRAL_REWARD` | `500` | Награда рефереру, ₸/XP |
| `ADMIN_EMAIL` | `admin@ferma.kz` | Email администратора (seed) |
| `ADMIN_PASSWORD` | `admin123` | Пароль администратора (seed) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `ferma` | Параметры Postgres (compose) |

---

## 📄 Страницы

**Публичные** — `/` (hero, категории, подборка, фермеры) · `/catalog` (поиск, фильтры, пагинация) · `/product/:id` (галерея, отзывы) · `/farmers` · `/farmers/:id` · `/about` · `/terms`

**Покупатель** — `/login` · `/register` · `/forgot-password` · `/cart` · `/checkout` · `/account/orders` · `/account/orders/:id` · `/account/favorites` · `/account/profile` · `/account/referrals`

**Чат** — `/chat` · `/chat/:id` (WebSocket, непрочитанные, «прочитано»)

**Фермер** — `/farmer` (дашборд) · `/farmer/products` · `/farmer/products/new` · `/farmer/products/:id/edit` · `/farmer/orders`

**Админ** — `/admin` (статистика) · `/admin/users` · `/admin/applications` · `/admin/orders` · `/admin/promotions`

---

## 🗄 База данных

Схема и сиды — в `backend/internal/database/migrations/` (goose, применяются автоматически при старте API и через `cmd/migrate`):

- `profiles` — пользователи (customer/farmer/admin), XP/level, контакты
- `categories`, `products` — каталог (изображения, organic, featured)
- `cart_items` — персональная корзина
- `orders`, `order_items` — заказы с суммами и промо-скидкой
- `reviews` — оценки (UNIQUE order+product)
- `favorites` — избранное
- `conversations`, `messages` — чат
- `referrals` — реферальные связи и статус награды
- `farmer_applications` — заявки фермеров на модерацию
- `promotions` — промокоды
- `refresh_tokens` — httpOnly refresh-сессии

---

## 👨‍🌾 Автор

**Nuraly** — 15 лет, Актобе, Казахстан

---

<p align="center">Сделано с ❤️ для фермеров Казахстана</p>
