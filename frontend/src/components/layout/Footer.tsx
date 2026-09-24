import { Link } from "react-router-dom";
import { Instagram, MapPin, Phone, Send } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/Logo";

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
  return (
    <footer className="mt-20 border-t border-border bg-background">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-14">
        <div className="max-w-xs space-y-4">
          <Logo />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Свежие фермерские продукты от проверенных хозяйств Актюбинской области.
            Без посредников — с поля до вашего стола.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-foreground">Навигация</h4>
          <ul className="space-y-2.5">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-foreground">Фермерам</h4>
          <ul className="space-y-2.5">
            {FARMER_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-foreground">Контакты</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
              г. Актобе, Казахстан
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
              <a href="tel:+77000000000" className="transition-colors hover:text-foreground">
                +7 (700) 000-00-00
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Send className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
              @ferma_kz
            </li>
            <li className="flex items-center gap-2.5">
              <Instagram className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
              @ferma.kz
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ferma.kz — фермерские продукты Актобе
          </p>
          <p className="text-xs text-muted-foreground">Сделано с заботой о локальных производителях</p>
        </Container>
      </div>
    </footer>
  );
}
