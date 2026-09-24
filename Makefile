.PHONY: up down dev-backend dev-frontend migrate migrate-down seed-demo test test-backend test-frontend build

up:            ## Поднять весь стек (Postgres + API + Frontend)
	docker compose up --build -d

down:          ## Остановить стек
	docker compose down

dev-backend:   ## Запустить Go API локально (нужен Postgres: docker compose up -d db)
	cd backend && go run ./cmd/api

dev-frontend:  ## Запустить Vite dev-сервер
	cd frontend && npm run dev

migrate:       ## Применить миграции
	cd backend && go run ./cmd/migrate

migrate-down:  ## Откатить последнюю миграцию
	cd backend && go run ./cmd/migrate -down

seed-demo:     ## Загрузить демо-данные (фермеры, товары)
	cd backend && go run ./cmd/seed

test: test-backend test-frontend

test-backend:
	cd backend && go vet ./... && go test ./...

test-frontend:
	cd frontend && npm run typecheck && npm run build

build:         ## Собрать образы
	docker compose build
