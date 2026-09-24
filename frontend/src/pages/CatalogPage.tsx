import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpDown, LayoutGrid, Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Container } from "@/components/ui/container";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Category, ProductPage as Page } from "@/types";

const SORTS = [
  { value: "new", label: "Сначала новинки" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
  { value: "rating", label: "По рейтингу" },
] as const;

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceOpen, setPriceOpen] = useState(false);

  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "new";
  const minPrice = params.get("min") ?? "";
  const maxPrice = params.get("max") ?? "";
  const organic = params.get("organic") === "1";
  const pageN = Number(params.get("page") ?? "1");

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  useEffect(() => {
    void api.listCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .listProducts({
        q: q || undefined,
        category: category || undefined,
        sort: sort as never,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        organic: organic || undefined,
        page: pageN,
        limit: 12,
      })
      .then((p) => alive && setPage(p))
      .catch((e) => alive && console.error(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, category, sort, minPrice, maxPrice, organic, pageN]);

  const hasFilters = Boolean(q || category || minPrice || maxPrice || organic);

  return (
    <Container className="pb-16 pt-8 sm:pt-10">
      {/* Заголовок */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Каталог
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {page ? `${page.total} товаров` : "Загрузка…"}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {/* Поиск */}
          <div className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Поиск товаров…"
              defaultValue={q}
              onBlur={(e) => setParam("q", e.target.value.trim())}
              onKeyDown={(e) =>
                e.key === "Enter" && setParam("q", (e.target as HTMLInputElement).value.trim())
              }
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-8 text-sm text-foreground shadow-xs transition-colors outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              aria-label="Поиск"
            />
            {q && (
              <button
                onClick={() => setParam("q", "")}
                aria-label="Очистить поиск"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Сортировка */}
          <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
            <SelectTrigger className="h-9 w-full sm:w-48" aria-label="Сортировка">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Эко */}
          <button
            onClick={() => setParam("organic", organic ? "" : "1")}
            aria-pressed={organic}
            className={cn(
              "h-9 rounded-lg border px-3.5 text-sm font-medium shadow-xs transition-colors",
              organic
                ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-input bg-background text-foreground hover:bg-accent",
            )}
          >
            🌿 Эко
          </button>

          {/* Цена */}
          <button
            onClick={() => setPriceOpen((v) => !v)}
            aria-expanded={priceOpen}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-medium shadow-xs transition-colors",
              minPrice || maxPrice
                ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-input bg-background text-foreground hover:bg-accent",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Цена</span>
          </button>
        </div>
      </div>

      {/* Категории — чипы */}
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip active={!category} onClick={() => setParam("category", "")}>
          Все
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={category === c.slug} onClick={() => setParam("category", c.slug)}>
            {c.icon} {c.name}
          </Chip>
        ))}
      </div>

      {/* Панель цен */}
      {priceOpen && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
          <div>
            <label htmlFor="min-price" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Цена от, ₸
            </label>
            <input
              id="min-price"
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setParam("min", e.target.value)}
              className="h-10 w-32 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
          <div>
            <label htmlFor="max-price" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              до, ₸
            </label>
            <input
              id="max-price"
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setParam("max", e.target.value)}
              className="h-10 w-32 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
          {(minPrice || maxPrice) && (
            <button
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("min");
                next.delete("max");
                setParams(next, { replace: true });
              }}
              className="h-10 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Сбросить
            </button>
          )}
        </div>
      )}

      {hasFilters && !loading && (
        <p className="mb-4 -mt-2 text-xs text-muted-foreground">
          {page ? `Найдено товаров: ${page.total}` : "…"}
        </p>
      )}

      {/* Сетка товаров */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : page && page.items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {page.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-10">
            <Pagination page={page.page} pages={page.pages} onChange={(n) => setParam("page", String(n))} />
          </div>
        </>
      ) : (
        <EmptyState
          icon={<LayoutGrid className="h-6 w-6" />}
          title="Ничего не найдено"
          text="Попробуйте изменить фильтры или поисковый запрос"
        />
      )}
    </Container>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
