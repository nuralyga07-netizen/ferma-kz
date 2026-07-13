"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Star, MapPin, Package, ArrowRight, BadgeCheck, Search } from "lucide-react";
import { useState } from "react";

const FARMERS = [
  {
    id: 1,
    name: "Ферма «Акжол»",
    avatar: "🐄",
    rating: 4.9,
    reviewCount: 128,
    productCount: 12,
    location: "Актобе, с. Акжол",
    slug: "akzhol",
    tags: ["Мясо", "Молочка", "Овощи"],
    description: "Семейная ферма с 15-летним стажем. Все продукты натуральные, без химии.",
  },
  {
    id: 2,
    name: "ИП «Беркут»",
    avatar: "🧀",
    rating: 4.8,
    reviewCount: 95,
    productCount: 8,
    location: "Актобе, р-н Астана",
    slug: "berkut",
    tags: ["Молочка", "Мёд"],
    description: "Домашние молочные продукты высшего качества. Собственная пасека.",
  },
  {
    id: 3,
    name: "КХ «Атамекен»",
    avatar: "🐔",
    rating: 4.7,
    reviewCount: 67,
    productCount: 15,
    location: "Актобе, с. Каргалы",
    slug: "atameken",
    tags: ["Птица", "Яйца", "Овощи", "Зелень"],
    description: "Крестьянское хозяйство с широким ассортиментом домашней продукции.",
  },
  {
    id: 4,
    name: "Ферма «Кусжол»",
    avatar: "🐑",
    rating: 4.8,
    reviewCount: 83,
    productCount: 6,
    location: "Актобе, с. Курайлы",
    slug: "kuszhol",
    tags: ["Баранина", "Кумыс"],
    description: "Свежая баранина и традиционные казахские напитки от пастухов с опытом.",
  },
  {
    id: 5,
    name: "Пасека «Бал»",
    avatar: "🍯",
    rating: 4.9,
    reviewCount: 104,
    productCount: 4,
    location: "Актобе, с. Жанаконыс",
    slug: "bal",
    tags: ["Мёд", "Прополис"],
    description: "Натуральный мёд с разнотравья. Без сахара, без добавок, только чистая продукция пчеловодства.",
  },
  {
    id: 6,
    name: "Ферма «Нур»",
    avatar: "🥬",
    rating: 4.6,
    reviewCount: 54,
    productCount: 10,
    location: "Актобе, с. Алга",
    slug: "nur",
    tags: ["Овощи", "Зелень", "Фрукты"],
    description: "Тепличное хозяйство. Свежие овощи и зелень круглый год без ГМО.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function FarmersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = FARMERS.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      {/* SEO Metadata */}
      {/* Next.js App Router handles <title> and <meta> via metadata export */}
      {/* Inline fallback for client components */}
      <head>
        <title>Фермеры Актобе — Ferma.kz</title>
        <meta
          name="description"
          content="Познакомьтесь с фермерами Актобе. Свежие домашние продукты напрямую от производителей без посредников."
        />
      </head>

      {/* Header Section */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5 dark:opacity-10" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-amber-500/5 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium mb-4">
              <BadgeCheck className="w-3.5 h-3.5" />
              Проверенные производители
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Наши{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                фермеры
              </span>
            </h1>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-xl">
              Каждый фермер проходит проверку. Вы точно знаете, у кого покупаете — и можете
              связаться напрямую.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 max-w-md"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск фермеров, мест или категорий..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl glass-card focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Farmers Grid */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((farmer) => (
              <motion.div
                key={farmer.id}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="glass-card rounded-2xl overflow-hidden group"
              >
                {/* Card Header */}
                <div className="relative h-28 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-900/20 dark:to-emerald-800/10 flex items-center justify-center">
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-500">
                    {farmer.avatar}
                  </span>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />
                    {farmer.rating}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{farmer.name}</h3>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        {farmer.location}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {farmer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {farmer.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-emerald-500" />
                      {farmer.productCount} товаров
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {farmer.reviewCount} отзывов
                    </span>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/catalog?farmer=${farmer.slug}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/25 group/btn"
                  >
                    Товары фермера
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-muted-foreground">
                Фермеры не найдены. Попробуйте другой запрос.
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}
