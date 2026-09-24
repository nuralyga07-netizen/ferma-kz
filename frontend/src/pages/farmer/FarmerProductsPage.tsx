import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Leaf, Package, PackagePlus, Pencil, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/EmptyState";
import { api, ApiError } from "@/lib/api";
import { formatPrice, formatDateTime } from "@/lib/utils";
import type { Product } from "@/types";

const PAGE_SIZE = 50;

export function FarmerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.listProducts({ mine: true, limit: PAGE_SIZE, page: p });
      setProducts(res.items);
      setTotal(res.total);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [page, load]);

  const deactivate = async (p: Product) => {
    if (!confirm(`Скрыть товар «${p.name}» из каталога?`)) return;
    setBusyId(p.id);
    try {
      await api.deactivateProduct(p.id);
      toast.success("Товар скрыт из каталога");
      void load(page);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось скрыть товар");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Container className="max-w-5xl pb-16 pt-8 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Мои товары</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "товар" : total < 5 ? "товара" : "товаров"}
          </p>
        </div>
        <Link to="/farmer/products/new">
          <Button leftIcon={<PackagePlus className="h-4 w-4" />}>Добавить товар</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8 text-muted-foreground" />}
          title="Товаров пока нет"
          text="Добавьте первый товар — фото, цену и описание, и он сразу появится в каталоге"
          action={
            <Link to="/farmer/products/new">
              <Button leftIcon={<PackagePlus className="h-4 w-4" />}>Создать товар</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((p) => (
              <div key={p.id} className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground/40"><Leaf className="h-6 w-6" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/product/${p.id}`}
                      className="truncate font-semibold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      {p.name}
                    </Link>
                    {!p.is_active && <Badge variant="danger">скрыт</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.category_name ?? "Без категории"} · {formatDateTime(p.created_at)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-bold text-foreground">{formatPrice(p.price)}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.quantity_available} {p.unit}
                    </span>
                    {p.is_featured && (
                      <Badge variant="warning">
                        <Star className="h-3 w-3" /> в подборке
                      </Badge>
                    )}
                    {p.organic && (
                      <Badge variant="success">
                        <Leaf className="h-3 w-3" /> органик
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <Link to={`/farmer/products/${p.id}/edit`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full" leftIcon={<Pencil className="h-3.5 w-3.5" />}>
                        Изменить
                      </Button>
                    </Link>
                    {p.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={busyId === p.id}
                        onClick={() => void deactivate(p)}
                      >
                        Скрыть
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {total > PAGE_SIZE && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="secondary"
                disabled={page * PAGE_SIZE >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Ещё
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
