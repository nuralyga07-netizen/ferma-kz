import { Link } from "react-router-dom";
import { Heart, Leaf, ShoppingBag, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductCard({
  product,
  onAddToCart,
  favorite,
  onToggleFavorite,
}: {
  product: Product;
  onAddToCart?: (p: Product, qty?: number) => void;
  favorite?: boolean;
  onToggleFavorite?: (p: Product) => void;
}) {
  const img = product.images?.[0];
  const inStock = product.quantity_available > 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-muted-foreground/25 hover:shadow-md">
      <Link to={`/product/${product.id}`} className="relative block" aria-label={product.name}>
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          {img ? (
            <img
              src={img}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Leaf className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.is_featured && <Badge variant="primary">Хит</Badge>}
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

        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(product);
            }}
            aria-label={favorite ? "Убрать из избранного" : "В избранное"}
            className={cn(
              "absolute right-2.5 top-2.5 rounded-full p-2 shadow-sm backdrop-blur-md transition-all",
              favorite
                ? "bg-rose-500 text-white"
                : "bg-white/85 text-foreground hover:bg-white dark:bg-black/50 dark:text-white",
            )}
          >
            <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
          </button>
        )}

        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
            <span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-semibold text-rose-700">
              Нет в наличии
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{product.farmer_name ?? "Ферма"}</span>
          {product.rating > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 font-medium text-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {product.rating.toFixed(1)}
            </span>
          )}
        </div>

        <Link
          to={`/product/${product.id}`}
          className="mt-1.5 line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-500"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-foreground">{formatPrice(product.price)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {product.old_price && product.old_price > product.price && (
                <span className="mr-1.5 line-through">{formatPrice(product.old_price)}</span>
              )}
              / {product.unit}
            </p>
          </div>
          {onAddToCart && (
            <Button
              size="icon-sm"
              aria-label="Добавить в корзину"
              disabled={!inStock}
              onClick={() => onAddToCart(product)}
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
