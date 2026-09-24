import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShoppingBasket } from "lucide-react";
import { OrderCard } from "@/components/OrderCard";
import { OrderActionsModal } from "@/components/OrderActionsModal";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/EmptyState";
import { api, ApiError } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
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

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback((s: string) => {
    setLoading(true);
    api
      .listOrders(s)
      .then(setOrders)
      .catch((err) =>
        toast.error(err instanceof ApiError ? err.message : "Не удалось загрузить заказы"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(status);
  }, [status, load]);

  const totalSum = orders.reduce((a, o) => a + o.total, 0);

  return (
    <Container className="max-w-4xl pb-16 pt-8 sm:pt-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Все заказы</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {orders.length > 0 && `${orders.length} заказов · ${formatPrice(totalSum)}`}
      </p>

      <div className="-mx-4 mt-5 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBasket className="h-6 w-6" />}
          title={status ? "В этом статусе заказов нет" : "Заказов пока нет"}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              to="/admin/orders"
              showParty={o.customer_name ?? undefined}
              onSelect={setSelected}
            />
          ))}
        </div>
      )}

      <OrderActionsModal
        orderId={selected}
        role="admin"
        onClose={() => {
          setSelected(null);
          load(status);
        }}
      />
    </Container>
  );
}
