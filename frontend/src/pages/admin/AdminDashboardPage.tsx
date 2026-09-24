import { useEffect, useState } from "react";
import {
  BarChart3,
  DollarSign,
  Package,
  ShoppingBasket,
  Sprout,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import type { AdminStats } from "@/types";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminStats()
      .then(setStats)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="max-w-5xl pt-8">
        <Skeleton className="h-9 w-48" />
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-64 rounded-2xl" />
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container className="pt-32 text-center text-sm text-muted-foreground">
        Не удалось загрузить статистику
      </Container>
    );
  }

  const cards = [
    {
      label: "Пользователи",
      value: String(stats.users),
      icon: <Users className="h-5 w-5" />,
      tint: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    },
    {
      label: "Фермеры",
      value: String(stats.farmers),
      icon: <Sprout className="h-5 w-5" />,
      tint: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    {
      label: "Заказы",
      value: String(stats.orders),
      icon: <ShoppingBasket className="h-5 w-5" />,
      tint: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    },
    {
      label: "Выручка",
      value: formatPrice(stats.revenue),
      icon: <DollarSign className="h-5 w-5" />,
      tint: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
  ];

  const maxWeekly = Math.max(1, ...stats.weekly.map((w) => w.total));
  const weekTotal = stats.weekly.reduce((a, w) => a + w.count, 0);

  return (
    <Container className="max-w-5xl pb-16 pt-8 sm:pt-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Админ-панель
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Сводка по маркетплейсу · на {formatDate(new Date().toISOString())}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", c.tint)}>
                {c.icon}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-foreground">{c.value}</p>
                <p className="truncate text-xs text-muted-foreground">{c.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Недельная активность */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-emerald-700 dark:text-emerald-500" />
            Заказы за неделю
          </h2>
          <Badge variant="primary">
            <Package className="h-3 w-3" />
            {weekTotal} заказов
          </Badge>
        </div>
        <div className="flex h-44 items-end gap-2 sm:gap-3">
          {stats.weekly.map((w) => (
            <div
              key={w.day}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              title={`${w.count} заказов · ${formatPrice(w.total)}`}
            >
              <span className="text-[11px] font-semibold text-foreground">
                {w.count || ""}
              </span>
              <div
                className="w-full rounded-t-md bg-primary opacity-75 transition-opacity hover:opacity-100"
                style={{ height: `${Math.max(4, (w.total / maxWeekly) * 100)}%` }}
              />
              <span className="text-xs text-muted-foreground">{w.day}</span>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
