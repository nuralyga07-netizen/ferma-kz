"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, SlidersHorizontal, Star, MapPin, Clock } from "lucide-react";

const CATEGORIES = [
  "Все", "Мясо и птица", "Молочные продукты", "Овощи", "Фрукты",
  "Мёд и сладости", "Яйца", "Зелень", "Консервация", "Выпечка",
];

const SAMPLE_PRODUCTS = [
  { id: 1, name: "Говядина парная", farmer: "Ферма «Акжол»", price: 2200, unit: "кг", rating: 4.9, orders: 128, image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=300&fit=crop", category: "Мясо и птица", organic: true },
  { id: 2, name: "Творог домашний", farmer: "ИП «Беркут»", price: 800, unit: "кг", rating: 4.8, orders: 95, image: "https://images.unsplash.com/photo-1628088062854-b1870b58a6c6?w=400&h=300&fit=crop", category: "Молочные продукты", organic: true },
  { id: 3, name: "Молоко парное", farmer: "Ферма «Акжол»", price: 350, unit: "л", rating: 4.9, orders: 203, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop", category: "Молочные продукты", organic: true },
  { id: 4, name: "Курица домашняя", farmer: "КХ «Атамекен»", price: 1500, unit: "кг", rating: 4.7, orders: 67, image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=300&fit=crop", category: "Мясо и птица", organic: false },
  { id: 5, name: "Картофель молодой", farmer: "Ферма «Акжол»", price: 180, unit: "кг", rating: 4.6, orders: 156, image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop", category: "Овощи", organic: true },
  { id: 6, name: "Мёд разнотравье", farmer: "Пасека «Бал»", price: 2500, unit: "кг", rating: 4.9, orders: 89, image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&h=300&fit=crop", category: "Мёд и сладости", organic: true },
  { id: 7, name: "Яйца домашние", farmer: "КХ «Атамекен»", price: 500, unit: "дес.", rating: 4.7, orders: 234, image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop", category: "Яйца", organic: true },
  { id: 8, name: "Сметана 30%", farmer: "ИП «Беркут»", price: 600, unit: "кг", rating: 4.8, orders: 112, image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop", category: "Молочные продукты", organic: true },
];
  { id: 9, name: "Баранина свежая", farmer: "Ферма «Кусжол»", price: 2500, unit: "кг", rating: 4.8, orders: 73, image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop", category: "Мясо и птица", organic: false },
  { id: 10, name: "Масло сливочное", farmer: "Ферма «Акжол»", price: 1500, unit: "кг", rating: 4.9, orders: 88, image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=300&fit=crop", category: "Молочные продукты", organic: true },
  { id: 11, name: "Помидоры", farmer: "КХ «Атамекен»", price: 400, unit: "кг", rating: 4.5, orders: 145, image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop", category: "Овощи", organic: true },
  { id: 12, name: "Кумыс", farmer: "Ферма «Кусжол»", price: 700, unit: "л", rating: 4.7, orders: 56, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop", category: "Молочные продукты", organic: true },
];

export default function CatalogPage() {
  const [activeCategory, setActiveCategory] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = SAMPLE_PRODUCTS.filter((p) => {
    const matchCategory = activeCategory === "Все" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.farmer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Каталог продуктов</h1>
          <p className="mt-2 text-muted-foreground">
            Свежие фермерские продукты напрямую от производителей
          </p>
        </motion.div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск продуктов или фермеров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl glass-card focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 rounded-2xl glass-card hover:bg-muted/50 transition-all text-sm">
            <SlidersHorizontal className="w-4 h-4" />
            Фильтры
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "glass-card hover:bg-muted/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6"
        >
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -4 }}
              className="glass-card rounded-2xl overflow-hidden group cursor-pointer"
            >
              <Link href={`/product/${product.id}`}>
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-800/10">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  {product.organic && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-500/90 backdrop-blur text-white text-[10px] font-semibold">
                      organic
                    </span>
                  )}
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Star className="w-4 h-4 text-amber-500" />
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.farmer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {product.rating}
                    </span>
                    <span>{product.orders} заказов</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-lg font-bold">
                      {product.price} ₸/<span className="text-sm font-normal text-muted-foreground">{product.unit}</span>
                    </span>
                    <button className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/25">
                      В корзину
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Ничего не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
