package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/models"
)

type ChatRepo struct {
	pool *pgxpool.Pool
}

func NewChatRepo(pool *pgxpool.Pool) *ChatRepo { return &ChatRepo{pool: pool} }

// ConversationRow — диалог + данные собеседника (для списка).
type ConversationRow struct {
	models.Conversation
	OtherID string
}

// ListConversations — диалоги пользователя (с именем собеседника, последним сообщением, непрочитанными).
func (r *ChatRepo) ListConversations(ctx context.Context, userID string) ([]ConversationRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT c.id, c.participant_a, c.participant_b, c.product_id, c.last_message_at,
			o.other_id, other.full_name, COALESCE(other.avatar_url, ''),
			lastm.text,
			-- Непрочитанные = сообщения, ПРИШЕДШИЕ пользователю ($1) и ещё не прочитанные
			(SELECT COUNT(*) FROM messages m
			   WHERE m.conversation_id = c.id AND m.sender_id <> $1 AND m.is_read = false)::int
		FROM conversations c
		CROSS JOIN LATERAL (
			SELECT CASE WHEN c.participant_a = $1 THEN c.participant_b ELSE c.participant_a END AS other_id
		) o
		JOIN profiles other ON other.id = o.other_id
		LEFT JOIN LATERAL (
			SELECT m2.text FROM messages m2
			WHERE m2.conversation_id = c.id
			ORDER BY m2.created_at DESC, m2.id DESC LIMIT 1
		) lastm ON true
		WHERE c.participant_a = $1 OR c.participant_b = $1
		ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ConversationRow
	for rows.Next() {
		var row ConversationRow
		if err := rows.Scan(&row.ID, &row.ParticipantA, &row.ParticipantB, &row.ProductID,
			&row.LastMessageAt, &row.OtherID, &row.OtherName, &row.OtherAvatar,
			&row.LastMessage, &row.UnreadCount); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

// GetOrCreateConversation — диалог между двумя пользователями (опционально к товару).
func (r *ChatRepo) GetOrCreateConversation(ctx context.Context, a, b, productID string) (*models.Conversation, error) {
	aID, err := uuid.Parse(a)
	if err != nil {
		return nil, err
	}
	bID, err := uuid.Parse(b)
	if err != nil {
		return nil, err
	}
	var conv models.Conversation
	err = r.pool.QueryRow(ctx, `
		SELECT c.id, c.participant_a, c.participant_b, c.product_id, c.last_message_at
		FROM conversations c
		WHERE (c.participant_a = $1 AND c.participant_b = $2)
		   OR (c.participant_a = $2 AND c.participant_b = $1)
		LIMIT 1`, aID, bID).Scan(&conv.ID, &conv.ParticipantA, &conv.ParticipantB, &conv.ProductID, &conv.LastMessageAt)
	if err == nil {
		return &conv, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	var pID *string
	if productID != "" {
		if _, err := uuid.Parse(productID); err != nil {
			return nil, err
		}
		pID = &productID
	}

	// participant_a < participant_b — чтобы UNIQUE(participant_a, participant_b)
	// срабатывал независимо от порядка аргументов.
	lo, hi := aID, bID
	if hi.String() < lo.String() {
		lo, hi = hi, lo
	}
	err = r.pool.QueryRow(ctx, `
		INSERT INTO conversations (participant_a, participant_b, product_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (participant_a, participant_b) DO UPDATE SET product_id = COALESCE(conversations.product_id, EXCLUDED.product_id)
		RETURNING id, participant_a, participant_b, product_id, last_message_at`,
		lo, hi, pID).Scan(&conv.ID, &conv.ParticipantA, &conv.ParticipantB, &conv.ProductID, &conv.LastMessageAt)
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

// IsParticipant — является ли пользователь участником диалога.
func (r *ChatRepo) IsParticipant(ctx context.Context, conversationID, userID string) (bool, error) {
	var b bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM conversations WHERE id=$1 AND (participant_a=$2 OR participant_b=$2))`,
		conversationID, userID).Scan(&b)
	return b, err
}

// ListMessages — сообщения диалога, новые сверху; before — курсор (старше этого времени).
func (r *ChatRepo) ListMessages(ctx context.Context, conversationID string, limit int, before *time.Time) ([]models.Message, error) {
	q := `
		SELECT m.id, m.conversation_id, m.sender_id, s.full_name, m.text, m.is_read, m.created_at
		FROM messages m
		JOIN profiles s ON s.id = m.sender_id
		WHERE m.conversation_id=$1`
	args := []any{conversationID, limit}
	if before != nil {
		q += ` AND m.created_at < $3`
		args = append(args, *before)
	}
	q += ` ORDER BY m.created_at DESC, m.id DESC LIMIT $2`
	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Message
	for rows.Next() {
		var m models.Message
		if err := rows.Scan(&m.ID, &m.ConversationID, &m.SenderID, &m.SenderName, &m.Text, &m.IsRead, &m.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

// CreateMessage — сохранение сообщения и обновление last_message_at.
func (r *ChatRepo) CreateMessage(ctx context.Context, conversationID, senderID, text string) (*models.Message, error) {
	var m models.Message
	err := r.pool.QueryRow(ctx, `
		INSERT INTO messages (conversation_id, sender_id, text) VALUES ($1, $2, $3)
		RETURNING id, conversation_id, sender_id, text, is_read, created_at`,
		conversationID, senderID, text).Scan(&m.ID, &m.ConversationID, &m.SenderID, &m.Text, &m.IsRead, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	_, err = r.pool.Exec(ctx,
		`UPDATE conversations SET last_message_at=$2 WHERE id=$1`,
		conversationID, m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

// MarkRead — пометить сообщения от otherID в диалоге как прочитанные; возвращает количество.
func (r *ChatRepo) MarkRead(ctx context.Context, conversationID, otherID string) (int, error) {
	tag, err := r.pool.Exec(ctx, `
		UPDATE messages SET is_read = true
		WHERE conversation_id=$1 AND sender_id=$2 AND is_read = false`,
		conversationID, otherID)
	if err != nil {
		return 0, err
	}
	return int(tag.RowsAffected()), nil
}
