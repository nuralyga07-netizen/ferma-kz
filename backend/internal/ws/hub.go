package ws

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// Hub управляет WebSocket-подключениями.
// Клиенты группируются по user_id: broadcastTo(userID) доставляет
// событие всем соединениям конкретного пользователя (несколько вкладок).
type Hub struct {
	clients map[string]map[*Client]struct{} // userID -> set of connections
	mu      sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{clients: make(map[string]map[*Client]struct{})}
}

// Register подключает клиент (вызывается при успешной авторизации сокета).
func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	if h.clients[c.UserID] == nil {
		h.clients[c.UserID] = make(map[*Client]struct{})
	}
	h.clients[c.UserID][c] = struct{}{}
	h.mu.Unlock()
	slog.Info("ws connected", "user", c.UserID)
}

// Unregister отключает клиента.
func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if set, ok := h.clients[c.UserID]; ok {
		if _, exists := set[c]; exists {
			delete(set, c)
			close(c.send)
		}
		if len(set) == 0 {
			delete(h.clients, c.UserID)
		}
	}
}

// BroadcastTo — JSON-событие всем соединениям пользователя.
func (h *Hub) BroadcastTo(userID string, event string, payload any) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	msg, err := json.Marshal(map[string]any{"type": event, "data": payload})
	if err != nil {
		slog.Error("ws marshal", "err", err)
		return
	}
	for c := range h.clients[userID] {
		select {
		case c.send <- msg:
		default:
			// Медленный клиент — не блокируем, отбрасываем событие
			slog.Warn("ws slow client, dropping event", "user", c.UserID)
		}
	}
}

// Online — есть ли активные соединения пользователя.
func (h *Hub) Online(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients[userID]) > 0
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true }, // CORS обрабатывается на роутере
}

// ServeWS — апгрейд HTTP → WebSocket. Authorize возвращает userID или ошибку.
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request, authorize func(r *http.Request) (string, error)) {
	userID, err := authorize(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return // Upgrade уже ответил ошибкой
	}
	c := &Client{
		hub:    h,
		conn:   conn,
		send:   make(chan []byte, 64),
		UserID: userID,
	}
	h.Register(c)
	go c.writePump()
	go c.readPump()
}
