"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Phone, User, FileText, ChevronLeft, CreditCard, Package, Shield } from "lucide-react";

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/cart" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-3 h-3" />
          Назад в корзину
        </Link>
        <h1 className="text-3xl font-bold mb-8">Оформление заказа</h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-10">
          {["Данные", "Оплата", "Готово"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium ${
                step > i + 1 ? "bg-emerald-500 text-white" :
                step === i + 1 ? "bg-emerald-500 text-white" :
                "bg-muted text-muted-foreground"
              }`}>{step > i + 1 ? "✓" : i + 1}</div>
              <span className="text-sm hidden sm:block">{s}</span>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === 3 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-10 text-center max-w-md mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎉</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Заказ оформлен!</h2>
            <p className="text-muted-foreground mb-2">Номер заказа: #1234</p>
            <p className="text-sm text-muted-foreground mb-6">
              Фермер свяжется с вами в ближайшее время
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-all"
            >
              В дашборд
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-6">
                {/* Contact Info */}
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-500" />
                    Контактные данные
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Имя"
                      className="col-span-2 sm:col-span-1 px-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="+7 700 000 00 00"
                      className="col-span-2 sm:col-span-1 px-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Delivery */}
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-500" />
                    Доставка
                  </h2>
                  <div className="space-y-3">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Адрес доставки"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-border bg-transparent text-sm cursor-pointer hover:bg-muted/50 transition-all flex-1">
                        <input type="radio" name="delivery" defaultChecked className="text-emerald-500" />
                        Доставка
                      </label>
                      <label className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-border bg-transparent text-sm cursor-pointer hover:bg-muted/50 transition-all flex-1">
                        <input type="radio" name="delivery" className="text-emerald-500" />
                        Самовывоз
                      </label>
                    </div>
                    <textarea
                      placeholder="Комментарий к заказу (необязательно)"
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Payment */}
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    Способ оплаты
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {["Наличные", "Kaspi", "Картой", "Halyk Bank"].map((m) => (
                      <label
                        key={m}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-sm cursor-pointer hover:bg-muted/50 transition-all"
                      >
                        <input type="radio" name="payment" className="text-emerald-500" />
                        {m}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
                >
                  {loading ? "Оформляем..." : "Подтвердить заказ"}
                </button>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-2">
                <div className="glass-card rounded-2xl p-6 space-y-3 sticky top-24">
                  <h3 className="font-semibold text-sm">Ваш заказ</h3>
                  {[
                    { name: "Говядина парная × 2", price: "4 400 ₸" },
                    { name: "Творог домашний × 1", price: "800 ₸" },
                    { name: "Молоко парное × 3", price: "1 050 ₸" },
                  ].map((item) => (
                    <div key={item.name} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span>{item.price}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Доставка</span>
                      <span>500 ₸</span>
                    </div>
                    <div className="flex justify-between font-bold mt-2">
                      <span>Итого</span>
                      <span>6 750 ₸</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    Оплата при получении
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
