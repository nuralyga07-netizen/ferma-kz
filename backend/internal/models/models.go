package models

import "time"

type Role string

const (
	RoleCustomer Role = "customer"
	RoleFarmer   Role = "farmer"
	RoleAdmin    Role = "admin"
)

type OrderStatus string

const (
	StatusPending    OrderStatus = "pending"
	StatusConfirmed  OrderStatus = "confirmed"
	StatusPreparing  OrderStatus = "preparing"
	StatusDelivering OrderStatus = "delivering"
	StatusDelivered  OrderStatus = "delivered"
	StatusCancelled  OrderStatus = "cancelled"
)

type DeliveryMethod string

const (
	MethodDelivery DeliveryMethod = "delivery"
	MethodPickup   DeliveryMethod = "pickup"
)

type AppStatus string

const (
	AppPending  AppStatus = "pending"
	AppApproved AppStatus = "approved"
	AppRejected AppStatus = "rejected"
)

type ReferralStatus string

const (
	ReferralPending  ReferralStatus = "pending"
	ReferralRewarded ReferralStatus = "rewarded"
)

type Profile struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"full_name"`
	Phone        *string   `json:"phone,omitempty"`
	Telegram     *string   `json:"telegram,omitempty"`
	AvatarURL    *string   `json:"avatar_url,omitempty"`
	Role         Role      `json:"role"`
	City         string    `json:"city"`
	Address      *string   `json:"address,omitempty"`
	Bio          *string   `json:"bio,omitempty"`
	FarmName     *string   `json:"farm_name,omitempty"`
	IsActive     bool      `json:"is_active"`
	XP           int       `json:"xp"`
	Level        int       `json:"level"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// PublicProfile — профиль без служебных полей.
type PublicProfile struct {
	ID        string    `json:"id"`
	FullName  string    `json:"full_name"`
	Phone     *string   `json:"phone,omitempty"`
	AvatarURL *string   `json:"avatar_url,omitempty"`
	Role      Role      `json:"role"`
	City      string    `json:"city"`
	Bio       *string   `json:"bio,omitempty"`
	FarmName  *string   `json:"farm_name,omitempty"`
	Rating    *float64  `json:"rating,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type Farmer struct {
	Profile      PublicProfile `json:"profile"`
	ProductCount int           `json:"product_count"`
	Rating       *float64      `json:"rating,omitempty"`
	ReviewCount  *int          `json:"review_count,omitempty"`
	Tags         []string      `json:"tags,omitempty"`
}

type Category struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Icon        *string   `json:"icon,omitempty"`
	Description *string   `json:"description,omitempty"`
	ImageURL    *string   `json:"image_url,omitempty"`
	SortOrder   int       `json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
}

type Product struct {
	ID                string    `json:"id"`
	FarmerID          string    `json:"farmer_id"`
	FarmerName        *string   `json:"farmer_name,omitempty"`
	FarmerCity        *string   `json:"farmer_city,omitempty"`
	CategoryID        *string   `json:"category_id,omitempty"`
	CategoryName      *string   `json:"category_name,omitempty"`
	Name              string    `json:"name"`
	Description       *string   `json:"description,omitempty"`
	Price             float64   `json:"price"`
	OldPrice          *float64  `json:"old_price,omitempty"`
	Unit              string    `json:"unit"`
	QuantityAvailable int       `json:"quantity_available"`
	Images            []string  `json:"images"`
	IsActive          bool      `json:"is_active"`
	IsFeatured        bool      `json:"is_featured"`
	Organic           bool      `json:"organic"`
	Rating            float64   `json:"rating"`
	ReviewCount       int       `json:"review_count"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type CartItem struct {
	ID        string    `json:"id"`
	Product   Product   `json:"product"`
	Quantity  int       `json:"quantity"`
	Total     float64   `json:"total"`
	CreatedAt time.Time `json:"created_at"`
}

type Cart struct {
	Items    []CartItem `json:"items"`
	Subtotal float64    `json:"subtotal"`
}

type Order struct {
	ID              string         `json:"id"`
	OrderNumber     int            `json:"order_number"`
	CustomerID      string         `json:"customer_id"`
	CustomerName    *string        `json:"customer_name,omitempty"`
	CustomerPhone   *string        `json:"customer_phone,omitempty"`
	FarmerID        string         `json:"farmer_id"`
	FarmerName      *string        `json:"farmer_name,omitempty"`
	Status          OrderStatus    `json:"status"`
	Subtotal        float64        `json:"subtotal"`
	Discount        float64        `json:"discount"`
	DeliveryFee     float64        `json:"delivery_fee"`
	Total           float64        `json:"total"`
	DeliveryMethod  DeliveryMethod `json:"delivery_method"`
	DeliveryAddress *string        `json:"delivery_address,omitempty"`
	Notes           *string        `json:"notes,omitempty"`
	PaymentMethod   string         `json:"payment_method"`
	PromoCode       *string        `json:"promo_code,omitempty"`
	Items           []OrderItem    `json:"items,omitempty"`
	ItemsCount      int            `json:"items_count,omitempty"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
}

