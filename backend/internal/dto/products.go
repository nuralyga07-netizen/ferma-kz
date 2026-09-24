package dto

import "errors"

type ProductRequest struct {
	CategoryID        *string  `json:"category_id"`
	Name              string   `json:"name"`
	Description       *string  `json:"description"`
	Price             float64  `json:"price"`
	OldPrice          *float64 `json:"old_price"`
	Unit              string   `json:"unit"`
	QuantityAvailable int      `json:"quantity_available"`
	Images            []string `json:"images"`
	IsFeatured        bool     `json:"is_featured"`
	Organic           bool     `json:"organic"`
}

func (r *ProductRequest) Validate() error {
	if len(r.Name) < 2 {
		return errors.New("Название товара должно быть не короче 2 символов")
	}
	if r.Price <= 0 {
		return errors.New("Цена должна быть больше нуля")
	}
	if r.Price > 100_000_000 {
		return errors.New("Цена слишком большая")
	}
	if r.QuantityAvailable < 0 {
		return errors.New("Количество не может быть отрицательным")
	}
	if r.Unit == "" {
		r.Unit = "кг"
	}
	if r.OldPrice != nil && *r.OldPrice <= r.Price {
		return errors.New("Старая цена должна быть больше текущей")
	}
	return nil
}

type ReviewRequest struct {
	OrderID   string  `json:"order_id"`
	ProductID string  `json:"product_id"`
	Rating    int     `json:"rating"`
	Comment   *string `json:"comment"`
}

func (r *ReviewRequest) Validate() error {
	if r.OrderID == "" {
		return errors.New("Укажите заказ")
	}
	if r.ProductID == "" {
		return errors.New("Укажите товар")
	}
	if r.Rating < 1 || r.Rating > 5 {
		return errors.New("Рейтинг должен быть от 1 до 5")
	}
	return nil
}
