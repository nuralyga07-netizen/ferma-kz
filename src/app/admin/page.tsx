"use client";

import { motion } from "framer-motion";
import {
  Users,
  ShoppingCart,
  Store,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Tag,
  Send,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

/* ─── Sample Data ─── */

const statsCards = [
  {
    title: "Пользователи",
    value: 24,
    change: "+3",
    changeType: "up" as const,
    icon: Users,
    color: "emerald",
  },
  {
    title: "Заказы",
    value: 156,
    change: "+12",
    changeType: "up" as const,
    icon: ShoppingCart,
    color: "blue",
  },
  {
    title: "Фермеры",
    value: 8,
    change: "+1",
    changeType: "up" as const,
    icon: Store,
    color: "amber",
  },
  {
    title: "Выручка",
    value: "450,000",
    suffix: "₸",
    change: "+15%",
    changeType: "up" as const,
    icon: DollarSign,
    color: "emerald",
  },
];

const weeklyOrders = [
  { day: "Пн", value: 12 },
  { day: "Вт", value: 8 },
  { day: "Ср", value: 15 },
  { day: "Чт", value: 10 },
  { day: "Пт", value: 20 },
  { day: "Сб", value: 25 },
  { day: "Вс", value: 18 },
];

const maxOrders = Math.max(...weeklyOrders.map((d) => d.value));

type Status = "active" | "pending" | "blocked";

const recentRegistrations = [
  { name: "Айгуль Серикбаева", role: "Покупатель", date: "13.07.2026", status: "active" as Status },
  { name: "Бауржан Алиев", role: "Фермер", date: "12.07.2026", status: "active" as Status },
  { name: "Гульмира Жаксылык", role: "Покупатель", date: "11.07.2026", status: "pending" as Status },
  { name: "Данияр Кусаинов", role: "Фермер", date: "10.07.2026", status: "active" as Status },
  { name: "Елена Попова", role: "Покупатель", date: "09.07.2026", status: "blocked" as Status },
];

type OrderStatus = "completed" | "processing" | "cancelled";

const recentOrders = [
  { id: "#1024", product: "Говядина 1 кг", customer: "Айгуль С.", amount: "3,500 ₸", status: "completed" as OrderStatus },
  { id: "#1023", product: "Молоко 3л", customer: "Бауржан А.", amount: "1,200 ₸", status: "processing" as OrderStatus },
  { id: "#1022", product: "Мёд цветочный", customer: "Гульмира Ж.", amount: "2,800 ₸", status: "completed" as OrderStatus },
  { id: "#1021", product: "Яйца 30шт", customer: "Данияр К.", amount: "1,500 ₸", status: "cancelled" as OrderStatus },
  { id: "#1020", product: "Курица 2кг", customer: "Елена П.", amount: "2,200 ₸", status: "processing" as OrderStatus },
];

/* ─── Helpers ─── */

const statusConfig: Record<Status, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  active: { label: "Активен", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
  pending: { label: "Ожидает", icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
  blocked: { label: "Заблокирован", icon: XCircle, color: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400" },
};

const orderStatusConfig: Record<OrderStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  completed: { label: "Выполнен", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
  processing: { label: "В обработке", icon: Clock, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" },
  cancelled: { label: "Отменён", icon: XCircle, color: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400" },
};

/* ─── Sub-components ─── */

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      {action && (
        <button className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
          {action}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status, useOrder }: { status: Status | OrderStatus; useOrder?: boolean }) {
  const config = useOrder
    ? orderStatusConfig[status as OrderStatus]
    : statusConfig[status as Status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function StatCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/2 mb-4" />
      <div className="h-8 bg-muted rounded w-3/4 mb-2" />
      <div className="h-3 bg-muted rounded w-1/3" />
    </div>
  );
}

/* ─── Main Component ─── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function AdminDashboard() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1400px] mx-auto space-y-8"
    >
      {/* ───── HEADER ───── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            Ferma.kz — Админ-панель
          </h1>
          <p className="text-base text-muted-foreground mt-1.5">
            Добро пожаловать, Нуралы 👋
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 h-[48px] rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all font-medium text-[15px]">
          <LogOutIcon className="w-5 h-5" />
          Выйти
        </button>
      </motion.div>

      {/* ───── STATS CARDS ───── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((stat) => (
          <div
            key={stat.title}
            className="glass-card rounded-2xl p-5 sm:p-6 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-[15px] font-medium text-muted-foreground">{stat.title}</span>
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  stat.color === "emerald"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : stat.color === "blue"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-amber-500/10 text-amber-500"
                }`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                {stat.value}
              </span>
              {stat.suffix && (
                <span className="text-xl font-bold text-foreground">{stat.suffix}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              {stat.changeType === "up" ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  stat.changeType === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {stat.change} за неделю
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ───── CHARTS + QUICK ACTIONS ───── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <SectionHeader title="Заказы за неделю" />

          <div className="flex items-end justify-between gap-2 sm:gap-3 h-[180px] sm:h-[200px] pt-2 pb-1">
            {weeklyOrders.map((d) => {
              const heightPct = (d.value / maxOrders) * 100;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[13px] font-semibold text-foreground">{d.value}</span>
                  <div className="w-full flex justify-center">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                      className="w-full max-w-[36px] rounded-lg bg-gradient-to-t from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-500 hover:from-emerald-600 hover:to-emerald-500 dark:hover:from-emerald-500 dark:hover:to-emerald-400 transition-all cursor-pointer"
                      style={{ minHeight: heightPct > 0 ? "8px" : "0px" }}
                    />
                  </div>
                  <span className="text-[12px] font-medium text-muted-foreground">{d.day}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-emerald-500/5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-muted-foreground">
              На <strong className="text-foreground">15%</strong> больше, чем на прошлой неделе
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-6">
          <SectionHeader title="Быстрые действия" />

          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all font-medium text-[15px] h-[52px]">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <span>Добавить фермера</span>
              <ArrowUpRight className="w-4 h-4 ml-auto shrink-0 opacity-60" />
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all font-medium text-[15px] h-[52px]">
              <div className="w-9 h-9 rounded-lg gradient-warm flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-white" />
              </div>
              <span>Создать акцию</span>
              <ArrowUpRight className="w-4 h-4 ml-auto shrink-0 opacity-60" />
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 transition-all font-medium text-[15px] h-[52px]">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 text-white" />
              </div>
              <span>Написать всем</span>
              <ArrowUpRight className="w-4 h-4 ml-auto shrink-0 opacity-60" />
            </button>
          </div>

          {/* Mini tip */}
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-amber-500/5 border border-emerald-500/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="block text-sm font-medium text-foreground mb-1">Совет дня</span>
                <span className="text-[13px] text-muted-foreground leading-relaxed">
                  Добавьте нового фермера — спрос на мясную продукцию вырос на 20% за последнюю неделю.
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ───── TABLES ───── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="glass-card rounded-2xl p-6">
          <SectionHeader title="Новые регистрации" action="Все" />

          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-emerald-500/10">
                  <th className="text-left px-6 py-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Имя
                  </th>
                  <th className="text-left px-6 py-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="text-left px-6 py-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="text-left px-6 py-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentRegistrations.map((row, i) => (
                  <motion.tr
                    key={row.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i, duration: 0.3 }}
                    className="border-b border-emerald-500/5 last:border-b-0 hover:bg-emerald-500/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-[15px] font-medium text-foreground">{row.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] text-muted-foreground">{row.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] text-muted-foreground">{row.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={row.status as Status} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="glass-card rounded-2xl p-6">
          <SectionHeader title="Последние заказы" action="Все" />

          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-emerald-500/10">
                  <th className="text-left px-6 py-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                    №
                  </th>
                  <th className="text-left px-6 py-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Товар
                  </th>
                  <th className="text-left px-6 py-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Покупатель
                  </th>
                  <th className="text-left px-6 py-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Сумма
                  </th>
                  <th className="text-left px-6 py-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i, duration: 0.3 }}
                    className="border-b border-emerald-500/5 last:border-b-0 hover:bg-emerald-500/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-[15px] font-semibold text-foreground">{row.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[15px] text-foreground">{row.product}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] text-muted-foreground">{row.customer}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[15px] font-semibold text-foreground">{row.amount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={row.status as OrderStatus} useOrder />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ───── FOOTER ───── */}
      <motion.div variants={itemVariants} className="text-center py-6">
        <p className="text-sm text-muted-foreground">
          Ferma.kz © {new Date().getFullYear()} — Панель управления для основателя
        </p>
      </motion.div>
    </motion.div>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
