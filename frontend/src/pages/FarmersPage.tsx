import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, Store, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import type { Farmer } from "@/types";

export function FarmersPage() {
  const [q, setQ] = useState("");
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      api
        .listFarmers(q.trim())
        .then((f) => alive && setFarmers(f))
        .catch(() => undefined)
        .finally(() => alive && setLoading(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <Container className="pb-16 pt-8 sm:pt-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Наши фермеры
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Каждое хозяйство проходит модерацию: проверяем документы, посещаем фермы и
          следим за качеством. Рейтинг — реальные оценки покупателей.
        </p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по имени или хозяйству…"
          aria-label="Поиск фермеров"
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3.5 text-sm text-foreground shadow-xs transition-colors outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : farmers.length === 0 ? (
        <EmptyState
          icon={<Store className="h-6 w-6" />}
          title="Фермеры не найдены"
          text="Попробуйте другой запрос"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {farmers.map((f) => (
            <Link
              key={f.id}
              to={`/farmers/${f.id}`}
              className="group rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-muted-foreground/25 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <Avatar src={f.avatar_url} name={f.farm_name ?? f.full_name} size="xl" />
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-500">
                    {f.farm_name ?? f.full_name}
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">{f.full_name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {f.city}
                  </p>
                </div>
              </div>
              {f.bio && (
                <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {f.bio}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {f.rating ? f.rating.toFixed(1) : "Новый"}
                </span>
                <span className="text-muted-foreground">{f.product_count} товаров</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="relative mt-14 overflow-hidden rounded-2xl bg-zinc-950 px-6 py-12 text-center sm:px-12 dark:border dark:border-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,oklch(0.596_0.145_163.225/0.18),transparent)]"
        />
        <div className="relative">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Хотите продавать на Ferma.kz?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Зарегистрируйтесь как фермер и отправьте заявку — модерация занимает 1–2 дня.
          </p>
          <Link to="/register" className="mt-6 inline-block">
            <Button size="lg" variant="glass">
              Стать фермером
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
