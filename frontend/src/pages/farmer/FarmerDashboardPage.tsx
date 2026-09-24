import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Clock,
  Leaf,
  Package,
  PackagePlus,
  Sprout,
  Truck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { OrderCard } from "@/components/OrderCard";
import { Spinner } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

export function FarmerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .listOrders("")
      .then((o) => alive && setOrders(o))
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const delivered = orders.filter((o) => o.status === "delivered");
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const revenue = delivered.reduce((a, o) => a + o.total, 0);

  const stats = [
    {
      label: "Заказы в работе",
      value: String(active.length),
      icon: <Truck className="h-5 w-5" />,
      tint: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10",
    },
    {
      label: "Новые заказы",
      value: String(pendingCount),
      icon: <Clock className="h-5 w-5" />,
      tint: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
      alert: pendingCount > 0,
    },
    {
      label: "Доставлено",
      value: String(delivered.length),
      icon: <Package className="h-5 w-5" />,
      tint: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    {
      label: "Выручка",
      value: formatPrice(revenue),
      icon: <Wallet className="h-5 w-5" />,
      tint: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
    },
  ];

  return (
    <Container className="max-w-5xl pb-16 pt-8 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Кабинет фермера</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.farm_name || user?.full_name} · {user?.city}
          </p>
        </div>
        <Link to="/farmer/products/new">
          <Button leftIcon={<PackagePlus className="h-4 w-4" />}>Добавить товар</Button>
        </Link>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tint}`}>
                {s.icon}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-foreground">{s.value}</p>
                <p className="truncate text-xs text-muted-foreground">{s.label}</p>
              </div>
              {s.alert && <AlertCircle className="ml-auto h-4 w-4 shrink-0 text-amber-500" />}
            </div>
          </div>
        ))}
      </div>

      {/* Быстрые ссылки */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Link to="/farmer/products" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-muted-foreground/25 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Leaf className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">Мои товары</p>
            <p className="text-xs text-muted-foreground">управление каталогом</p>
          </div>
        </Link>
        <Link to="/farmer/orders" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-muted-foreground/25 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">Заказы</p>
            <p className="text-xs text-muted-foreground">статусы и отправка</p>
          </div>
        </Link>
        <Link
          to={user ? `/farmers/${user.id}` : "/farmers"}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-muted-foreground/25 hover:shadow-md"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Sprout className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">Моя страница</p>
            <p className="text-xs text-muted-foreground">как меня видят покупатели</p>
          </div>
        </Link>
      </div>

      {/* Требуют внимания */}
      <h2 className="mb-3 mt-8 text-lg font-semibold tracking-tight text-foreground sm:text-xl">Требуют внимания</h2>
      {loading ? (
        <Spinner className="min-h-[40vh]" />
      ) : active.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {orders.length === 0
              ? "Заказов пока нет. Добавьте товары — и покупатели напишут о себе 😉"
              : "Активных заказов нет — всё спокойно"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.slice(0, 5).map((o) => (
            <OrderCard key={o.id} order={o} to={`/farmer/orders`} showParty={o.customer_name ?? undefined} />
          ))}
        </div>
      )}

      {active.length > 5 && (
        <div className="mt-4 text-center">
          <Link to="/farmer/orders">
            <Button variant="outline">Все заказы ({active.length})</Button>
          </Link>
        </div>
      )}
    </Container>
  );
}
