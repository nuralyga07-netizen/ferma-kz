"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
  Leaf, Users, ShoppingBag, Star, TrendingUp, Target,
  Shield, MessageCircle, ArrowRight, BadgeCheck,
} from "lucide-react";

// ─── Animated Counter ──────────────────────────────────────────
function AnimatedCounter({ value, suffix = "", label, icon: Icon, color = "emerald" }: {
  value: number;
  suffix?: string;
  label: string;
  icon: React.ElementType;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const displayValue = isInView ? value : 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass-card rounded-2xl p-6 text-center group hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
    >
      <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-6 h-6 text-${color}-500`} />
      </div>
      <motion.div
        className="text-3xl sm:text-4xl font-bold"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <span>{displayValue}</span>
        <span className="text-emerald-500">{suffix}</span>
      </motion.div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
}

// ─── Team Data ─────────────────────────────────────────────────
const TEAM = [
  {
    name: "Азамат",
    role: "Основатель",
    emoji: "👨‍🌾",
    description: "Фермер в третьем поколении. Знает всё о сельском хозяйстве и хочет сделать продукты доступными для каждого.",
    color: "emerald",
  },
  {
    name: "Ерлан",
    role: "Tech Lead",
    emoji: "👨‍💻",
    description: "Разработчик с 10-летним опытом. Построил платформу, которая соединяет фермеров и покупателей напрямую.",
    color: "blue",
  },
  {
    name: "Гульмира",
    role: "Операционный директор",
    emoji: "👩‍💼",
    description: "Специалист по логистике и качеству. Следит чтобы каждый заказ доставлялся вовремя и с улыбкой.",
    color: "amber",
  },
];

// ─── How It Works ──────────────────────────────────────────────
const STEPS = [
  {
    icon: ShoppingBag,
    title: "Выберите продукты",
    desc: "Листайте каталог свежих фермерских продуктов от проверенных производителей Актобе",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: MessageCircle,
    title: "Свяжитесь с фермером",
    desc: "Напишите напрямую в чат, уточните детали, договоритесь о встрече или доставке",
    color: "from-amber-500 to-amber-600",
  },
  {
    icon: Package,
    title: "Получите заказ",
    desc: "Заберите продукты лично на ферме или закажите доставку до двери в удобное время",
    color: "from-emerald-600 to-emerald-700",
  },
];

// ─── Values ────────────────────────────────────────────────────
const VALUES = [
  {
    icon: Target,
    title: "Прозрачность",
    desc: "Вы точно знаете, кто вырастил вашу еду. Каждый фермер имеет рейтинг и отзывы.",
  },
  {
    icon: Shield,
    title: "Честные цены",
    desc: "Без наценок магазинов и перекупщиков. Покупаете напрямую — до 30% дешевле.",
  },
  {
    icon: Leaf,
    title: "Натуральность",
    desc: "Домашние продукты без химии, консервантов и ГМО. Всё как из бабушкиного погреба.",
  },
  {
    icon: Users,
    title: "Поддержка местных",
    desc: "Покупая у местных фермеров, вы поддерживаете экономику региона и семейный бизнес.",
  },
];

function FadeIn({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function AboutPage() {
  return (
    <>
      <head>
        <title>О нас — Ferma.kz</title>
        <meta
          name="description"
          content="Ferma.kz соединяет фермеров и покупателей напрямую. Свежие продукты без посредников по честным ценам."
        />
      </head>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5 dark:opacity-10" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-amber-500/5 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium mb-4">
              О проекте
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Соединяем фермеров и покупателей{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                напрямую
              </span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Мы верим, что каждый заслуживает свежие, натуральные продукты по честным ценам.
              Ferma.kz — это платформа, которая убирает посредников и даёт возможность покупать
              напрямую у фермеров Актобе.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative glass-card rounded-3xl p-8 sm:p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-amber-500/5 blur-3xl" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <BadgeCheck className="w-10 h-10 text-emerald-500 mb-4" />
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                  Наша миссия
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Сделать свежие фермерские продукты доступными каждому жителю Актобе. Мы устраняем
                  посредников, чтобы фермеры получали справедливую цену за свой труд, а покупатели —
                  качественные продукты без переплат.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  За каждым продуктом на нашей платформе стоит человек — фермер, который вложил душу
                  в своё дело. Мы даём вам возможность познакомиться с ними лично.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { emoji: "🌾", label: "Натуральные продукты" },
                  { emoji: "🤝", label: "Прямая связь" },
                  { emoji: "💰", label: "Честные цены" },
                  { emoji: "🚚", label: "Доставка до двери" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 p-4 text-center"
                  >
                    <span className="text-3xl block mb-1">{item.emoji}</span>
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Ferma.kz в цифрах
              </h2>
              <p className="mt-2 text-muted-foreground">
                Мы гордимся тем, что уже удалось достичь вместе с нашими фермерами
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <AnimatedCounter value={50} suffix="+" label="Фермеров" icon={Users} color="emerald" />
            <AnimatedCounter value={500} suffix="+" label="Заказов" icon={ShoppingBag} color="amber" />
            <AnimatedCounter value={98} suffix="%" label="Довольных клиентов" icon={Star} color="emerald" />
            <AnimatedCounter value={30} suffix="%" label="Дешевле рынка" icon={TrendingUp} color="amber" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium mb-4">
                Просто
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Как это работает
              </h2>
              <p className="mt-2 text-muted-foreground">
                Всего 3 шага до свежих продуктов
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((step, i) => (
              <FadeIn key={step.title}>
                <div className="relative text-center">
                  <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br shadow-xl flex items-center justify-center mb-6">
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-90`} />
                    <step.icon className="relative w-8 h-8 text-white" />
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-card shadow-md flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-600">{i + 1}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Наши ценности
              </h2>
              <p className="mt-2 text-muted-foreground">
                То, во что мы верим и что делаем каждый день
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v) => (
              <FadeIn key={v.title}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="glass-card rounded-2xl p-6 h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <v.icon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{v.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Команда
              </h2>
              <p className="mt-2 text-muted-foreground">
                Люди, которые делают Ferma.kz реальностью
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TEAM.map((member) => (
              <FadeIn key={member.name}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="glass-card rounded-2xl p-6 text-center group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-4xl">{member.emoji}</span>
                  </div>
                  <h3 className="font-semibold text-base">{member.name}</h3>
                  <p className="text-xs text-emerald-500 font-medium mb-2">{member.role}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {member.description}
                  </p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative glass-card rounded-3xl p-8 sm:p-12 text-center overflow-hidden">
            <div className="absolute inset-0 gradient-hero opacity-5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative">
              <Leaf className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Присоединяйтесь к нам
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Станьте частью сообщества людей, которые выбирают свежие продукты напрямую от
                фермеров. Зарегистрируйтесь или начните с каталога.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25"
                >
                  Зарегистрироваться
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl glass text-sm font-medium hover:bg-muted/50 transition-all"
                >
                  Смотреть каталог
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
