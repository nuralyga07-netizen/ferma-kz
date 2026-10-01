import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const unsplash = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75&w=${w}`;

interface Tile {
  eyebrow: string;
  title: string;
  text: string;
  to: string;
  image: string;
  className: string;
}

/** Большая плитка слева на две строки, справа две поменьше, ниже — ряд из двух. */
const TILES: Tile[] = [
  {
    eyebrow: "Каталог",
    title: "Весь рынок — в вашем кармане",
    text: "Мясо, молоко, овощи, мёд и выпечка от фермеров Актобе.",
    to: "/catalog",
    image: "1488459716781-31db52582fe9",
    className: "md:row-span-2 min-h-[420px] md:min-h-[560px]",
  },
  {
    eyebrow: "Фермеры",
    title: "Знайте, кто вас кормит",
    text: "Профили хозяйств появятся после согласования и проверки данных.",
    to: "/farmers",
    image: "1500595046743-cd271d694d30",
    className: "min-h-[260px]",
  },
  {
    eyebrow: "Свежесть",
    title: "Свежесть можно подтвердить",
    text: "В будущем здесь будут дата производства и документы партии.",
    to: "/catalog",
    image: "1516253593875-bd7ba052fbc5",
    className: "min-h-[260px]",
  },
  {
    eyebrow: "Доставка",
    title: "Будущие районные поставки",
    text: "Стоимость и точки выдачи определим по результатам следующего пилота.",
    to: "/catalog",
    image: "1464226184884-fa280b87c399",
    className: "min-h-[260px]",
  },
  {
    eyebrow: "Продавайте",
    title: "Станьте фермером Ferma.kz",
    text: "Оставьте заявку, чтобы обсудить участие в следующем пилоте.",
    to: "/register",
    image: "1560493676-04071c5f467b",
    className: "min-h-[260px]",
  },
];

export function ShowcaseSection() {
  return (
    <section id="showcase" className="scroll-mt-16 bg-bark text-cream">
      <Container className="py-16 sm:py-24">
        <h2 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          Ферма рядом,
          <br />
          в вашем телефоне.
        </h2>

        <div className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-2">
          {TILES.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5, ease: "easeOut" }}
              className={cn("relative", t.className)}
            >
              <ShowcaseTile tile={t} large={i === 0} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ShowcaseTile({ tile, large }: { tile: Tile; large: boolean }) {
  return (
    <Link
      to={tile.to}
      className="group absolute inset-0 overflow-hidden rounded-md border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
    >
      <img
        src={unsplash(tile.image, large ? 1400 : 1000)}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,rgb(20_16_12/0.88)_0%,rgb(20_16_12/0.35)_45%,rgb(20_16_12/0.1)_100%)] transition-colors group-hover:bg-black/10"
      />

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
          <span className="h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-rust" />
          {tile.eyebrow}
        </p>
        <div className="mt-1.5 flex items-end justify-between gap-4">
          <h3
            className={cn(
              "font-semibold leading-tight tracking-tight text-white",
              large ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
            )}
          >
            {tile.title}
          </h3>
          <ArrowUpRight className="h-5 w-5 shrink-0 -translate-x-1 translate-y-1 text-white opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
        </div>
        <p className="mt-2 max-h-20 max-w-md overflow-hidden text-sm leading-relaxed text-white/80 transition-all duration-300 md:max-h-0 md:opacity-0 group-hover:max-h-20 group-hover:opacity-100 group-focus-visible:max-h-20 group-focus-visible:opacity-100">
          {tile.text}
        </p>
      </div>
    </Link>
  );
}
