import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Mail } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const setSession = useAuthStore((s) => s.setSession);
  const fetchRemote = useCartStore((s) => s.fetchRemote);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Введите корректный email";
    if (!password) next.password = "Введите пароль";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setSession(res.user, res.access_token);
      void fetchRemote();
      toast.success(`С возвращением, ${res.user.full_name.split(" ")[0]}!`);
      navigate(location.state?.from ?? (res.user.role === "farmer" ? "/farmer" : res.user.role === "admin" ? "/admin" : "/"), {
        replace: true,
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Вход"
      subtitle="Рады видеть вас снова"
      footer={
        <p>
          Нет аккаунта?{" "}
          <Link to="/register" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          icon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          required
        />
        <Input
          label="Пароль"
          type="password"
          icon={<Lock className="h-4 w-4" />}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          required
        />
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded accent-emerald-500"
              readOnly
              checked
            />
            Запомнить меня
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
            Забыли пароль?
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          Войти
        </Button>
      </form>
    </AuthLayout>
  );
}
