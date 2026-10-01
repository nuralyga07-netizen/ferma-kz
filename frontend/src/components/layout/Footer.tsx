import { Link, useLocation } from "react-router-dom";
import { Instagram, MapPin, Phone, Send } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/catalog", label: "Каталог" },
  { to: "/farmers", label: "Фермеры" },
  { to: "/about", label: "О нас" },
  { to: "/terms", label: "Публичная оферта" },
];

const FARMER_LINKS = [
  { to: "/register", label: "Стать фермером" },
  { to: "/login", label: "Вход для фермеров" },
];

export function Footer() {
  // На главной футер продолжает зелёные секции — без отступа, чтобы не было кремовой полосы.
  const { pathname } = useLocation();
  const flush = pathname === "/" || pathname === "/about";
  return (
    <footer className={cn("border-t border-cream/15 bg-brand-900 text-cream", !flush && "mt-20")}>
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-14">
        <div className="max-w-xs space-y-4">
          <Logo tone="light" />
          <p className="text-sm leading-relaxed text-cream/70">
            Ранний AgriTech MVP из Актобе. Развиваем сайт, аудиторию и готовим
            следующий пилот вместе с местными производителями.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-cream">Навигация</h4>
          <ul className="space-y-2.5">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm text-cream/70 transition-colors hover:text-cream"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-cream">Фермерам</h4>
          <ul className="space-y-2.5">
            {FARMER_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm text-cream/70 transition-colors hover:text-cream"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-cream">Контакты</h4>
          <ul className="space-y-2.5 text-sm text-cream/70">
            <li className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-brand-300" />
              г. Актобе, Казахстан
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-brand-300" />
              <a href="tel:+77754733804" className="transition-colors hover:text-cream">
                +7 (775) 473-38-04
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Send className="h-4 w-4 shrink-0 text-brand-300" />
              @ferma_kz
            </li>
            <li className="flex items-center gap-2.5">
              <Instagram className="h-4 w-4 shrink-0 text-brand-300" />
              @ferma.kz
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-cream/15">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 sm:flex-row">
          <p className="text-xs text-cream/70">
            © {new Date().getFullYear()} Ferma.kz — фермерские продукты Актобе
          </p>
          <p className="text-xs text-cream/70">Сделано с заботой о локальных производителях</p>
        </Container>
      </div>
    </footer>
  );
}
