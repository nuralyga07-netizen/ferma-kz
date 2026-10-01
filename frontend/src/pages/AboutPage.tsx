import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FarmHeroSection } from "@/components/ui/farm-hero-section";

/** Пшеничное поле на закате (Unsplash 1500382017468, бесплатная лицензия). */
const HERO_IMAGE = "/farm/field-1920.webp";
const HERO_SRCSET = "/farm/field-960.webp 960w, /farm/field-1920.webp 1920w";

const STEPS = [
  { title: "Проверка", text: "Модерируем каждое хозяйство: документы, место, продукция." },
  { title: "Покупка", text: "Выбираете товары у разных ферм — одна корзина, одна доставка." },
  { title: "Доставка", text: "Фермер готовит, мы привозим на следующий день или самовывоз." },
  { title: "Обратная связь", text: "Оставляете отзыв — он попадает в рейтинг фермера." },
];

const STATS = [
  { value: "6+", label: "ферм-партнёров" },
  { value: "10", label: "категорий товаров" },
  { value: "48 ч", label: "от грядки до двери" },
  { value: "100%", label: "местных производителей" },
];

const h2Class =
  "text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl";

export function AboutPage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────── */}
      <FarmHeroSection
        imageSrc={HERO_IMAGE}
        srcSet={HERO_SRCSET}
        sizes="100vw"
        imagePosition="center 60%"
        overlay="left"
        overlayStrength={0.72}
      >
        {/* Хедер лежит поверх кадра, поэтому отступ сверху под него. */}
        <Container className="flex h-[100svh] min-h-[520px] items-center pt-16 md:pt-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Фермерские продукты
              <br />
              без посредников
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
              Ferma.kz — маркетплейс фермерских продуктов Актюбинской области.
              Мы соединяем проверенные хозяйства и жителей города: вы получаете
              свежее мясо, молоко, овощи и выпечку, а фермеры — стабильный спрос
              без комиссий торговых сетей.
            </p>
          </div>
        </Container>
      </FarmHeroSection>

      {/* ── Миссия ───────────────────────────────── */}
      <Container className="grid gap-8 py-16 sm:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <h2 className={h2Class}>Наша миссия</h2>
        <p className="text-xl leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
          Сделать так, чтобы в каждой семье Актобе был доступ к свежим
          продуктам от честных производителей. Мы не храним товар на складах —
          заказы формируются напрямую на фермах, поэтому на столе у вас
          оказывается то, что собрано или приготовлено вчера.
        </p>
      </Container>

      {/* ── Как работаем ─────────────────────────── */}
      <section className="bg-bark text-cream">
        <Container className="py-16 sm:py-24">
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Как это работает
          </h2>
          <ol className="mt-10 grid gap-x-10 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-t border-cream/15 py-6">
                <span className="text-4xl font-semibold tracking-tight text-rust sm:text-5xl">{i + 1}</span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">{s.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-cream/70">{s.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ── Цифры ────────────────────────────────── */}
      <Container className="py-16 sm:py-24">
        <h2 className={h2Class}>Ferma.kz в цифрах</h2>
        <dl className="mt-10 grid grid-cols-2 gap-x-10 sm:mt-14 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col-reverse border-t border-border py-6">
              <dt className="mt-2 text-base text-muted-foreground">{s.label}</dt>
              <dd className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </Container>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="border-t border-border bg-secondary">
        <Container className="flex flex-col items-start justify-between gap-8 py-16 sm:py-24 lg:flex-row lg:items-end">
          <div>
            <h2 className={h2Class}>Попробуйте — это просто</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Загляните в каталог или познакомьтесь с нашими фермерами.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
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
        </Container>
      </section>
    </div>
  );
}
