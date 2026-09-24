import { Link } from "react-router-dom";
import { CheckCircle2, HeartHandshake, Leaf, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const FAQ = [
  {
    q: "Откуда берутся продукты?",
    a: "Только от фермеров Актюбинской области и соседних регионов. Каждое хозяйство проходит модерацию: мы проверяем документы, при необходимости выезжаем на место и следим за рейтингом.",
  },
  {
    q: "Как быстро доставят?",
    a: "Заказы, оформленные до 14:00, доставляем на следующий день по Актобе. Самовывоз с фермы возможен в согласованный с фермером день.",
  },
  {
    q: "Сколько стоит доставка?",
    a: "500 ₸ по городу, бесплатно при заказе от 10 000 ₸ или при самовывозе. Заказ из нескольких ферм — одна доставка на все хозяйства.",
  },
  {
    q: "Можно ли вернуть товар?",
    a: "Да. Если продукт не соответствует описанию или испорчен — сфотографируйте его, напишите в чат или позвоните. Вернём деньги или заменим товар.",
  },
  {
    q: "Как стать фермером на платформе?",
    a: "Зарегистрируйтесь, выберите роль «Фермер» и заполните заявку: хозяйство, продукция, контакты. После одобрения администрацией вы сможете добавлять товары и принимать заказы.",
  },
  {
    q: "Есть ли скидки?",
    a: "Да, у нас работают промокоды (например, FARMA10 — 10% от 3 000 ₸). Также часть ферм сами назначают скидки на сезонные товары.",
  },
];

export function AboutPage() {
  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="border-b border-border">
        <Container className="py-16 text-center sm:py-20">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
            <Leaf className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" /> О нас
          </span>
          <h1 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Фермерские продукты — без посредников
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Ferma.kz — маркетплейс фермерских продуктов Актюбинской области.
            Мы соединяем проверенные хозяйства и жителей города: вы получаете
            свежее мясо, молоко, овощи и выпечку, а фермеры — стабильный спрос
            без комиссий торговых сетей.
          </p>
        </Container>
      </section>

      <Container>
        {/* Миссия */}
        <div className="mx-auto mt-14 max-w-3xl text-center">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Наша миссия
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Сделать так, чтобы в каждой семье Актобе был доступ к свежим
            продуктам от честных производителей. Мы не храним товар на складах —
            заказы формируются напрямую на фермах, поэтому на столе у вас
            оказывается то, что собрано или приготовлено вчера.
          </p>
        </div>

        {/* Как работаем */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Step
            icon={<ShieldCheck className="h-5 w-5" />}
            title="1. Проверка"
            text="Модерируем каждое хозяйство: документы, место, продукция."
          />
          <Step
            icon={<HeartHandshake className="h-5 w-5" />}
            title="2. Покупка"
            text="Выбираете товары у разных ферм — одна корзина, одна доставка."
          />
          <Step
            icon={<Truck className="h-5 w-5" />}
            title="3. Доставка"
            text="Фермер готовит, мы привозим на следующий день или самовывоз."
          />
          <Step
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="4. Обратная связь"
            text="Оставляете отзыв — он попадает в рейтинг фермера."
          />
        </div>

        {/* Цифры */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Stat value="6+" label="ферм-партнёров" />
          <Stat value="10" label="категорий товаров" />
          <Stat value="48 ч" label="от грядки до двери" />
          <Stat value="100%" label="местных производителей" />
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-6 text-center text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Частые вопросы
          </h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-border bg-card p-5 shadow-xs open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="shrink-0 text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="relative mt-16 overflow-hidden rounded-2xl bg-zinc-950 px-6 py-12 text-center sm:px-12 dark:border dark:border-white/10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,oklch(0.596_0.145_163.225/0.18),transparent)]"
          />
          <div className="relative">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Попробуйте — это просто
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
              Загляните в каталог или познакомьтесь с нашими фермерами.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/catalog">
                <Button size="lg">В каталог</Button>
              </Link>
              <Link to="/farmers">
                <Button size="lg" variant="glass">
                  Наши фермеры
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center shadow-xs">
      <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}
