"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard, Package, ShoppingCart, MessageCircle, BarChart3,
  DollarSign, Users, Star, Plus, Bell, User, Settings, LogOut,
  ChevronRight, TrendingUp, Calendar, Leaf,
} from "lucide-react";

const farmerLinks = [
  { icon: LayoutDashboard, label: "Главная", href: "/farmer" },
  { icon: Package, label: "Мои товары", href: "/farmer/products" },
  { icon: ShoppingCart, label: "Заказы", href: "/farmer/orders" },
  { icon: MessageCircle, label: "Чат с покупателями", href: "/farmer/chat" },
  { icon: BarChart3, label: "Аналитика", href: "/farmer/analytics" },
  { icon: DollarSign, label: "Выручка", href: "/farner/earnings" },
  { icon: Bell, label: "Уведомления", href: "/farmer/notifications" },
  { icon: User, label: "Профиль", href: "/farmer/profile" },
];

const recentOrders = [
  { id: 1, product: "Говядина парная", customer: "Азамат К.", amount: "4 400 ₸", status: "Новый", qty: "2 кг", image: "🥩" },
  { id: 2, product: "Творог домашний", customer: "Мария П.", amount: "1 600 ₸", status: "Готовится", qty: "2 кг", image: "🧀" },
  { id: 3, product: "Молоко парное", customer: "Азамат К.", amount: "1 050 ₸", status: "Доставлен", qty: "3 л", image: "🥛" },
];

export default function FarmerDashboard() {
  return (
    <div className="min-h-screen bg-muted/20 pt-16 lg:pt-20">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 lg:top-20 bottom-0 w-64 lg:w-72 border-r border-border bg-background/50 backdrop-blur-xl hidden lg:block overflow-y-auto">
          <nav className="p-4 space-y-1">
            <div className="px-4 py-3 mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Ферма «Акжол»</p>
              <p className="text-xs text-muted-foreground mt-0.5">Подписка: Premium</p>
            </div>
            {farmerLinks.map((link) => (
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

        {/* Main */}
        <main className="flex-1 lg:ml-72 p-4 lg:p-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Панель фермера</h1>
              <p className="text-sm text-muted-foreground mt-1">Управляйте своими продуктами и заказами</p>
            </div>
            <Link
              href="/farmer/products/new"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              <Plus className="w-4 h-4" />
              Добавить товар
            </Link>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {[
              { icon: Package, value: "12", label: "Товаров", change: "+2", color: "emerald" },
              { icon: ShoppingCart, value: "8", label: "Заказов сегодня", change: "+3", color: "blue" },
              { icon: DollarSign, value: "45 000 ₸", label: "Выручка за месяц", change: "+15%", color: "emerald" },
              { icon: Star, value: "4.9", label: "Рейтинг", change: "Топ-1", color: "amber" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-4 lg:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                  </div>
                  <span className="text-xs text-emerald-500 font-medium">{stat.change}</span>
                </div>
                <div className="text-xl lg:text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Новые заказы</h2>
                <Link href="/farmer/orders" className="text-xs text-emerald-500 flex items-center gap-1">
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
                      <p className="text-xs text-muted-foreground">
                        {order.customer} · {order.qty}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{order.amount}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${
                        order.status === "Новый" ? "bg-blue-500/10 text-blue-500" :
                        order.status === "Готовится" ? "bg-amber-500/10 text-amber-500" :
                        "bg-emerald-500/10 text-emerald-500"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <button className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-all">
                      Принять
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold text-sm mb-4">Быстрые действия</h3>
                <div className="space-y-2">
                  {[
                    { icon: Plus, label: "Добавить товар", href: "/farmer/products/new" },
                    { icon: Calendar, label: "Настроить доставку", href: "/farmer/delivery" },
                    { icon: TrendingUp, label: "Смотреть аналитику", href: "/farmer/analytics" },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-all text-sm"
                    >
                      <action.icon className="w-4 h-4 text-emerald-500" />
                      <span>{action.label}</span>
                      <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Tip */}
              <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10">
                <Leaf className="w-5 h-5 text-emerald-500 mb-2" />
                <h3 className="font-semibold text-sm mb-1">Совет дня</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Добавьте фото ваших продуктов — заказы вырастут на 40%
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
