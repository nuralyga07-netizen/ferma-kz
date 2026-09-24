package services

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/config"
	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/models"
	"ferma-kz/backend/internal/repositories"
)

type OrderService struct {
	pool      *pgxpool.Pool
	cart      *repositories.CartRepo
	orders    *repositories.OrderRepo
	promo     *PromoService
	referrals *ReferralService
	cfg       *config.Config
}

func NewOrderService(
	pool *pgxpool.Pool,
	cart *repositories.CartRepo,
	orders *repositories.OrderRepo,
	promo *PromoService,
	referrals *ReferralService,
	cfg *config.Config,
) *OrderService {
	return &OrderService{pool: pool, cart: cart, orders: orders, promo: promo, referrals: referrals, cfg: cfg}
}

type CheckoutInput struct {
	DeliveryMethod  models.DeliveryMethod
	DeliveryAddress *string
	Notes           *string
	PaymentMethod   string
	PromoCode       *string
}

func (s *OrderService) Checkout(ctx context.Context, customerID string, in *CheckoutInput) ([]models.Order, error) {
	items, err := s.cart.List(ctx, customerID)
	if err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return nil, httpx.BadRequest("Корзина пуста")
	}
	if in.DeliveryMethod != models.MethodDelivery && in.DeliveryMethod != models.MethodPickup {
		return nil, httpx.BadRequest("Неверный способ доставки")
	}
	if in.PaymentMethod == "" {
		in.PaymentMethod = "cash"
	}

	// Группировка по фермеру
	groups := map[string]*farmerGroup{}
	var order []string // порядок фермеров
	for _, it := range items {
		if it.Quantity > it.Product.QuantityAvailable {
			return nil, httpx.BadRequest(fmt.Sprintf("Недостаточно в наличии: %s (доступно %d)", it.Product.Name, it.Product.QuantityAvailable))
		}
		g, ok := groups[it.Product.FarmerID]
		if !ok {
			g = &farmerGroup{farmerID: it.Product.FarmerID}
			groups[it.Product.FarmerID] = g
			order = append(order, it.Product.FarmerID)
		}
		g.items = append(g.items, it)
		g.subtotal += round2(float64(it.Quantity) * it.Product.Price)
	}

	// Промокод проверяется один раз по общей сумме
	totalSubtotal := 0.0
	for _, g := range groups {
		totalSubtotal += g.subtotal
	}
	var promo *models.Promotion
	var perFarmerDiscount float64
	if in.PromoCode != nil && *in.PromoCode != "" {
		var err error
		promo, err = s.promo.Validate(ctx, *in.PromoCode, totalSubtotal)
		if err != nil {
			return nil, err
		}
		perFarmerDiscount = round2(totalSubtotal * float64(promo.DiscountPercent) / 100)
	}

	// Распределение скидки пропорционально subtotal каждого фермера
	discounts := map[string]float64{}
	for _, id := range order {
		discounts[id] = 0
	}
	if promo != nil {
		for _, id := range order {
			if totalSubtotal > 0 {
				discounts[id] = round2(perFarmerDiscount * groups[id].subtotal / totalSubtotal)
			}
		}
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var created []models.Order
	for _, farmerID := range order {
		g := groups[farmerID]
		discount := discounts[farmerID]

		fee := 0.0
		if in.DeliveryMethod == models.MethodDelivery {
			if g.subtotal-discount >= float64(s.cfg.DeliveryFreeFrom) {
				fee = 0
			} else {
				fee = float64(s.cfg.DeliveryFee)
			}
		}
		total := round2(g.subtotal - discount + fee)

		var addr *string
		if in.DeliveryMethod == models.MethodDelivery {
			addr = in.DeliveryAddress
		}

		o, err := s.createOrderTx(ctx, tx, customerID, g, discount, fee, total, in, addr)
		if err != nil {
			return nil, err
		}
		created = append(created, o)
	}

	// Промокод и корзина — после успешного создания всех заказов
	if promo != nil {
		if _, err := tx.Exec(ctx, `UPDATE promotions SET current_uses = current_uses + 1 WHERE id=$1`, promo.ID); err != nil {
			return nil, err
		}
	}
	if _, err := tx.Exec(ctx, `DELETE FROM cart_items WHERE customer_id=$1`, customerID); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return created, nil
}

// farmerGroup — товары одного фермера в чекауте.
type farmerGroup struct {
	farmerID string
	items    []repositories.CartItemRow
	subtotal float64
}

