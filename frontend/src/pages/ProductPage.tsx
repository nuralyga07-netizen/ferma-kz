import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronLeft,
  Leaf,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { RatingStars } from "@/components/RatingStars";
import { Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { api, ApiError } from "@/lib/api";
import { useAddToCart } from "@/hooks/useAddToCart";
import { formatPrice, cn } from "@/lib/utils";
import type { Product, Review } from "@/types";

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useAddToCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const [reviewFor, setReviewFor] = useState<{ orderId: string; orderNumber: number } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    Promise.all([api.getProduct(id), api.listReviews(id)])
      .then(([p, r]) => {
        if (!alive) return;
        setProduct(p);
        setReviews(r);
      })
      .catch((e) => alive && console.error(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <Spinner className="min-h-[50vh]" />;
  if (!product) {
    return (
      <Container className="pt-32 text-center">
        <p className="text-lg font-semibold text-foreground">Товар не найден</p>
        <Link to="/catalog" className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-500">
          ← В каталог
        </Link>
      </Container>
    );
  }

  const inStock = product.quantity_available > 0;
  const images = product.images?.length ? product.images : [""];

  const submitReview = async () => {
    if (!reviewFor) return;
    setReviewLoading(true);
    try {
      await api.createReview(reviewFor.orderId, {
        product_id: product.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      toast.success("Спасибо за отзыв!");
      setReviewFor(null);
      setReviewComment("");
      const [p, r] = await Promise.all([api.getProduct(product.id), api.listReviews(product.id)]);
      setProduct(p);
      setReviews(r);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось сохранить отзыв");
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <Container className="pb-16 pt-6 sm:pt-8">
      <Link
        to="/catalog"
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Назад в каталог
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Галерея */}
        <div>
          <div className="overflow-hidden rounded-xl border border-border bg-muted">
            <div className="aspect-[4/3] bg-background">
              {images[imgIdx] ? (
                <img
                  src={images[imgIdx]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Leaf className="h-14 w-14 text-muted-foreground/40" />
                </div>
              )}
            </div>
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  aria-label={`Фото ${i + 1}`}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                    i === imgIdx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100",
                  )}
                >
                  {src ? (
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center bg-muted text-muted-foreground/40">
                      <Leaf className="h-5 w-5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Инфо */}
        <div>
          <div className="flex flex-wrap gap-1.5">
            {product.is_featured && <Badge variant="primary">Хит продаж</Badge>}
            {product.organic && (
              <Badge variant="success">
                <Leaf className="h-3 w-3" /> Эко
              </Badge>
            )}
            {product.old_price && product.old_price > product.price && (
              <Badge variant="danger">
                −{Math.round((1 - product.price / product.old_price) * 100)}%
              </Badge>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-2.5">
            <RatingStars value={product.rating} count={product.review_count} size={16} />
          </div>

          {/* Цена */}
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {formatPrice(product.price)}
            </p>
            {product.old_price && product.old_price > product.price && (
              <p className="text-lg text-muted-foreground line-through">
                {formatPrice(product.old_price)}
              </p>
            )}
            <p className="text-sm text-muted-foreground">/ {product.unit}</p>
          </div>

          <p
            className={cn(
              "mt-2 flex items-center gap-1.5 text-sm font-medium",
              inStock ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                inStock ? "bg-emerald-500" : "bg-destructive",
              )}
            />
            {inStock ? `В наличии: ${product.quantity_available} ${product.unit}` : "Нет в наличии"}
          </p>

          {/* Кол-во + в корзину */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex h-11 items-center rounded-lg border border-input bg-background shadow-xs">
              <button
                onClick={() => setQty((v) => Math.max(1, v - 1))}
                className="flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Меньше"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-foreground">{qty}</span>
              <button
                onClick={() => setQty((v) => Math.min(product.quantity_available || 1, v + 1))}
                className="flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Больше"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="lg"
              className="h-11 flex-1 sm:flex-none sm:px-10"
              disabled={!inStock}
              leftIcon={<ShoppingBag className="h-4 w-4" />}
              onClick={() => addToCart(product, qty)}
            >
              В корзину
            </Button>
          </div>

          {/* Доставка */}
          <div className="mt-6 space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <p className="flex items-center gap-2.5 text-foreground">
              <Truck className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-500" />
              Доставка 500 ₸ · бесплатно от 10 000 ₸
            </p>
            <p className="flex items-center gap-2.5 text-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-500" />
              Самовывоз с фермы — бесплатно
            </p>
          </div>

          {/* Фермер */}
          <Link
            to={`/farmers/${product.farmer_id}`}
            className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs transition-all hover:border-muted-foreground/25 hover:shadow-md"
          >
            <Avatar name={product.farmer_name ?? "Ф"} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {product.farmer_name ?? "Фермер"}
              </p>
              <p className="text-xs text-muted-foreground">
                Фермер · {product.farmer_city ?? "Актобе"}
              </p>
            </div>
            <MessageCircle className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
          </Link>

          {/* Описание */}
          {product.description && (
            <div className="mt-7">
              <h2 className="mb-2.5 text-base font-semibold text-foreground">Описание</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Отзывы */}
      <section className="mt-14">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Отзывы{" "}
            <span className="text-base font-normal text-muted-foreground">
              ({reviews.length})
            </span>
          </h2>
        </div>

        {reviews.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Пока нет отзывов. Купите товар — и расскажите, как всё было.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                      {r.customer_name.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.customer_name}</p>
                      <RatingStars value={r.rating} size={13} />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>
                {r.comment && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Модалка отзыва */}
      <Modal open={!!reviewFor} onClose={() => setReviewFor(null)} title="Оценить товар">
        {reviewFor && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Заказ №{reviewFor.orderNumber}: {product.name}
            </p>
            <RatingStars
              value={reviewRating}
              size={28}
              interactive
              onChange={setReviewRating}
            />
            <Textarea
              placeholder="Поделитесь впечатлениями (необязательно)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            <Button className="w-full" onClick={submitReview} isLoading={reviewLoading}>
              Отправить отзыв
            </Button>
          </div>
        )}
      </Modal>
    </Container>
  );
}
