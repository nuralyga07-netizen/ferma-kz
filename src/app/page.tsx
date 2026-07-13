"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Leaf, Shield, Package, Star, TrendingUp, Users, BadgeCheck, ShoppingBag, Wheat, Droplets, Egg, Apple } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const categories = [
  { name: "Мясо и птица", icon: Wheat, color: "from-red-500/20 to-red-500/5" },
  { name: "Молочные продукты", icon: Droplets, color: "from-blue-500/20 to-blue-500/5" },
  { name: "Овощи", icon: Apple, color: "from-green-500/20 to-green-500/5" },
  { name: "Яйца", icon: Egg, color: "from-amber-500/20 to-amber-500/5" },
  { name: "Мёд", icon: ShoppingBag, color: "from-yellow-500/20 to-yellow-500/5" },
  { name: "Домашняя выпечка", icon: Wheat, color: "from-orange-500/20 to-orange-500/5" },
];

const steps = [
  {
    icon: ShoppingBag,
    title: "Выберите продукты",
    desc: "Листайте каталог свежих фермерских продуктов от проверенных производителей",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: Users,
    title: "Свяжитесь с фермером",
    desc: "Напишите напрямую фермеру, уточните детали и договоритесь о встрече",
    color: "from-amber-500 to-amber-600",
  },
  {
    icon: Package,
    title: "Получите заказ",
    desc: "Заберите продукты лично или закажите доставку до двери",
    color: "from-emerald-600 to-emerald-700",
  },
];

const stats = [
  { value: "50+", label: "Фермеров", icon: Users },
  { value: "500+", label: "Заказов", icon: ShoppingBag },
  { value: "98%", label: "Довольных", icon: Star },
  { value: "30%", label: "Дешевле рынка", icon: TrendingUp },
];

const faqs = [
  { q: "Как начать пользоваться?", a: "Зарегистрируйтесь, выберите продукты в каталоге и свяжитесь с фермером напрямую через чат." },
  { q: "Как проверить качество?", a: "Каждый фермер имеет рейтинг и отзывы от реальных покупателей. Вы можете задать вопросы до покупки." },
  { q: "Как оплатить заказ?", a: "Оплата напрямую фермеру при получении. Никаких скрытых комиссий и предоплат." },
  { q: "Есть ли доставка?", a: "Да, многие фермеры предлагают доставку. Условия обсуждаются индивидуально." },
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

export default function HomePage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.15),transparent_50%)]" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl animate-float" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-emerald-300 mb-6"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>Свежие продукты напрямую от фермеров Актобе</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
              Свежие продукты{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                без посредников
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-xl leading-relaxed">
              Покупайте домашние продукты напрямую у фермеров. Свежее мясо, молочка, овощи, мёд — по честным ценам, без перекупщиков.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/catalog"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-emerald-900 font-semibold text-sm hover:bg-emerald-50 transition-all duration-300 hover:shadow-2xl hover:shadow-white/25"
              >
                Начать покупки
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/#how-it-works"
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl glass text-white/80 font-medium text-sm hover:bg-white/10 transition-all duration-300"
              >
                Как это работает
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/40 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium mb-4">
                Почему мы?
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Покупайте у фермеров,{" "}
                <span className="text-emerald-500">не переплачивайте</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Мы объединяем фермеров и покупателей напрямую, убирая цепочку посредников
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Leaf,
                title: "100% натуральное",
                desc: "Все продукты домашние, без химии и консервантов. Вы знаете кто вырастил вашу еду.",
                color: "emerald",
              },
              {
                icon: Shield,
                title: "Честные цены",
                desc: "Покупаете напрямую у фермера — без наценок магазинов и перекупщиков. До 30% дешевле.",
                color: "amber",
              },
              {
                icon: Package,
                title: "Доставка до двери",
                desc: "Многие фермеры привозят заказы сами. Или вы можете забрать лично в удобное время.",
                color: "emerald",
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -4 }}
                className="glass-card rounded-2xl p-8 group cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-500`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium mb-4">
                Просто
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Всего <span className="text-amber-500">3 шага</span> до свежих продуктов
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => (
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
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Категории продуктов
              </h2>
              <p className="mt-4 text-muted-foreground">
                Всё что нужно для домашнего стола — от фермеров прямиком к вам
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <motion.div
                key={cat.name}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-card rounded-2xl p-6 text-center cursor-pointer group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <cat.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.1),transparent_60%)]" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <BadgeCheck className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              Готовы попробовать?
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-xl mx-auto">
              Присоединяйтесь к сообществу людей, которые выбирают свежие продукты напрямую от фермеров
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-emerald-900 font-semibold text-sm hover:bg-emerald-50 transition-all duration-300 hover:shadow-2xl hover:shadow-white/25"
              >
                Зарегистрироваться
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl glass text-white/80 font-medium text-sm hover:bg-white/10 transition-all duration-300"
              >
                Смотреть каталог
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Часто задаваемые вопросы
              </h2>
            </div>
          </FadeIn>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <FadeIn key={faq.q}>
                <details className="group glass-card rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                    <span className="font-medium text-sm">{faq.q}</span>
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-open:rotate-180 transition-transform duration-300">
                      <ArrowRight className="w-3 h-3 text-emerald-500" />
                    </div>
                  </summary>
                  <div className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
