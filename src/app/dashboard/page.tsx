"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard, ShoppingBag, Heart, MessageCircle, Calendar,
  Star, TrendingUp, Clock, MapPin, ChevronRight, Leaf,
  Bell, User, Settings, LogOut, ChevronDown, Gift,
} from "lucide-react";

const sidebarLinks = [
  { icon: LayoutDashboard, label: "Главная", href: "/dashboard" },
  { icon: ShoppingBag, label: "Мои заказы", href: "/dashboard/orders" },
  { icon: Heart, label: "Избранное", href: "/dashboard/favorites" },
  { icon: MessageCircle, label: "Чат с фермерами", href: "/dashboard/chat" },
  { icon: Calendar, label: "Подписки", href: "/dashboard/subscriptions" },
  { icon: Gift, label: "Реферальная программа", href: "/dashboard/referrals" },
  { icon: Star, label: "Отзывы", href: "/dashboard/reviews" },
  { icon: User, label: "Профиль", href: "/dashboard/profile" },
];

const recentOrders = [
  { id: 1, product: "Говядина парная", farmer: "Ферма «Акжол»", amount: "4 400 ₸", status: "Доставлен", date: "12 июля", image: "🥩" },
  { id: 2, product: "Творог домашний", farmer: "ИП «Беркут»", amount: "1 600 ₸", status: "Готовится", date: "12 июля", image: "🧀" },
  { id: 3, product: "Молоко парное", farmer: "Ферма «Акжол»", amount: "1 050 ₸", status: "Подтверждён", date: "11 июля", image: "🥛" },
];

export default function CustomerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/20 pt-16 lg:pt-20">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 lg:top-20 bottom-0 w-64 lg:w-72 border-r border-border bg-background/50 backdrop-blur-xl hidden lg:block overflow-y-auto">
          <nav className="p-4 space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-emerald-500/5 hover:text-emerald-500 transition-all group"
              >
                <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                <span>{link.label}</span>
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t border-border">
              <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/5 transition-all w-full">
                <LogOut className="w-4 h-4" />
                <span>Выйти</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 p-4 lg:p-8">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">Главная</h1>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl glass-card">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {[
              { icon: ShoppingBag, value: "12", label: "Заказов", color: "emerald" },
              { icon: Heart, value: "8", label: "В избранном", color: "red" },
              { icon: Star, value: "4.9", label: "Рейтинг", color: "amber" },
              { icon: TrendingUp, value: "15 000 ₸", label: "Сэкономлено", color: "emerald" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-4 lg:p-5">
                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
                <div className="text-xl lg:text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Последние заказы</h2>
                <Link href="/dashboard/orders" className="text-xs text-emerald-500 hover:text-emerald-600 flex items-center gap-1">
                  Все <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentOrders.map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-2xl">
                      {order.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{order.product}</p>
                      <p className="text-xs text-muted-foreground">{order.farmer} · {order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{order.amount}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${
                        order.status === "Доставлен" ? "bg-emerald-500/10 text-emerald-500" :
                        order.status === "Готовится" ? "bg-amber-500/10 text-amber-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              {/* Next Delivery */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold text-sm mb-3">Ближайшая доставка</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Завтра, 14:00</p>
                    <p className="text-xs text-muted-foreground">Ферма «Акжол»</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>Доставка до двери</span>
                </div>
              </div>

              {/* XP Card */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Опыт</h3>
                  <Leaf className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-bold">240 XP</span>
                  <span className="text-xs text-muted-foreground">Уровень 3</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-3/5 rounded-full gradient-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">160 XP до следующего уровня</p>
              </div>

              {/* Referral */}
              <Link href="/dashboard/referrals" className="block glass-card rounded-2xl p-5 hover:bg-muted/30 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-sm">Пригласи друга</h3>
                </div>
                <p className="text-xs text-muted-foreground">Получи 500 ₸ на первый заказ друга</p>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
