import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

const TABS: { value: string; label: string }[] = [
  { value: "", label: "Все" },
  { value: "pending", label: "Ожидают" },
  { value: "confirmed", label: "Подтверждены" },
  { value: "preparing", label: "Готовятся" },
  { value: "delivering", label: "В доставке" },
  { value: "delivered", label: "Доставлены" },
  { value: "cancelled", label: "Отменены" },
];

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .listOrders(status)
      .then((o) => alive && setOrders(o))
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [status]);

  return (
    <Container className="max-w-4xl pb-16 pt-8 sm:pt-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Мои заказы
      </h1>

      <div className="-mx-4 mt-5 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            aria-pressed={status === t.value}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              status === t.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-foreground hover:bg-accent",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title={status ? "В этом статусе заказов нет" : "Заказов пока нет"}
          text={status ? undefined : "Самое время выбрать что-нибудь свежее"}
          action={
            !status && (
              <Link to="/catalog">
                <Button>В каталог</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} to={`/account/orders/${o.id}`} />
          ))}
        </div>
      )}
    </Container>
  );
}
