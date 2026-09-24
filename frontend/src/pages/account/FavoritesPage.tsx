import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SkeletonCard } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAddToCart } from "@/hooks/useAddToCart";
import type { Product } from "@/types";

export function FavoritesPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useAddToCart();

  const load = () => {
    setLoading(true);
    api
      .listFavorites()
      .then(setItems)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleFav = (p: Product) => {
    void api.removeFavorite(p.id).then(load).catch(() => undefined);
  };

  return (
    <Container className="pb-16 pt-8 sm:pt-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Избранное{" "}
        <span className="text-lg font-normal text-muted-foreground sm:text-xl">
          {items.length > 0 && `(${items.length})`}
        </span>
      </h1>

      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Heart className="h-6 w-6" />}
            title="В избранном пусто"
            text="Нажимайте на сердечко у товара — он сохранится здесь"
            action={
              <Link to="/catalog">
                <Button>В каталог</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              favorite
              onToggleFavorite={toggleFav}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
