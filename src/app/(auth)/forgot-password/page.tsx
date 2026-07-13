"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2, ArrowLeft, Leaf } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Пожалуйста, введите корректный email");
      return;
    }

    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      <div className="absolute inset-0 gradient-hero opacity-5 dark:opacity-10" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-4"
      >
        <div className="glass-card rounded-3xl p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {!sent ? (
              /* ── Form State ── */
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-2xl font-bold text-center">Забыли пароль?</h1>
                <p className="text-sm text-muted-foreground text-center mt-1 mb-8">
                  Введите email, и мы отправим инструкцию по восстановлению
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className={`w-full pl-11 pr-4 py-3 rounded-2xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all ${
                          error ? "border-red-500/50" : "border-border"
                        }`}
                        required
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-red-500 mt-1.5 ml-1">{error}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Отправка...
                      </>
                    ) : (
                      <>
                        Отправить инструкцию
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Вернуться ко входу
                </Link>
              </motion.div>
            ) : (
              /* ── Success State ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center py-4"
              >
                {/* Animated Checkmark */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <svg className="w-full h-full" viewBox="0 0 80 80">
                    {/* Circle */}
                    <motion.circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    {/* Checkmark */}
                    <motion.path
                      d="M25 40l10 10 20-20"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                    />
                  </svg>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-xl font-bold mb-2">Письмо отправлено!</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Мы отправили инструкцию по восстановлению пароля на{" "}
                    <span className="text-foreground font-medium">{email}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Проверьте папку «Спам», если письмо не пришло в течение 5 минут
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 space-y-3"
                >
                  <button
                    onClick={() => {
                      setSent(false);
                      setEmail("");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25"
                  >
                    Отправить снова
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Вернуться ко входу
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
          <Leaf className="w-3 h-3 text-emerald-500" />
          <span>Ferma.kz — свежие продукты без посредников</span>
        </div>
      </motion.div>
    </div>
  );
}
