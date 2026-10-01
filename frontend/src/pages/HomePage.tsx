import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FarmHeroSection } from "@/components/ui/farm-hero-section";
import { Skeleton } from "@/components/ui/skeleton";
import { FaqSection } from "@/components/FaqSection";
import { TeamContactSection } from "@/components/TeamContactSection";
import { ProductCard } from "@/components/ProductCard";
import { ShowcaseSection } from "@/components/ShowcaseSection";
import { api } from "@/lib/api";
import type { Product } from "@/types";

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

/**
 * Коровы на пастбище на закате (Pexels #422218, бесплатная лицензия).
 * Кадр отзеркален, чтобы стадо стояло справа, а текст ложился на тёмную левую часть.
 */
const FARM_CTA_IMAGE = "/farm/pasture-1920.webp";
const FARM_CTA_SRCSET = "/farm/pasture-960.webp 960w, /farm/pasture-1920.webp 1920w";

/** Хиты продаж: сетка 4×2 на десктопе. */
const HITS_COUNT = 8;

export function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [feat, rest] = await Promise.all([
          api.listProducts({ featured: true, limit: HITS_COUNT }),
          api.listProducts({ limit: HITS_COUNT * 2 }),
        ]);
        if (!alive) return;
        // Сетка 4×2 должна быть полной: если хитов меньше, добираем обычными товарами.
        const seen = new Set(feat.items.map((p) => p.id));
        const fill = rest.items.filter((p) => !seen.has(p.id));
        setFeatured([...feat.items, ...fill].slice(0, HITS_COUNT));
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

      {/* ── CTA фермерам: полноэкранный кадр ─────── */}
      <FarmHeroSection
        imageSrc={FARM_CTA_IMAGE}
        srcSet={FARM_CTA_SRCSET}
        sizes="100vw"
        imagePosition="70% center"
        overlay="left"
        overlayStrength={0.92}
      >
        {/* Низ кадра растворяется в зелёном фоне следующей секции. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-brand-900 lg:h-40"
        />
        <Container className="relative flex min-h-[100svh] items-end pb-24 pt-24 sm:pb-32 lg:items-center lg:pb-0 lg:pt-0">
          <div className="max-w-xl">
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-cream sm:text-5xl lg:text-6xl">
              У вас своё хозяйство?
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-cream/85 sm:text-lg">
              Оставьте заявку на участие в будущем пилоте Ferma.kz. Условия
              сотрудничества согласовываются с каждым хозяйством отдельно.
            </p>
            <Link to="/register" className="mt-9 inline-block">
              <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Стать фермером
              </Button>
            </Link>
          </div>
        </Container>
      </FarmHeroSection>

      {/* ── Частые вопросы ───────────────────────── */}
      <FaqSection />

      {/* ── Поговорить с командой ────────────────── */}
      <TeamContactSection />
    </div>
  );
}
