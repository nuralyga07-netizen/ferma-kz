import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Home, MessageCircle, Package, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { api, ApiError } from "@/lib/api";
import {
  cn,
  formatDateTime,
  formatPrice,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

/** Разрешённые действия для не-клиента (фермер / админ). */
export function allowedActions(o: Order, role: "farmer" | "admin"): {
  label: string;
  status: OrderStatus;
  variant: "primary" | "danger";
}[] {
  const out: { label: string; status: OrderStatus; variant: "primary" | "danger" }[] = [];
  if (role === "admin") {
    // Админ — любой следующий или отмена
    const next: Record<OrderStatus, OrderStatus> = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "delivering",
      delivering: "delivered",
      delivered: "delivered",
      cancelled: "cancelled",
    };
    const labels: Partial<Record<OrderStatus, string>> = {
      confirmed: "Подтвердить",
      preparing: "Вготовление",
      delivering: "Отправлено",
      delivered: "Доставлен",
    };
    if (o.status !== "delivered" && o.status !== "cancelled") {
      const target = next[o.status];
      out.push({ label: labels[target] ?? "Обновить статус", status: target, variant: "primary" });
      out.push({ label: "Отменить заказ", status: "cancelled", variant: "danger" });
    }
    return out;
  }

  // Фермер
  switch (o.status) {
    case "pending":
      out.push({ label: "Подтвердить заказ", status: "confirmed", variant: "primary" });
      out.push({ label: "Отменить", status: "cancelled", variant: "danger" });
      break;
    case "confirmed":
      out.push({ label: "Начать подготовку", status: "preparing", variant: "primary" });
      out.push({ label: "Отменить", status: "cancelled", variant: "danger" });
      break;
    case "preparing":
      out.push({ label: "Передано в доставку", status: "delivering", variant: "primary" });
      out.push({ label: "Отменить", status: "cancelled", variant: "danger" });
      break;
    case "delivering":
      out.push({ label: "Отметить доставленным", status: "delivered", variant: "primary" });
      break;
  }
  return out;
}

/** Модалка: детали заказа + смена статуса (для фермера/админа). */
export function OrderActionsModal({
  orderId,
  role,
  onClose,
}: {
  orderId: string | null;
  role: "farmer" | "admin";
  onClose: () => void;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let alive = true;
    setLoading(true);
    api
      .getOrder(orderId)
      .then((o) => alive && setOrder(o))
      .catch(() => alive && setOrder(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [orderId]);

  const changeStatus = async (status: OrderStatus) => {
    if (!order || !userConfirm(status)) return;
    setBusy(true);
    try {
      const o = await api.updateOrderStatus(order.id, status);
      setOrder(o);
      toast.success("Статус обновлён");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось изменить статус");
    } finally {
      setBusy(false);
    }
  };

  const actions = order ? allowedActions(order, role) : [];

  return (
    <Modal open={!!orderId} onClose={onClose} title={order ? `Заказ №${order.order_number}` : "Заказ"}>
      {loading ? (
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : !order ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Заказ не найден</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={cn("border-0", ORDER_STATUS_COLORS[order.status])}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</span>
          </div>

          {/* Сторона */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-muted p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {role === "farmer" ? "Покупатель" : "Ферма"}
              </p>
              <p className="mt-0.5 font-medium text-foreground">
                {role === "farmer" ? order.customer_name : order.farmer_name}
              </p>
              {role === "farmer" && order.customer_phone && (
                <a href={`tel:${order.customer_phone}`} className="mt-1 inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline dark:text-emerald-400">
                  <Phone className="h-3.5 w-3.5" /> {order.customer_phone}
                </a>
              )}
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Получение</p>
              <p className="mt-0.5 flex items-start gap-1.5 text-sm text-foreground">
                <Home className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {order.delivery_method === "delivery"
                  ? order.delivery_address ?? "—"
                  : "Самовывоз"}
              </p>
              {order.notes && (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MessageCircle className="mt-0.5 h-3 w-3 shrink-0" /> {order.notes}
                </p>
              )}
            </div>
          </div>

          {/* Позиции */}
          <ul className="divide-y divide-border rounded-xl border border-border">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                <span className="min-w-0 truncate text-foreground">{it.product_name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {it.quantity} × {formatPrice(it.unit_price)}
                  <span className="ml-2 font-semibold text-foreground">{formatPrice(it.total)}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* Суммы */}
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Товары</dt>
              <dd className="font-medium text-foreground">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Скидка{order.promo_code ? ` (${order.promo_code})` : ""}</dt>
                <dd className="font-medium text-emerald-600 dark:text-emerald-400">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {order.delivery_method === "delivery" ? "Доставка" : "Самовывоз"}
              </dt>
              <dd className="font-medium text-foreground">
                {order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Бесплатно"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold text-foreground">
              <dt>Итого</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>

          {order.payment_method && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Package className="h-3.5 w-3.5" /> Оплата: {order.payment_method === "kaspi" ? "Kaspi" : "Наличными"}
            </p>
          )}

          {/* Действия */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {actions.map((a) => (
                <Button
                  key={a.status}
                  variant={a.variant}
                  size="sm"
                  isLoading={busy}
                  onClick={() => void changeStatus(a.status)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function userConfirm(status: OrderStatus): boolean {
  if (status === "cancelled") return confirm("Отменить заказ?");
  return true;
}
