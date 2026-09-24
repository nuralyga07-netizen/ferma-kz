package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ferma-kz/backend/internal/models"
)

type OrderRepo struct {
	pool *pgxpool.Pool
}

func NewOrderRepo(pool *pgxpool.Pool) *OrderRepo { return &OrderRepo{pool: pool} }

const orderSelect = `
	SELECT o.id, o.order_number, o.customer_id, c.full_name, c.phone, o.farmer_id, f.full_name,
		o.status, o.subtotal, o.discount, o.delivery_fee, o.total, o.delivery_method,
		o.delivery_address, o.notes, o.payment_method, o.promo_code, o.created_at, o.updated_at
	FROM orders o
	JOIN profiles c ON c.id = o.customer_id
	JOIN profiles f ON f.id = o.farmer_id`

func scanOrder(row interface{ Scan(dest ...any) error }) (models.Order, error) {
	var o models.Order
	err := row.Scan(&o.ID, &o.OrderNumber, &o.CustomerID, &o.CustomerName, &o.CustomerPhone,
		&o.FarmerID, &o.FarmerName, &o.Status, &o.Subtotal, &o.Discount, &o.DeliveryFee, &o.Total,
		&o.DeliveryMethod, &o.DeliveryAddress, &o.Notes, &o.PaymentMethod, &o.PromoCode,
		&o.CreatedAt, &o.UpdatedAt)
	return o, err
}

func (r *OrderRepo) Get(ctx context.Context, id string) (*models.Order, error) {
	o, err := scanOrder(r.pool.QueryRow(ctx, orderSelect+` WHERE o.id=$1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("order not found")
	}
	if err != nil {
		return nil, err
	}
	return &o, nil
}

// GetWithItems — заказ со списком позиций.
func (r *OrderRepo) GetWithItems(ctx context.Context, id string) (*models.Order, error) {
	o, err := r.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx,
		`SELECT id, order_id, product_id, product_name, quantity, unit_price, total
		 FROM order_items WHERE order_id=$1`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []models.OrderItem
	for rows.Next() {
		var it models.OrderItem
		if err := rows.Scan(&it.ID, &it.OrderID, &it.ProductID, &it.ProductName,
			&it.Quantity, &it.UnitPrice, &it.Total); err != nil {
			return nil, err
		}
		items = append(items, it)
	}
	o.Items = items
	return o, rows.Err()
}

func (r *OrderRepo) SetStatus(ctx context.Context, id string, status models.OrderStatus) error {
	res, err := r.pool.Exec(ctx,
		`UPDATE orders SET status=$2, updated_at=now() WHERE id=$1`, id, status)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("order not found")
	}
	return nil
}

// Stats — агрегаты для админ-дашборда.
type AdminStats struct {
	Users   int       `json:"users"`
	Farmers int       `json:"farmers"`
	Orders  int       `json:"orders"`
	Revenue float64   `json:"revenue"`
	Weekly  []WeekDay `json:"weekly"`
}

type WeekDay struct {
	Day   string  `json:"day"`
	Count int     `json:"count"`
	Total float64 `json:"total"`
}

func (r *OrderRepo) AdminStats(ctx context.Context) (*AdminStats, error) {
	st := &AdminStats{}
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*)::int FROM profiles`).Scan(&st.Users)
	if err != nil {
		return nil, err
	}
	err = r.pool.QueryRow(ctx, `SELECT COUNT(*)::int FROM profiles WHERE role='farmer'`).Scan(&st.Farmers)
	if err != nil {
		return nil, err
	}
	err = r.pool.QueryRow(ctx, `SELECT COUNT(*)::int, COALESCE(SUM(total),0) FROM orders WHERE status <> 'cancelled'`).
		Scan(&st.Orders, &st.Revenue)
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT CASE EXTRACT(ISODOW FROM d.day)
			WHEN 1 THEN 'Пн' WHEN 2 THEN 'Вт' WHEN 3 THEN 'Ср'
			WHEN 4 THEN 'Чт' WHEN 5 THEN 'Пт' WHEN 6 THEN 'Сб'
			ELSE 'Вс'
		END AS wd,
			COALESCE(o.cnt, 0)::int AS cnt,
			COALESCE(o.sum, 0) AS sum
		FROM generate_series(current_date - 6, current_date, '1 day') AS d(day)
		LEFT JOIN (
			SELECT created_at::date AS dd, COUNT(*) AS cnt, SUM(total) AS sum
			FROM orders WHERE status <> 'cancelled'
			GROUP BY 1
		) o ON o.dd = d.day
		ORDER BY d.day`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var wd string
		var cnt int
		var sum float64
		if err := rows.Scan(&wd, &cnt, &sum); err != nil {
			return nil, err
		}
		st.Weekly = append(st.Weekly, WeekDay{Day: wd, Count: cnt, Total: sum})
	}
	return st, rows.Err()
}
