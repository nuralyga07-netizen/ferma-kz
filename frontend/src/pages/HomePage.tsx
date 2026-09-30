import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Store, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FarmHeroSection } from "@/components/ui/farm-hero-section";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { SectionHead } from "@/components/SectionHead";
import { ShowcaseSection } from "@/components/ShowcaseSection";
import { api } from "@/lib/api";
import type { Farmer, Product } from "@/types";

/**
 * Степь с ковылём на закате (Pexels #4189161, бесплатная лицензия).
 * Пережато ffmpeg: 12 с, 24 fps, без звука, faststart — см. public/hero.
 * Телефонам отдаём 720p, остальным 1080p; постер — первый кадр ролика.
 */
const HERO_POSTER = "/hero/hero-poster-1920.webp";
const HERO_POSTER_SRCSET = "/hero/hero-poster-960.webp 960w, /hero/hero-poster-1920.webp 1920w";
const HERO_VIDEO = [
  { src: "/hero/hero-720.mp4", media: "(max-width: 767px)" },
  { src: "/hero/hero-1080.mp4" },
];

/** Хиты продаж: сетка 4×2 на десктопе. */
const HITS_COUNT = 8;

export function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [feat, rest, far] = await Promise.all([
          api.listProducts({ featured: true, limit: HITS_COUNT }),
          api.listProducts({ limit: HITS_COUNT * 2 }),
          api.listFarmers("", 6, 0),
        ]);
        if (!alive) return;
        // Сетка 4×2 должна быть полной: если хитов меньше, добираем обычными товарами.
        const seen = new Set(feat.items.map((p) => p.id));
        const fill = rest.items.filter((p) => !seen.has(p.id));
        setFeatured([...feat.items, ...fill].slice(0, HITS_COUNT));
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
      <FarmHeroSection
        imageSrc={HERO_POSTER}
        srcSet={HERO_POSTER_SRCSET}
        sizes="100vw"
        videoSources={HERO_VIDEO}
        imagePosition="center"
        overlay="left"
        overlayStrength={0.72}
      >
        {/* Ровно высота окна; хедер лежит поверх, поэтому отступ сверху под него. */}
        <Container className="flex h-[100svh] min-h-[520px] items-center pt-16 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Фермерские продукты
              <br />
              без посредников
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
              Ferma.kz развивает цифровую площадку местных продуктов в Актобе.
              Сейчас мы собираем аудиторию и готовим следующий пилот.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/catalog">
                <Button
                  size="lg"
                  className="bg-white text-neutral-900 hover:bg-white/90"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  В каталог
                </Button>
              </Link>
              <Link to="/farmers">
                <Button size="lg" variant="glass">
                  Наши фермеры
                </Button>
              </Link>
            </div>
          </motion.div>
        </Container>

        <a
          href="#showcase"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white sm:flex"
        >
          Листайте
          <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
        </a>
      </FarmHeroSection>

      {/* ── Второй экран: бенто-витрина ─────── */}
      <ShowcaseSection />

      {/* ── Хиты ─────────────────────────────────── */}
      <Container className="py-16 sm:py-24">
        <div className="mb-10 flex items-end justify-between gap-6 sm:mb-14">
          <h2 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Хиты продаж
          </h2>
          <Link
            to="/catalog"
            className="group hidden shrink-0 items-center gap-1.5 pb-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Весь каталог
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: HITS_COUNT }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              ))
            : featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!loading && featured.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
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
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white">
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
        <div className="relative overflow-hidden rounded-2xl bg-bark px-6 py-14 text-center sm:px-12 border border-white/10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgb(224_112_58/0.2),transparent)]"
          />
          <div className="relative mx-auto max-w-xl">
            <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Store className="h-6 w-6 text-brand-400" />
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              У вас своё хозяйство?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/65 sm:text-base">
              Оставьте заявку на участие в будущем пилоте Ferma.kz. Условия
              сотрудничества согласовываются с каждым хозяйством отдельно.
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
