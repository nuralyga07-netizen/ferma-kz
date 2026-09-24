import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Carrot, Leaf, ShieldCheck, Store, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { SectionHead } from "@/components/SectionHead";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Category, Farmer, Product } from "@/types";

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cats, feat, far] = await Promise.all([
          api.listCategories(),
          api.listProducts({ featured: true, limit: 8 }),
          api.listFarmers("", 6, 0),
        ]);
        if (!alive) return;
        setCategories(cats);
        setFeatured(feat.items);
        setFarmers(far);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,oklch(0.596_0.145_163.225/0.07),transparent)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,oklch(0.596_0.145_163.225/0.1),transparent)]"
        />
        <Container className="relative flex flex-col items-center py-20 text-center sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
              <Leaf className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
              Свежесть прямо с полей Актобе
            </span>

            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Фермерские продукты{" "}
              <span className="text-emerald-600 dark:text-emerald-500">без посредников</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Мясо, молоко, овощи, мёд и домашняя выпечка — напрямую от проверенных
              хозяйств. Закажите сегодня — завтра на вашем столе.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link to="/catalog">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  В каталог
                </Button>
              </Link>
              <Link to="/farmers">
                <Button size="lg" variant="outline">
                  Наши фермеры
                </Button>
              </Link>
            </div>

            <div className="mx-auto mt-14 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
              <HeroStat value="6+" label="ферм-партнёров" />
              <HeroStat value="10" label="категорий" />
              <HeroStat value="4.9" label="средний рейтинг" star />
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ── Преимущества ─────────────────────────── */}
      <Container className="py-14 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          <Feature
            icon={<Truck className="h-5 w-5" />}
            title="Доставка по Актобе"
            text="500 ₸, бесплатно от 10 000 ₸. Самовывоз — бесплатно."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Проверенные фермеры"
            text="Каждое хозяйство проходит модерацию и получает рейтинг."
          />
          <Feature
            icon={<Carrot className="h-5 w-5" />}
            title="Свежесть гарантирована"
            text="Собираем утром — привозим вечером. Без холодильников на складах."
          />
        </div>
      </Container>

      {/* ── Категории ────────────────────────────── */}
      <Container className="pb-14">
        <SectionHead title="Категории" subtitle="Всё, что нужно для дома и праздника" linkTo="/catalog" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            : categories.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                >
                  <Link
                    to={`/catalog?category=${c.slug}`}
                    className="flex h-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-muted-foreground/25 hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                      {c.icon ?? "🌿"}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">{c.name}</span>
                  </Link>
                </motion.div>
              ))}
        </div>
      </Container>

      {/* ── Хиты ─────────────────────────────────── */}
      <Container className="pb-14">
        <SectionHead title="Хиты продаж" subtitle="Что покупают чаще всего" linkTo="/catalog" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              ))
            : featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!loading && featured.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Товары скоро появятся — следите за новинками!
          </p>
        )}
      </Container>

      {/* ── Фермеры ──────────────────────────────── */}
      <Container className="pb-14">
        <SectionHead title="Наши фермеры" subtitle="Люди, которым можно доверять" linkTo="/farmers" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            : farmers.map((f) => (
                <Link
                  key={f.id}
                  to={`/farmers/${f.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-muted-foreground/25 hover:shadow-md"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white">
                    {(f.farm_name ?? f.full_name).slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {f.farm_name ?? f.full_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.full_name} · {f.city}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-foreground">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {f.rating ? f.rating.toFixed(1) : "Новый"}
                      <span className="text-muted-foreground">
                        · {f.product_count} тов.
                      </span>
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                </Link>
              ))}
        </div>
      </Container>

      {/* ── CTA фермерам (тёмная панель) ─────────── */}
      <Container className="pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-zinc-950 px-6 py-14 text-center sm:px-12 dark:border dark:border-white/10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,oklch(0.596_0.145_163.225/0.18),transparent)]"
          />
          <div className="relative mx-auto max-w-xl">
            <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Store className="h-6 w-6 text-emerald-400" />
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              У вас своё хозяйство?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Присоединяйтесь к Ferma.kz и продавайте продукцию напрямую покупателям.
              Без комиссий за размещение и рекламы.
            </p>
            <Link to="/register" className="mt-7 inline-block">
              <Button size="lg" variant="glass">
                Стать фермером
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

function HeroStat({ value, label, star }: { value: string; label: string; star?: boolean }) {
  return (
    <div className="bg-background px-4 py-5">
      <p className="flex items-center justify-center gap-1 text-2xl font-semibold tracking-tight text-foreground">
        {value}
        {star && <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-xs")}>
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
