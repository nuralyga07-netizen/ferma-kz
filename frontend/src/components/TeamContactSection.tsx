import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, Phone, Tractor, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input, Textarea } from "@/components/ui/input";

const SUPPORT_EMAIL = "support@ferma.kz";

interface Contact {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
}

const CONTACTS: Contact[] = [
  { icon: Mail, label: "Почта", value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
  { icon: Phone, label: "Телефон", value: "+7 (700) 000-00-00", href: "tel:+77000000000" },
  { icon: Tractor, label: "Фермерам", value: "Подключить своё хозяйство", href: "/register" },
];

const cardClass =
  "group flex items-center gap-4 rounded-md border border-border bg-card px-5 py-4 shadow-xs transition-colors hover:border-primary/40";

/**
 * Своего приёма сообщений на сервере нет, поэтому форма собирает письмо
 * и открывает его в почтовой программе посетителя.
 */
function sendByEmail(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  const field = (name: string) => String(data.get(name) ?? "").trim();
  const lines = [field("message"), "", `Имя: ${field("name")}`, `Почта: ${field("email")}`];
  if (field("phone")) lines.push(`Телефон: ${field("phone")}`);
  const body = lines.join("\n");
  const subject = `Сообщение с сайта от ${field("name")}`;
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Контакты команды и форма сообщения. */
export function TeamContactSection() {
  return (
    <section id="contact" className="bg-secondary">
      <Container className="grid gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Поговорите с командой
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground sm:text-lg">
            Напишите нам о заказе, доставке или подключении хозяйства —
            ответим в течение рабочего дня.
          </p>

          <ul className="mt-8 space-y-2.5 border-t border-border pt-8">
            {CONTACTS.map(({ icon: Icon, label, value, href }) => {
              const inner = (
                <>
                  <Icon className="h-5 w-5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted-foreground">{label}</span>
                    <span className="block truncate text-base font-semibold text-foreground">{value}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </>
              );
              return (
                <li key={label}>
                  {href.startsWith("/") ? (
                    <Link to={href} className={cardClass}>
                      {inner}
                    </Link>
                  ) : (
                    <a href={href} className={cardClass}>
                      {inner}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <form
          onSubmit={sendByEmail}
          className="space-y-5 self-start rounded-md border border-border bg-card p-6 shadow-lg sm:p-8"
        >
          <Input name="name" label="Имя" autoComplete="name" required className="h-11" />
          <Input name="email" type="email" label="Почта" autoComplete="email" required className="h-11" />
          <Input name="phone" type="tel" label="Телефон (необязательно)" autoComplete="tel" className="h-11" />
          <Textarea name="message" label="Сообщение" required className="min-h-32" />
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full justify-start"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Отправить сообщение
          </Button>
        </form>
      </Container>
    </section>
  );
}
