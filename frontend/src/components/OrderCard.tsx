import { Link } from "react-router-dom";
import { MapPin, Store, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatPrice,
  formatDateTime,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  cn,
} from "@/lib/utils";
import type { Order } from "@/types";

export function OrderCard({
  order,
  to,
  showParty,
  onSelect,
}: {
  order: Order;
  to: string;
  /** Для админа/фермера — показать оппонента */
  showParty?: string;
  /** Если задан — карточка кликабельная кнопка, а не ссылка */
  onSelect?: (id: string) => void;
}) {
  const count = order.items?.length
    ? order.items.reduce((a, i) => a + i.quantity, 0)
    : order.items_count ?? 0;

  const inner = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-foreground">
            Заказ №{order.order_number}
          </span>
          <Badge className={cn("border-0", ORDER_STATUS_COLORS[order.status])}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(order.created_at)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Store className="h-4 w-4" /> {order.farmer_name ?? "Ферма"}
        </span>
        {showParty && (
          <span className="flex items-center gap-1.5">
            <UserRound className="h-4 w-4" /> {showParty}
          </span>
        )}
        {order.delivery_address && (
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{order.delivery_address}</span>
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? "позиция" : count < 5 ? "позиции" : "позиций"}
          {order.discount > 0 && " · со скидкой"}
          {order.promo_code && ` · ${order.promo_code}`}
        </span>
        <span className="text-base font-bold text-foreground">
          {formatPrice(order.total)}
        </span>
      </div>
    </>
  );

  const base =
    "block w-full rounded-xl border border-border bg-card p-5 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-muted-foreground/25 hover:shadow-md";

  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(order.id)} className={base}>
        {inner}
      </button>
    );
  }

  return <Link to={to} className={base}>{inner}</Link>;
}
