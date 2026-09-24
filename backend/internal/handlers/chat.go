package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"ferma-kz/backend/internal/auth"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/services"
	"ferma-kz/backend/internal/ws"
)

type ChatHandler struct {
	chat *services.ChatService
	hub  *ws.Hub
}

func NewChatHandler(svc *services.ChatService, hub *ws.Hub) *ChatHandler {
	return &ChatHandler{chat: svc, hub: hub}
}

// List — GET /conversations (auth)
func (h *ChatHandler) List(w http.ResponseWriter, r *http.Request) {
	list, err := h.chat.List(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, list, http.StatusOK)
}

// Start — POST /conversations {user_id, product_id?} (auth)
func (h *ChatHandler) Start(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID    string `json:"user_id"`
		ProductID string `json:"product_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	view, err := h.chat.Start(r.Context(), auth.UserID(r.Context()), req.UserID, req.ProductID)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, view, http.StatusCreated)
}

// ListMessages — GET /conversations/{id}/messages?limit=&before= (auth).
// before — ISO-8601 (например, из created_at последнего сообщения).
func (h *ChatHandler) ListMessages(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	var before *time.Time
	if v := q.Get("before"); v != "" {
		t, err := time.Parse(time.RFC3339Nano, v)
		if err != nil {
			t, err = time.Parse(time.RFC3339, v)
			if err != nil {
				httpx.Fail(w, http.StatusBadRequest, "Некорректный параметр before (ожидается RFC3339)")
				return
			}
		}
		before = &t
	}
	list, err := h.chat.ListMessages(r.Context(), auth.UserID(r.Context()), r.PathValue("id"), limit, before)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	httpx.OK(w, list, http.StatusOK)
}

// Send — POST /conversations/{id}/messages {text} (auth).
// Сообщение сохраняется и дублируется через WS собеседнику.
func (h *ChatHandler) Send(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	userID := auth.UserID(r.Context())
	convID := r.PathValue("id")
	m, err := h.chat.Send(r.Context(), userID, convID, req.Text)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	h.broadcastToOther(r.Context(), convID, userID, "message", m)
	httpx.OK(w, m, http.StatusCreated)
}

// MarkRead — POST /conversations/{id}/read {user_id} (auth).
// Помечает сообщения от user_id прочитанными и шлёт WS-событие read.
func (h *ChatHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID string `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == "" {
		httpx.Fail(w, http.StatusBadRequest, "Некорректный запрос")
		return
	}
	userID := auth.UserID(r.Context())
	convID := r.PathValue("id")
	n, err := h.chat.MarkRead(r.Context(), userID, convID, req.UserID)
	if err != nil {
		httpx.HandleError(w, err)
		return
	}
	if n > 0 {
		h.broadcastToOther(r.Context(), convID, userID, "read", map[string]any{
			"conversation_id": convID,
			"by":              userID,
			"at":              time.Now().UTC(),
		})
	}
	httpx.OK(w, map[string]int{"read": n}, http.StatusOK)
}

// broadcastToOther — событие второму участнику диалога.
func (h *ChatHandler) broadcastToOther(ctx context.Context, conversationID, senderID, event string, payload any) {
	if h.hub == nil {
		return
	}
	other := h.chat.OtherID(ctx, conversationID, senderID)
	if other != "" {
		h.hub.BroadcastTo(other, event, payload)
	}
}
