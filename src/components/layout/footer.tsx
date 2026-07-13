import Link from "next/link";
import { Leaf, Instagram, Telegram, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">F</span>
              </div>
              <span className="font-semibold">
                Ferma<span className="text-emerald-500">.kz</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Свежие фермерские продукты напрямую от производителей в Актобе. Без посредников, без наценок.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:border-emerald-500/50 hover:text-emerald-500 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:border-emerald-500/50 hover:text-emerald-500 transition-all">
                <Telegram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:border-emerald-500/50 hover:text-emerald-500 transition-all">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Для покупателей */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Покупателям
            </h3>
            <ul className="space-y-3">
              {["Каталог", "Как заказать", "Доставка", "Акции", "Отзывы"].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Фермерам */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Фермерам
            </h3>
            <ul className="space-y-3">
              {["Стать продавцом", "Преимущества", "Тарифы", "Истории успеха"].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Контакты */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Контакты
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>г. Актобе, Казахстан</li>
              <li>
                <a href="tel:+77000000000" className="hover:text-foreground transition-colors">
                  +7 700 000 00 00
                </a>
              </li>
              <li>
                <a href="mailto:hello@ferma.kz" className="hover:text-foreground transition-colors">
                  hello@ferma.kz
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ferma.kz — Все права защищены
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <span>Поддерживаем местных фермеров</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
