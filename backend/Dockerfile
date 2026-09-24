# syntax=docker/dockerfile:1

# --- Сборка ---
FROM golang:1.25-alpine AS builder

WORKDIR /src
ENV CGO_ENABLED=0

# Кэшируем зависимости
COPY go.mod go.sum* ./
RUN go mod download 2>/dev/null || go mod tidy

COPY . .

RUN go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api && \
    go build -trimpath -ldflags="-s -w" -o /out/migrate ./cmd/migrate && \
    go build -trimpath -ldflags="-s -w" -o /out/seed ./cmd/seed

# --- Продакшен ---
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -S app && adduser -S app -G app && \
    mkdir -p /data/uploads && chown -R app:app /data

WORKDIR /app
COPY --from=builder /out/api /out/migrate /out/seed /app/

USER app
ENV UPLOAD_DIR=/data/uploads \
    PORT=8080

EXPOSE 8080

ENTRYPOINT ["/app/api"]
