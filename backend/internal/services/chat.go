package services

import (
	"context"
	"strings"
	"time"

	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/repositories"
)

type ChatService struct {
	chat     *repositories.ChatRepo
	profiles *repositories.ProfileRepo
}

func NewChatService(chat *repositories.ChatRepo, profiles *repositories.ProfileRepo) *ChatService {
	return &ChatService{chat: chat, profiles: profiles}
}

// ConversationView — диалог в представлении для клиента.
type ConversationView struct {
	ID            string     `json:"id"`
	OtherID       string     `json:"other_id"`
	OtherName     string     `json:"other_name"`
	OtherAvatar   string     `json:"other_avatar,omitempty"`
	ProductID     *string    `json:"product_id,omitempty"`
	ProductName   *string    `json:"product_name,omitempty"`
	LastMessage   *string    `json:"last_message,omitempty"`
	LastMessageAt *time.Time `json:"last_message_at,omitempty"`
	UnreadCount   int        `json:"unread_count"`
}

// List — диалоги пользователя (REST).
func (s *ChatService) List(ctx context.Context, userID string) ([]ConversationView, error) {
	rows, err := s.chat.ListConversations(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]ConversationView, 0, len(rows))
	for _, r := range rows {
		out = append(out, ConversationView{
			ID:            r.ID,
			OtherID:       r.OtherID,
			OtherName:     r.OtherName,
			OtherAvatar:   r.OtherAvatar,
			ProductID:     r.ProductID,
			LastMessage:   r.LastMessage,
			LastMessageAt: r.LastMessageAt,
			UnreadCount:   r.UnreadCount,
		})
	}
	return out, nil
}

// Start — начать (или получить существующий) диалог с другим пользователем.
func (s *ChatService) Start(ctx context.Context, userID, otherID, productID string) (*ConversationView, error) {
	if strings.TrimSpace(otherID) == "" {
		return nil, httpx.BadRequest("Не указан собеседник")
	}
	if userID == otherID {
		return nil, httpx.BadRequest("Нельзя начать диалог с самим собой")
	}
	other, err := s.profiles.GetByID(ctx, otherID)
	if err != nil {
		return nil, httpx.NotFound("Пользователь не найден")
	}
	if !other.IsActive {
		return nil, httpx.BadRequest("С этим пользователем нельзя общаться")
	}

	conv, err := s.chat.GetOrCreateConversation(ctx, userID, otherID, productID)
	if err != nil {
		return nil, err
	}
	view := &ConversationView{
		ID:        conv.ID,
		OtherID:   otherID,
		OtherName: other.FullName,
		ProductID: conv.ProductID,
	}
	if other.AvatarURL != nil {
		view.OtherAvatar = *other.AvatarURL
	}
	return view, nil
}

// ListMessages — сообщения диалога (новые сверху), before — курсор.
func (s *ChatService) ListMessages(ctx context.Context, userID, conversationID string, limit int, before *time.Time) ([]models.Message, error) {
	ok, err := s.chat.IsParticipant(ctx, conversationID, userID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, httpx.Forbidden("Нет доступа к диалогу")
	}
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	return s.chat.ListMessages(ctx, conversationID, limit, before)
}

// Send — отправить сообщение.
func (s *ChatService) Send(ctx context.Context, userID, conversationID, text string) (*models.Message, error) {
	text = strings.TrimSpace(text)
	if text == "" {
		return nil, httpx.BadRequest("Пустое сообщение")
	}
	if len(text) > 2000 {
		return nil, httpx.BadRequest("Сообщение слишком длинное (макс. 2000 символов)")
	}
	ok, err := s.chat.IsParticipant(ctx, conversationID, userID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, httpx.Forbidden("Нет доступа к диалогу")
	}
	m, err := s.chat.CreateMessage(ctx, conversationID, userID, text)
	if err != nil {
		return nil, err
	}
	if sender, err := s.profiles.GetByID(ctx, userID); err == nil {
		m.SenderName = sender.FullName
	}
	return m, nil
}

// OtherID — второй участник диалога (для WS-рассылки).
func (s *ChatService) OtherID(ctx context.Context, conversationID, selfID string) string {
	rows, err := s.chat.ListConversations(ctx, selfID)
	if err != nil {
		return ""
	}
	for _, c := range rows {
		if c.ID == conversationID {
			return c.OtherID
		}
	}
	return ""
}

// MarkRead — прочесть сообщения от otherID в диалоге; возвращает число прочитанных.
func (s *ChatService) MarkRead(ctx context.Context, userID, conversationID, otherID string) (int, error) {
	ok, err := s.chat.IsParticipant(ctx, conversationID, userID)
	if err != nil {
		return 0, err
	}
	if !ok {
		return 0, httpx.Forbidden("Нет доступа к диалогу")
	}
	if otherID == "" {
		return 0, nil
	}
	return s.chat.MarkRead(ctx, conversationID, otherID)
}
