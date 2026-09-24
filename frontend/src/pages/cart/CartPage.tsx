import { Link, useNavigate } from "react-router-dom";
import { Leaf, Minus, Plus, ShoppingCart, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/EmptyState";
import { useCartItems, useCartSubtotal, useCartStore } from "@/store/cart";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useAuthStore } from "@/store/auth";
import { formatPrice, cn } from "@/lib/utils";

export function CartPage() {
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const user = useAuthStore((s) => s.user);
  const { setQuantity, removeFromCart } = useAddToCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <Container className="flex min-h-[50vh] items-center justify-center pt-16">
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title="Корзина пуста"
          text="Добавьте что-нибудь свежее из каталога"
          action={
            <Link to="/catalog">
              <Button>В каталог</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  const freeDelivery = subtotal >= 10000;
  const deliveryFee = freeDelivery ? 0 : 500;
  const progress = Math.min(100, Math.round((subtotal / 10000) * 100));

  return (
    <Container className="pb-16 pt-8 sm:pt-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Корзина{" "}
        <span className="text-lg font-normal text-muted-foreground sm:text-xl">
          ({items.length})
        </span>
      </h1>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        {/* Позиции */}
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-xs"
            >
              <Link
                to={`/product/${it.product.id}`}
                className="block h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
              >
                {it.product.images?.[0] ? (
                  <img
                    src={it.product.images[0]}
                    alt={it.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-muted-foreground/40">
                    <Leaf className="h-6 w-6" />
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1 basis-40">
                <Link
                  to={`/product/${it.product.id}`}
                  className="line-clamp-1 text-sm font-semibold text-foreground transition-colors hover:text-emerald-700 dark:hover:text-emerald-500"
                >
                  {it.product.name}
                </Link>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {it.product.farmer_name} · {formatPrice(it.product.price)} / {it.product.unit}
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">{formatPrice(it.total)}</p>
              </div>

              <div className="flex h-9 items-center rounded-lg border border-input bg-background shadow-xs">
                <button
                  onClick={() => setQuantity(it.product, it.quantity - 1)}
                  className="flex h-full w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Меньше"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-7 text-center text-sm font-semibold text-foreground">
                  {it.quantity}
                </span>
                <button
                  onClick={() => setQuantity(it.product, it.quantity + 1)}
                  className="flex h-full w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Больше"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                onClick={() => removeFromCart(it.id)}
                aria-label="Удалить из корзины"
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            onClick={() => {
              if (user) {
                items.forEach((it) => void useCartStore.getState().removeRemote(it.id));
              } else {
                useCartStore.getState().clearLocal();
              }
            }}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
          >
            Очистить корзину
          </button>
        </div>

        {/* Итог */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="text-base font-semibold text-foreground">Итого</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Товары</dt>
                <dd className="font-medium text-foreground">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Truck className="h-4 w-4" /> Доставка
                </dt>
                <dd className="font-medium text-foreground">
                  {freeDelivery ? (
                    <span className="text-emerald-700 dark:text-emerald-500">Бесплатно</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt className="font-semibold text-foreground">К оплате</dt>
                <dd className="font-bold text-foreground">
                  {formatPrice(subtotal + deliveryFee)}
                </dd>
              </div>
            </dl>

            {!freeDelivery && (
              <div className="mt-4">
                <Progress value={progress} className="h-1.5" />
                <p className="mt-2 text-xs text-muted-foreground">
                  Ещё <span className="font-semibold text-foreground">{formatPrice(10000 - subtotal)}</span>{" "}
                  до бесплатной доставки
                </p>
              </div>
            )}
            {freeDelivery && (
              <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Доставка бесплатно 🎉
              </p>
            )}

            <Button
              size="lg"
              className={cn("mt-5 w-full")}
              onClick={() => navigate(user ? "/checkout" : "/login", { state: { from: "/checkout" } })}
            >
              Оформить заказ
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Оплата при получении · наличные или Kaspi
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
