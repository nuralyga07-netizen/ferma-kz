"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ArrowRight, Leaf, Store, User, Phone, MapPin, Package, Briefcase, FileText } from "lucide-react";

export default function FarmerApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    farm_name: "",
    city: "",
    products: "",
    experience: "",
    bio: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Необходимо авторизоваться");
        router.push("/login");
        return;
      }

      const res = await fetch("/api/farmers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Ошибка при отправке заявки");
        return;
      }

      toast.success("Заявка успешно отправлена! Администратор проверит её в ближайшее время.");
      router.push("/dashboard");
    } catch {
      toast.error("Ошибка при отправке заявки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20 pb-10">
      <div className="absolute inset-0 gradient-hero opacity-5 dark:opacity-10" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-4"
      >
        <div className="glass-card rounded-3xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold">Стать фермером</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Заполните заявку, и администратор свяжется с вами
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">ФИО *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Телефон *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+7 700 000 00 00"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            {/* Farm Name */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Название хозяйства *</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.farm_name}
                  onChange={(e) => updateField("farm_name", e.target.value)}
                  placeholder="Ферма «Акжол»"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Город / Регион *</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Актобе"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            {/* Products */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Что производите? *</label>
              <div className="relative">
                <Package className="absolute left-4 top-3 w-4 h-4 text-muted-foreground" />
                <textarea
                  value={formData.products}
                  onChange={(e) => updateField("products", e.target.value)}
                  placeholder="Мясо, молочная продукция, овощи, мёд..."
                  rows={3}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all resize-none"
                  required
                />
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Опыт работы</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-3 w-4 h-4 text-muted-foreground" />
                <textarea
                  value={formData.experience}
                  onChange={(e) => updateField("experience", e.target.value)}
                  placeholder="Расскажите о своём опыте в сельском хозяйстве..."
                  rows={3}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all resize-none"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">О себе</label>
              <div className="relative">
                <FileText className="absolute left-4 top-3 w-4 h-4 text-muted-foreground" />
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  placeholder="Несколько слов о вашем хозяйстве..."
                  rows={3}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
            >
              {loading ? "Отправка..." : "Отправить заявку"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            После одобрения заявки вы сможете добавлять товары и управлять витриной
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
