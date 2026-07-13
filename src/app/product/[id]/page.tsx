"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Star, MapPin, Clock, ChevronLeft, Heart, MessageCircle,
  Share2, Shield, CheckCircle, Plus, Minus, Package, Leaf,
} from "lucide-react";

const PRODUCT = {
  id: 1,
  name: "Говядина парная",
  farmer: "Ферма «Акжол»",
  farmerId: 1,
  price: 2200,
  oldPrice: 2800,
  unit: "кг",
  rating: 4.9,
  reviews: 128,
  orders: 234,
  description: "Парная говядина высшего сорта. Животные выращены на натуральных кормах без антибиотиков и стимуляторов роста. Мясо нежное, сочное, идеально для стейков и супов.",
  image: "🥩",
  category: "Мясо и птица",
  organic: true,
  delivery: "Доставка по Актобе — 500 ₸. При заказе от 10 000 ₸ — бесплатно.",
  payment: "Наличные, Kaspi, Halyk Bank",
  inStock: true,
  quantity: 50,
  features: [
    "Без антибиотиков и гормонов",
    "Пастбищное содержание",
    "Ветеринарный контроль",
    "Свежесть гарантируем",
  ],
};

export default function ProductPage() {
  const params = useParams();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "reviews" | "farmer">("description");

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Назад в каталог
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative aspect-square rounded-3xl bg-gradient-to-br from-emerald-100 via-emerald-50 to-amber-50 dark:from-emerald-900/20 dark:via-emerald-800/10 dark:to-amber-900/10 flex items-center justify-center overflow-hidden group"
          >
            <span className="text-[12rem] sm:text-[16rem] select-none group-hover:scale-110 transition-transform duration-700">
              {PRODUCT.image}
            </span>
            {PRODUCT.organic && (
              <div className="absolute top-6 left-6 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/90 backdrop-blur text-white text-xs font-semibold">
                <Leaf className="w-3.5 h-3.5" />
                Organic
              </div>
            )}
            <button className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/80 dark:bg-card/80 backdrop-blur flex items-center justify-center hover:bg-white transition-all">
              <Heart className="w-5 h-5 text-red-500" />
            </button>
            <button className="absolute top-6 right-20 w-10 h-10 rounded-xl bg-white/80 dark:bg-card/80 backdrop-blur flex items-center justify-center hover:bg-white transition-all">
              <Share2 className="w-5 h-5 text-muted-foreground" />
            </button>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                {PRODUCT.category}
              </span>
              <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-medium">
                Хит продаж
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{PRODUCT.name}</h1>
              <Link
                href={`/farmer/${PRODUCT.farmerId}`}
                className="inline-flex items-center gap-1 mt-2 text-sm text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                {PRODUCT.farmer}
                <ChevronLeft className="w-3 h-3 rotate-180" />
              </Link>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-semibold">{PRODUCT.rating}</span>
                <span className="text-muted-foreground">({PRODUCT.reviews} отзывов)</span>
              </div>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{PRODUCT.orders} заказов</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold">{PRODUCT.price} ₸</span>
              <span className="text-lg text-muted-foreground line-through">{PRODUCT.oldPrice} ₸</span>
              <span className="text-sm">за {PRODUCT.unit}</span>
            </div>

            {/* Features */}
            <div className="space-y-2">
              {PRODUCT.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Количество:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground">
                {PRODUCT.quantity > 10 ? "Более 10 доступно" : `${PRODUCT.quantity} доступно`}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25">
                Добавить в корзину
              </button>
              <button className="flex items-center gap-2 px-6 py-4 rounded-2xl glass-card hover:bg-muted/50 transition-all text-sm font-medium">
                <MessageCircle className="w-4 h-4" />
                Спросить
              </button>
            </div>

            {/* Delivery & Payment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Доставка</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{PRODUCT.delivery}</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Оплата</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{PRODUCT.payment}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="flex gap-6 border-b border-border mb-8">
            {["description", "reviews", "farmer"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab
                    ? "border-emerald-500 text-emerald-500"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "description" ? "Описание" : tab === "reviews" ? "Отзывы" : "О фермере"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl"
            >
              {activeTab === "description" && (
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">{PRODUCT.description}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Актобе, район Кирпичный</span>
                  </div>
                </div>
              )}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold">4.9</div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">· 128 отзывов</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Отзывы появятся после первых покупок. Станьте первым!
                  </p>
                </div>
              )}
              {activeTab === "farmer" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                      А
                    </div>
                    <div>
                      <h3 className="font-semibold">Ферма «Акжол»</h3>
                      <p className="text-sm text-muted-foreground">На рынке с 2020 года</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Семейная ферма в Актюбинской области. Выращиваем скот на пастбищах, 
                    используем только натуральные корма. Вся продукция проходит ветеринарный контроль.
                  </p>
                  <Link
                    href={`/farmer/${PRODUCT.farmerId}`}
                    className="inline-flex items-center gap-1 text-sm text-emerald-500 hover:text-emerald-600"
                  >
                    Все товары фермера <ChevronLeft className="w-3 h-3 rotate-180" />
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
