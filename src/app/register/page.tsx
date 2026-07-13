"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Mail, Lock, Phone, ArrowRight, Leaf, Store, ShoppingBag } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"customer" | "farmer">("customer");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role,
          phone: formData.phone || undefined,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Ошибка регистрации");
        return;
      }

      toast.success("Аккаунт создан!");

      if (role === "farmer") {
        router.push("/farmer/apply");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20 pb-10">
      <div className="absolute inset-0 gradient-hero opacity-5 dark:opacity-10" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-amber-500/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-4"
      >
        <div className="glass-card rounded-3xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold">Создать аккаунт</h1>
            <p className="text-sm text-muted-foreground mt-1">Присоединяйтесь к сообществу</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          {/* Role Switch */}
          <div className="flex p-1 rounded-2xl bg-muted mb-6">
            <button
              onClick={() => setRole("customer")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                role === "customer" ? "bg-white dark:bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Покупатель
            </button>
            <button
              onClick={() => setRole("farmer")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                role === "farmer" ? "bg-white dark:bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Store className="w-4 h-4" />
              Фермер
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Имя и фамилия</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  placeholder="Иван Иванов"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Телефон</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+7 700 000 00 00"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {role === "farmer" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20"
              >
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  🎉 После регистрации вы сможете подать заявку на размещение ваших продуктов.
                  Администратор проверит и одобрит её в ближайшее время!
                </p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
            >
              {loading ? "Создание..." : "Создать аккаунт"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-center gap-3 mt-6">
            <Link href="/login" className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-border hover:bg-muted/50 transition-all text-sm font-medium">
              <User className="w-4 h-4" />
              Уже есть аккаунт?
            </Link>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Регистрируясь, вы соглашаетесь с условиями использования и политикой конфиденциальности
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
          <Leaf className="w-3 h-3 text-emerald-500" />
          <span>Ferma.kz — свежие продукты без посредников</span>
        </div>
      </motion.div>
    </div>
  );
}