type OrderItem struct {
	ID          string  `json:"id"`
	OrderID     string  `json:"order_id"`
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	Total       float64 `json:"total"`
}

type Review struct {
	ID           string    `json:"id"`
	OrderID      string    `json:"order_id"`
	ProductID    string    `json:"product_id"`
	CustomerID   string    `json:"customer_id"`
	CustomerName string    `json:"customer_name"`
	Rating       int       `json:"rating"`
	Comment      *string   `json:"comment,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type Conversation struct {
	ID            string     `json:"id"`
	ParticipantA  string     `json:"participant_a"`
	ParticipantB  string     `json:"participant_b"`
	ProductID     *string    `json:"product_id,omitempty"`
	LastMessageAt *time.Time `json:"last_message_at,omitempty"`
	// Заполняется при списке диалогов:
	OtherName   string  `json:"other_name,omitempty"`
	OtherAvatar string  `json:"other_avatar,omitempty"`
	LastMessage *string `json:"last_message,omitempty"`
	UnreadCount int     `json:"unread_count"`
}

type Message struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversation_id"`
	SenderID       string    `json:"sender_id"`
	SenderName     string    `json:"sender_name,omitempty"`
	Text           string    `json:"text"`
	IsRead         bool      `json:"is_read"`
	CreatedAt      time.Time `json:"created_at"`
}

type Promotion struct {
	ID              string     `json:"id"`
	Code            string     `json:"code"`
	Description     *string    `json:"description,omitempty"`
	DiscountPercent int        `json:"discount_percent"`
	MinAmount       float64    `json:"min_amount"`
	MaxUses         int        `json:"max_uses"`
	CurrentUses     int        `json:"current_uses"`
	ExpiresAt       *time.Time `json:"expires_at,omitempty"`
	IsActive        bool       `json:"is_active"`
	CreatedAt       time.Time  `json:"created_at"`
}

type Referral struct {
	ID           string         `json:"id"`
	ReferrerID   string         `json:"referrer_id"`
	ReferredID   string         `json:"referred_id"`
	ReferredName *string        `json:"referred_name,omitempty"`
	RewardAmount float64        `json:"reward_amount"`
	Status       ReferralStatus `json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
}

type FarmerApplication struct {
	ID         string     `json:"id"`
	UserID     string     `json:"user_id"`
	UserName   string     `json:"user_name"`
	UserEmail  string     `json:"user_email"`
	FullName   string     `json:"full_name"`
	Phone      string     `json:"phone"`
	FarmName   string     `json:"farm_name"`
	City       string     `json:"city"`
	Products   string     `json:"products"`
	Experience *string    `json:"experience,omitempty"`
	Bio        *string    `json:"bio,omitempty"`
	Status     AppStatus  `json:"status"`
	ReviewedAt *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type UserSummary struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Role      Role      `json:"role"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}