func (s *OrderService) createOrderTx(
	ctx context.Context,
	tx pgx.Tx,
	customerID string,
	g *farmerGroup,
	discount, fee, total float64,
	in *CheckoutInput,
	addr *string,
) (models.Order, error) {
	var o models.Order
	var promoCode *string
	if in.PromoCode != nil && *in.PromoCode != "" {
		promoCode = in.PromoCode
	}
	err := tx.QueryRow(ctx,
		`INSERT INTO orders (customer_id, farmer_id, status, subtotal, discount, delivery_fee, total,
			delivery_method, delivery_address, notes, payment_method, promo_code)
		 VALUES ($1,$2,'pending',$3,$4,$5,$6,$7,$8,$9,$10,$11)
		 RETURNING id, order_number, created_at, updated_at`,
		customerID, g.farmerID, g.subtotal, discount, fee, total,
		in.DeliveryMethod, addr, in.Notes, in.PaymentMethod, promoCode,
	).Scan(&o.ID, &o.OrderNumber, &o.CreatedAt, &o.UpdatedAt)
	if err != nil {
		return o, err
	}
	o.CustomerID = customerID
	o.FarmerID = g.farmerID
	o.Status = models.StatusPending
	o.Subtotal = g.subtotal
	o.Discount = discount
	o.DeliveryFee = fee
	o.Total = total
	o.DeliveryMethod = in.DeliveryMethod
	o.DeliveryAddress = addr
	o.Notes = in.Notes
	o.PaymentMethod = in.PaymentMethod

	for _, it := range g.items {
		// Блокируем и уменьшаем остаток
		ok, err := s.decrementStockTx(ctx, tx, it.Product.ID, it.Quantity)
		if err != nil {
			return o, err
		}
		if !ok {
			return o, httpx.BadRequest(fmt.Sprintf("Недостаточно в наличии: %s", it.Product.Name))
		}
		lineTotal := round2(float64(it.Quantity) * it.Product.Price)
		_, err = tx.Exec(ctx,
			`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total)
			 VALUES ($1,$2,$3,$4,$5,$6)`,
			o.ID, it.Product.ID, it.Product.Name, it.Quantity, it.Product.Price, lineTotal)
		if err != nil {
			return o, err
		}
	}
	return o, nil
}

// decrementStockTx с FOR UPDATE строки товара.
func (s *OrderService) decrementStockTx(ctx context.Context, tx pgx.Tx, productID string, qty int) (bool, error) {
	var available int
	if err := tx.QueryRow(ctx,
		`SELECT quantity_available FROM products WHERE id=$1 FOR UPDATE`, productID).Scan(&available); err != nil {
		return false, err
	}
	if qty > available {
		return false, nil
	}
	_, err := tx.Exec(ctx,
		`UPDATE products SET quantity_available = quantity_available - $2, updated_at=now() WHERE id=$1`,
		productID, qty)
	return true, err
}

// allowedTransitions — разрешённые переходы статусов по ролям.
var allowedTransitions = map[string]map[models.OrderStatus]bool{
	"farmer": {
		models.StatusConfirmed:  true, // из pending
		models.StatusPreparing:  true, // из confirmed
		models.StatusDelivering: true, // из preparing
		models.StatusDelivered:  true, // из delivering
		models.StatusCancelled:  true, // из pending/confirmed/preparing
	},
	"customer": {
		models.StatusCancelled: true, // только из pending
	},
	"admin": {
		models.StatusConfirmed:  true,
		models.StatusPreparing:  true,
		models.StatusDelivering: true,
		models.StatusDelivered:  true,
		models.StatusCancelled:  true,
	},
}

// UpdateStatus — смена статуса с проверками.
func (s *OrderService) UpdateStatus(ctx context.Context, orderID, actorID string, role models.Role, status models.OrderStatus) (*models.Order, error) {
	o, err := s.orders.Get(ctx, orderID)
	if err != nil {
		return nil, httpx.NotFound("Заказ не найден")
	}

	// Права: участник (customer/farmer) или admin
	isParticipant := o.CustomerID == actorID || o.FarmerID == actorID
	if role != models.RoleAdmin && !isParticipant {
		return nil, httpx.Forbidden("Нет прав на этот заказ")
	}

	if status == o.Status {
		return o, nil
	}
	if !isTransitionAllowed(o.Status, status, role) {
		return nil, httpx.BadRequest("Недопустимый переход статуса")
	}

	if err := s.orders.SetStatus(ctx, orderID, status); err != nil {
		return nil, err
	}

	// Отмена pending-заказа возвращает остатки, списанные при чекауте.
	if status == models.StatusCancelled && o.Status == models.StatusPending {
		rows, err := s.pool.Query(ctx,
			`SELECT product_id, quantity FROM order_items WHERE order_id=$1`, orderID)
		if err != nil {
			return nil, err
		}
		type stockLine struct {
			productID string
			qty       int
		}
		var lines []stockLine
		for rows.Next() {
			var l stockLine
			if err := rows.Scan(&l.productID, &l.qty); err != nil {
				rows.Close()
				return nil, err
			}
			lines = append(lines, l)
		}
		rows.Close()
		for _, l := range lines {
			if _, err := s.pool.Exec(ctx,
				`UPDATE products SET quantity_available = quantity_available + $2, updated_at=now() WHERE id=$1`,
				l.productID, l.qty); err != nil {
				return nil, err
			}
		}
	}

	// На delivered: XP покупателю +10 и награда рефереру (если был)
	if status == models.StatusDelivered {
		_, _ = s.pool.Exec(ctx,
			`UPDATE profiles SET xp = xp + 10, updated_at=now() WHERE id=$1`, o.CustomerID)
		if s.referrals != nil {
			_ = s.referrals.RewardFirstOrder(ctx, o.CustomerID)
		}
	}
	o.Status = status
	return o, nil
}

