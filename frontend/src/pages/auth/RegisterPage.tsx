import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Carrot, Eye, EyeOff, Lock, Mail, Phone, User as UserIcon } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [role, setRole] = useState<"customer" | "farmer">("customer");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    password2: "",
    referral_code: "",
  });
  const [showPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (form.full_name.trim().length < 2) next.full_name = "Минимум 2 символа";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Введите корректный email";
    if (form.password.length < 6) next.password = "Минимум 6 символов";
    if (form.password !== form.password2) next.password2 = "Пароли не совпадают";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await api.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name.trim(),
        role,
        phone: form.phone || undefined,
        referral_code: form.referral_code || undefined,
      });
      setSession(res.user, res.access_token);
      toast.success(
        role === "farmer"
          ? "Аккаунт создан! Заявка фермера отправлена на модерацию."
          : "Аккаунт создан! Добро пожаловать!",
      );
      navigate(role === "farmer" ? "/account/profile" : "/catalog", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось зарегистрироваться");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Регистрация"
      subtitle="Присоединяйтесь к Ferma.kz"
      footer={
        <p>
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Войти
          </Link>
        </p>
      }
    >
      {/* Выбор роли */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        <RoleCard
          active={role === "customer"}
          onClick={() => setRole("customer")}
          icon={<UserIcon className="h-5 w-5" />}
          title="Покупатель"
          desc="Покупаю продукты"
        />
        <RoleCard
          active={role === "farmer"}
          onClick={() => setRole("farmer")}
          icon={<Carrot className="h-5 w-5" />}
          title="Фермер"
          desc="Продаю с хозяйства"
        />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Имя и фамилия"
          icon={<UserIcon className="h-4 w-4" />}
          placeholder="Айгерим Нурланова"
          value={form.full_name}
          onChange={set("full_name")}
          error={errors.full_name}
          required
        />
        <Input
          label="Email"
          type="email"
          icon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          autoComplete="email"
          required
        />
        <Input
          label="Телефон (необязательно)"
          type="tel"
          icon={<Phone className="h-4 w-4" />}
          placeholder="+7 700 000 00 00"
          value={form.phone}
          onChange={set("phone")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Пароль"
            type={showPass ? "text" : "password"}
            icon={<Lock className="h-4 w-4" />}
            placeholder="Минимум 6 символов"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          <Input
            label="Повторите пароль"
            type={showPass ? "text" : "password"}
            icon={showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            placeholder="••••••••"
            value={form.password2}
            onChange={set("password2")}
            error={errors.password2}
            autoComplete="new-password"
            required
          />
        </div>
        <Input
          label="Реферальный код (необязательно)"
          icon={<Mail className="h-4 w-4" />}
          placeholder="Код друга"
          value={form.referral_code}
          onChange={set("referral_code")}
          hint="Пригласивший получит 100 XP после вашей первой доставки"
        />

        {role === "farmer" && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            После регистрации вы сможете отправить заявку фермера. После одобрения
            администрацией откроется доступ к загрузке товаров и приёму заказов.
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          Создать аккаунт
        </Button>
      </form>
    </AuthLayout>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        active
          ? "border-emerald-600/40 bg-emerald-500/5 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10"
          : "border-input hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "mb-1.5 flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
          active ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}
