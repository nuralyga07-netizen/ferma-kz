import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BadgeCheck, Home, MapPin, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { api, ApiError } from "@/lib/api";
import { useCartItems, useCartSubtotal } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { formatPrice, cn } from "@/lib/utils";

export function CheckoutPage() {
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [method, setMethod] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState(user?.address ?? "");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState("cash");
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState<string | null>(null);
  const [promoError, setPromoError] = useState("");
  const [loading, setLoading] = useState(false);

  const deliveryFee = useMemo(() => {
    if (method !== "delivery") return 0;
    return subtotal >= 10000 ? 0 : 500;
  }, [method, subtotal]);

  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <Container className="flex min-h-[50vh] items-center justify-center pt-16">
        <EmptyState
          icon={<PackageCheck className="h-6 w-6" />}
          title="Корзина пуста"
          action={
            <Link to="/catalog">
              <Button>В каталог</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  // Группировка по фермеру (как на бэкенде — для подсказки)
  const farmers = [...new Set(items.map((i) => i.product.farmer_name ?? "Фермер"))];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (method === "delivery" && address.trim().length < 5) {
      toast.error("Укажите адрес доставки");
      return;
    }
    setLoading(true);
    try {
      const res = await api.checkout({
        delivery_method: method,
        delivery_address: method === "delivery" ? address.trim() : undefined,
        notes: notes.trim() || undefined,
        payment_method: payment,
        promo_code: promoApplied ?? undefined,
      });
      // Сохраняем адрес в профиле (fire & forget)
      if (method === "delivery" && user) {
        void api.updateMe({ address: address.trim() }).catch(() => undefined);
      }
      toast.success(
        res.orders.length > 1
          ? `Создано ${res.orders.length} заказа (по одному на ферму)`
          : "Заказ создан! Фермер свяжется с вами.",
      );
      navigate("/account/orders");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось оформить заказ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="pb-16 pt-8 sm:pt-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Оформление заказа
      </h1>

      <form onSubmit={submit} className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="space-y-5">
          {/* Доставка */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-4 text-base font-semibold text-foreground">Способ получения</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <MethodCard
                active={method === "delivery"}
                onClick={() => setMethod("delivery")}
                icon={<MapPin className="h-5 w-5" />}
                title="Доставка"
                text={`500 ₸, бесплатно от 10 000 ₸ · на следующий день`}
              />
              <MethodCard
                active={method === "pickup"}
                onClick={() => setMethod("pickup")}
                icon={<Home className="h-5 w-5" />}
                title="Самовывоз"
                text="Бесплатно · согласуете день с фермером в чате"
              />
            </div>

            {method === "delivery" && (
              <div className="mt-4">
                <Input
                  label="Адрес доставки"
                  icon={<MapPin className="h-4 w-4" />}
                  placeholder="улица, дом, квартира"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            )}
          </section>

          {/* Комментарий */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-4 text-base font-semibold text-foreground">Комментарий к заказу</h2>
            <Textarea
              placeholder="Например: позвонить за час до приезда"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          {/* Оплата */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-4 text-base font-semibold text-foreground">Оплата</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <MethodCard
                active={payment === "cash"}
                onClick={() => setPayment("cash")}
                icon={<BadgeCheck className="h-5 w-5" />}
                title="Наличными"
                text="При получении"
              />
              <MethodCard
                active={payment === "kaspi"}
                onClick={() => setPayment("kaspi")}
                icon={<BadgeCheck className="h-5 w-5" />}
                title="Kaspi"
                text="Перевод фермеру после подтверждения"
              />
            </div>
          </section>
        </div>

        {/* Итог */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="text-base font-semibold text-foreground">Ваш заказ</h2>

            {farmers.length > 1 && (
              <p className="mt-3 rounded-lg bg-blue-500/10 px-3 py-2 text-xs leading-relaxed text-blue-700 dark:text-blue-400">
                В заказе товары {farmers.length} ферм — мы создадим по одному заказу на каждую,
                а привезём всё разом.
              </p>
            )}

            <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1 text-sm">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {it.product.name} × {it.quantity}
                  </span>
                  <span className="shrink-0 font-medium">{formatPrice(it.total)}</span>
                </li>
              ))}
            </ul>

            {/* Промокод */}
            <div className="mt-4">
              <label htmlFor="promo-code" className="mb-1.5 block text-sm font-medium text-foreground">
                Промокод
              </label>
              <div className="flex gap-2">
                <input
                  id="promo-code"
                  value={promo}
                  onChange={(e) => {
                    setPromo(e.target.value.toUpperCase());
                    setPromoError("");
                  }}
                  placeholder="FARMA10"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3.5 text-sm uppercase text-foreground shadow-xs outline-none placeholder:normal-case placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const code = promo.trim().toUpperCase();
                    if (!code) return;
                    if (code === promoApplied) {
                      setPromoApplied(null);
                      return;
                    }
                    setPromoApplied(code);
                    setPromoError("");
                  }}
                >
                  {promoApplied === promo.trim().toUpperCase() ? "Отм." : "OK"}
                </Button>
              </div>
              {promoApplied && (
                <p className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-500">
                  {promoApplied} будет проверен при оформлении
                </p>
              )}
              {promoError && <p className="mt-1.5 text-xs text-destructive">{promoError}</p>}
            </div>

            <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Товары</dt>
                <dd className="font-medium text-foreground">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Доставка</dt>
                <dd className="font-medium text-foreground">
                  {deliveryFee === 0 ? "Бесплатно" : formatPrice(deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-lg">
                <dt className="font-semibold text-foreground">Итого</dt>
                <dd className="font-bold text-foreground">{formatPrice(total)}</dd>
              </div>
            </dl>

            <Button type="submit" size="lg" className="mt-5 w-full" isLoading={loading}>
              Подтвердить заказ
            </Button>
          </div>
        </aside>
      </form>
    </Container>
  );
}

function MethodCard({
  active,
  onClick,
  icon,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        active
          ? "border-emerald-600/40 bg-emerald-500/5 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10"
          : "border-input hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
          active ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </button>
  );
}
