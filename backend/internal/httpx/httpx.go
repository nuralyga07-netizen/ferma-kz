package httpx

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"runtime/debug"
)

// AppError — бизнес-ошибка с HTTP-статусом и сообщением на русском.
type AppError struct {
	StatusCode int
	Message    string
}

func (e *AppError) Error() string { return e.Message }

func New(status int, msg string) *AppError { return &AppError{StatusCode: status, Message: msg} }

func BadRequest(msg string) *AppError   { return New(http.StatusBadRequest, msg) }
func Unauthorized(msg string) *AppError { return New(http.StatusUnauthorized, msg) }
func Forbidden(msg string) *AppError    { return New(http.StatusForbidden, msg) }
func NotFound(msg string) *AppError     { return New(http.StatusNotFound, msg) }
func Conflict(msg string) *AppError     { return New(http.StatusConflict, msg) }
func Internal() *AppError {
	return New(http.StatusInternalServerError, "Внутренняя ошибка сервера")
}

// Envelope — единый формат ответа API.
type Envelope[T any] struct {
	Success bool    `json:"success"`
	Data    *T      `json:"data"`
	Error   *string `json:"error"`
}

func OK[T any](w http.ResponseWriter, data T, status int) {
	WriteJSON(w, status, Envelope[T]{Success: true, Data: &data})
}

func OKNoData(w http.ResponseWriter, status int) {
	WriteJSON(w, status, Envelope[any]{Success: true, Data: nil})
}

func Fail(w http.ResponseWriter, status int, msg string) {
	WriteJSON(w, status, Envelope[any]{Success: false, Data: nil, Error: &msg})
}

func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("encode response", "err", err)
	}
}

// HandleError преобразует ошибку в JSON-ответ.
func HandleError(w http.ResponseWriter, err error) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		Fail(w, appErr.StatusCode, appErr.Message)
		return
	}
	slog.Error("unexpected error", "err", err, "stack", string(debug.Stack()))
	InternalFail(w, err)
}

func InternalFail(w http.ResponseWriter, err error) {
	slog.Error("internal error", "err", err)
	Fail(w, http.StatusInternalServerError, "Внутренняя ошибка сервера")
}
