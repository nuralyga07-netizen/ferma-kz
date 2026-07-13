"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Leaf, ChevronLeft } from "lucide-react";

const initialItems = [
  { id: 1, name: "Говядина парная", farmer: "Ферма «Акжол»", price: 2200, quantity: 2, unit: "кг", image: "🥩" },
  { id: 2, name: "Творог домашний", farmer: "ИП «Беркут»", price: 800, quantity: 1, unit: "кг", image: "🧀" },
  { id: 3, name: "Молоко парное", farmer: "Ферма «Акжол»", price: 350, quantity: 3, unit: "л", image: "🥛" },
];

export default function CartPage() {
  const [items, setItems] = useState(initialItems);

  const updateQuantity = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal >= 10000 ? 0 : 500;
  const total = subtotal + delivery;

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/catalog" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors">
              <ChevronLeft className="w-3 h-3" />
              Продолжить покупки
            </Link>
            <h1 className="text-3xl font-bold">Корзина</h1>
            <p className="text-sm text-muted-foreground mt-1">{items.length} товара</p>
          </div>
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Корзина пуста</h2>
            <p className="text-muted-foreground mb-6">Добавьте продукты из каталога</p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-all"
            >
              В каталог
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className="glass-card rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-800/10 flex items-center justify-center text-3xl shrink-0">
                      {item.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.id}`} className="font-medium text-sm hover:text-emerald-500 transition-colors">
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.farmer}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-all"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-all"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{(item.price * item.quantity).toLocaleString()} ₸</p>
                      <p className="text-xs text-muted-foreground">{item.price} ₸/{item.unit}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-6 space-y-4 sticky top-24">
                <h2 className="font-semibold">Сумма заказа</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Товары</span>
                    <span>{subtotal.toLocaleString()} ₸</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Доставка</span>
                    <span className={delivery === 0 ? "text-emerald-500" : ""}>
                      {delivery === 0 ? "Бесплатно" : `${delivery} ₸`}
                    </span>
                  </div>
                  {subtotal < 10000 && (
                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                      <Leaf className="w-3 h-3" />
                      Ещё {10000 - subtotal} ₸ до бесплатной доставки
                    </p>
                  )}
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between text-base font-bold">
                      <span>Итого</span>
                      <span>{total.toLocaleString()} ₸</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25"
                >
                  Оформить заказ
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Leaf className="w-3 h-3 text-emerald-500" />
                  Поддерживаем местных фермеров
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