func isTransitionAllowed(from, to models.OrderStatus, role models.Role) bool {
	if role == models.RoleAdmin {
		return true
	}
	switch from {
	case models.StatusPending:
		// Покупатель может только отменить; подтвердить заказ вправе фермер.
		if role == models.RoleCustomer {
			return to == models.StatusCancelled
		}
		return role == models.RoleFarmer &&
			(to == models.StatusConfirmed || to == models.StatusCancelled)
	case models.StatusConfirmed:
		return role == models.RoleFarmer && (to == models.StatusPreparing || to == models.StatusCancelled)
	case models.StatusPreparing:
		return role == models.RoleFarmer && (to == models.StatusDelivering || to == models.StatusCancelled)
	case models.StatusDelivering:
		return role == models.RoleFarmer && to == models.StatusDelivered
	}
	return false
}

// List — заказы по ролям.
func (s *OrderService) List(ctx context.Context, userID string, role models.Role, status string) ([]models.Order, error) {
	var q string
	var args []any
	switch role {
	case models.RoleAdmin:
		q = `SELECT o.id, o.order_number, o.customer_id, c.full_name, c.phone, o.farmer_id, f.full_name,
			o.status, o.subtotal, o.discount, o.delivery_fee, o.total, o.delivery_method,
			o.delivery_address, o.notes, o.payment_method, o.promo_code, o.created_at, o.updated_at
		 FROM orders o
		 JOIN profiles c ON c.id = o.customer_id
		 JOIN profiles f ON f.id = o.farmer_id`
		if status != "" {
			q += ` WHERE o.status=$1`
			args = append(args, status)
		}
		q += ` ORDER BY o.created_at DESC LIMIT 200`
	case models.RoleFarmer:
		q = `SELECT o.id, o.order_number, o.customer_id, c.full_name, c.phone, o.farmer_id, f.full_name,
			o.status, o.subtotal, o.discount, o.delivery_fee, o.total, o.delivery_method,
			o.delivery_address, o.notes, o.payment_method, o.promo_code, o.created_at, o.updated_at
		 FROM orders o
		 JOIN profiles c ON c.id = o.customer_id
		 JOIN profiles f ON f.id = o.farmer_id
		 WHERE o.farmer_id=$1`
		args = append(args, userID)
		if status != "" {
			q += ` AND o.status=$2`
			args = append(args, status)
		}
		q += ` ORDER BY o.created_at DESC LIMIT 200`
	default:
		q = `SELECT o.id, o.order_number, o.customer_id, c.full_name, c.phone, o.farmer_id, f.full_name,
			o.status, o.subtotal, o.discount, o.delivery_fee, o.total, o.delivery_method,
			o.delivery_address, o.notes, o.payment_method, o.promo_code, o.created_at, o.updated_at
		 FROM orders o
		 JOIN profiles c ON c.id = o.customer_id
		 JOIN profiles f ON f.id = o.farmer_id
		 WHERE o.customer_id=$1`
		args = append(args, userID)
		if status != "" {
			q += ` AND o.status=$2`
			args = append(args, status)
		}
		q += ` ORDER BY o.created_at DESC LIMIT 200`
	}
	rows, err := s.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(&o.ID, &o.OrderNumber, &o.CustomerID, &o.CustomerName, &o.CustomerPhone,
			&o.FarmerID, &o.FarmerName, &o.Status, &o.Subtotal, &o.Discount, &o.DeliveryFee, &o.Total,
			&o.DeliveryMethod, &o.DeliveryAddress, &o.Notes, &o.PaymentMethod, &o.PromoCode,
			&o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, o)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Количество позиций в каждом заказе (карточки не грузят сами позиции)
	if len(out) > 0 {
		ids := make([]string, len(out))
		for i, o := range out {
			ids[i] = o.ID
		}
		countRows, err := s.pool.Query(ctx,
			`SELECT order_id, COALESCE(SUM(quantity), 0)::int
			 FROM order_items WHERE order_id = ANY($1::uuid[]) GROUP BY order_id`,
			ids)
		if err != nil {
			return nil, err
		}
		defer countRows.Close()
		for countRows.Next() {
			var id string
			var n int
			if err := countRows.Scan(&id, &n); err != nil {
				return nil, err
			}
			for i := range out {
				if out[i].ID == id {
					out[i].ItemsCount = n
					break
				}
			}
		}
		if err := countRows.Err(); err != nil {
			return nil, err
		}
	}
	return out, nil
}

func (s *OrderService) Get(ctx context.Context, orderID, actorID string, role models.Role) (*models.Order, error) {
	o, err := s.orders.GetWithItems(ctx, orderID)
	if err != nil {
		return nil, httpx.NotFound("Заказ не найден")
	}
	if role != models.RoleAdmin && o.CustomerID != actorID && o.FarmerID != actorID {
		return nil, httpx.Forbidden("Нет прав на этот заказ")
	}
	return o, nil
}
