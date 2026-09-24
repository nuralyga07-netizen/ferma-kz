import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Home,
  MapPin,
  MessageCircle,
  Package,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Modal } from "@/components/ui/modal";
import { RatingStars } from "@/components/RatingStars";
import { Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "delivering", "delivered"];

/** Разрешённые действия клиента */
function customerAction(o: Order): { label: string; status: OrderStatus; danger?: boolean } | null {
  if (o.status === "pending")
    return { label: "Отменить заказ", status: "cancelled", danger: true };
  return null;
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const isCustomer = order?.customer_id === user?.id;

  useEffect(() => {
    if (!id) return;
    let alive = true;
    api
      .getOrder(id)
      .then((o) => alive && setOrder(o))
      .catch(() => alive && setOrder(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <Spinner className="min-h-[50vh]" />;
  if (!order) {
    return (
      <Container className="pt-32 text-center">
        <p className="text-lg font-semibold text-foreground">Заказ не найден</p>
        <Link
          to="/account/orders"
          className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-500"
        >
          ← К заказам
        </Link>
      </Container>
    );
  }

  const action = isCustomer ? customerAction(order) : null;
  const stepIdx = FLOW.indexOf(order.status);

  const changeStatus = async (status: OrderStatus) => {
    if (!user) return;
    if (status === "cancelled" && !confirm("Отменить заказ?")) return;
    setBusy(true);
    try {
      const o = await api.updateOrderStatus(order.id, status);
      setOrder(o);
      toast.success(status === "cancelled" ? "Заказ отменён" : "Статус обновлён");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось изменить статус");
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async (productId: string) => {
    setBusy(true);
    try {
      await api.createReview(order.id, {
        product_id: productId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      toast.success("Спасибо за отзыв!");
      setReviewOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось сохранить отзыв");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-4xl pb-16 pt-8 sm:pt-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Назад
      </button>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
        {/* Шапка */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Заказ №{order.order_number}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>
          </div>
          <Badge className={cn("border-0 px-3.5 py-1.5 text-sm", ORDER_STATUS_COLORS[order.status])}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>

        {/* Прогресс */}
        {order.status !== "cancelled" && (
          <ol className="mt-6 grid grid-cols-5 gap-1">
            {FLOW.map((s, i) => (
              <li key={s} className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                    i <= stepIdx
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {i < stepIdx ? <BadgeCheck className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-center text-[11px] leading-tight",
                    i <= stepIdx ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {ORDER_STATUS_LABELS[s]}
                </span>
              </li>
            ))}
          </ol>
        )}
        {order.status === "cancelled" && (
          <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            Заказ отменён
          </p>
        )}

        {/* Позиции */}
        <ul className="mt-6 divide-y divide-border">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <Link
                  to={`/product/${it.product_id}`}
                  className="font-medium text-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  {it.product_name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {it.quantity} × {formatPrice(it.unit_price)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold">{formatPrice(it.total)}</p>
                {order.status === "delivered" && isCustomer && (
                  <button
                    onClick={() => {
                      setReviewOpen(true);
                      setReviewComment("");
                      setReviewRating(5);
                    }}
                    className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-500 hover:underline"
                  >
                    <Star className="h-3.5 w-3.5" /> Оценить
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Суммы */}
        <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
          <Row k="Товары" v={formatPrice(order.subtotal)} />
          {order.discount > 0 && (
            <Row
              k={`Скидка${order.promo_code ? ` (${order.promo_code})` : ""}`}
              v={`−${formatPrice(order.discount)}`}
              accent
            />
          )}
          <Row
            k={order.delivery_method === "delivery" ? "Доставка" : "Самовывоз"}
            v={order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Бесплатно"}
          />
          <div className="flex justify-between border-t border-border pt-2.5 text-base font-bold text-foreground">
            <dt>Итого</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>

        {/* Детали */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <DetailCard icon={<Home className="h-4 w-4" />} label="Получение">
            {order.delivery_method === "delivery"
              ? order.delivery_address ?? "—"
              : "Самовывоз с фермы"}
          </DetailCard>
          <DetailCard icon={<Package className="h-4 w-4" />} label="Оплата">
            {order.payment_method === "kaspi" ? "Kaspi" : "Наличными"}
          </DetailCard>
          {order.notes && (
            <DetailCard icon={<MessageCircle className="h-4 w-4" />} label="Комментарий">
              {order.notes}
            </DetailCard>
          )}
          {order.customer_phone && isCustomer === false && (
            <DetailCard icon={<MapPin className="h-4 w-4" />} label="Телефон покупателя">
              <a href={`tel:${order.customer_phone}`} className="hover:underline">
                {order.customer_phone}
              </a>
            </DetailCard>
          )}
        </div>

        {/* Действия */}
        {action && (
          <div className="mt-6 border-t border-border pt-5">
            <Button
              variant={action.danger ? "danger" : "primary"}
              isLoading={busy}
              onClick={() => changeStatus(action.status)}
            >
              {action.label}
            </Button>
            {order.status === "pending" && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Фермер подтвердит заказ в ближайшее время
              </p>
            )}
          </div>
        )}
      </div>

      {/* Отзыв */}
      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Оценить товар">
        <div className="space-y-4">
          <RatingStars value={reviewRating} size={28} interactive onChange={setReviewRating} />
          <Textarea
            placeholder="Поделитесь впечатлениями (необязательно)"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
          <Button className="w-full" isLoading={busy} onClick={() => {
            // оцениваем первый товар (в демо — достаточно одного)
            if (order.items[0]) void submitReview(order.items[0].product_id);
          }}>
            Отправить отзыв
          </Button>
        </div>
      </Modal>
  </Container>
);
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={cn("font-medium", accent && "text-emerald-600 dark:text-emerald-400")}>{v}</dd>
    </div>
  );
}

function DetailCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-muted p-3.5">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </p>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  );
}
