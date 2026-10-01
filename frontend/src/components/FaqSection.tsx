import { Plus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FAQ } from "@/lib/faq";

const SUPPORT_EMAIL = "support@ferma.kz";

/**
 * Экран с частыми вопросами: слева заголовок и контакт поддержки, справа аккордеон.
 * Аккордеон на нативных <details name>: открыт всегда один пункт, работает с клавиатуры без JS.
 */
export function FaqSection() {
  return (
    <section id="faq" className="bg-brand-900 text-cream">
      <Container className="grid gap-10 py-16 sm:py-24 lg:min-h-[100svh] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-20">
        <div className="lg:self-start lg:sticky lg:top-32">
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Частые вопросы
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-cream/75 sm:text-lg">
            Собрали ответы на то, о чём спрашивают чаще всего. Не нашли свой
            вопрос — напишите нам, ответим в течение дня.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-6 inline-block text-base font-medium text-cream underline decoration-cream/35 underline-offset-4 transition-colors hover:decoration-cream sm:text-lg"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>

        <div className="border-t border-cream/15">
          {FAQ.map((f, i) => (
            <details key={f.q} name="home-faq" open={i === 0} className="group border-b border-cream/15">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-lg font-medium transition-colors hover:text-white sm:py-6 sm:text-xl [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus className="h-5 w-5 shrink-0 text-cream/60 transition-transform duration-200 group-open:rotate-45 group-open:text-rust" />
              </summary>
              <p className="max-w-2xl pb-6 pr-10 text-base leading-relaxed text-cream/75">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
