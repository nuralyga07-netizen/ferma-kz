import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Введите корректный email");
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отправить");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Восстановление пароля"
      subtitle="Укажите email — и мы пришлём инструкции"
      footer={
        <p>
          <Link to="/login" className="font-semibold text-emerald-400 hover:underline">
            ← Вернуться ко входу
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
            <Mail className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-muted-foreground">
            Если аккаунт <span className="font-medium text-foreground">{email}</span> существует,
            письмо уже в пути. Функция отправки писем подключается — при проблемах
            свяжитесь с поддержкой.
          </p>
          <Button className="w-full" onClick={() => navigateHome()}>
            На главную
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            icon={<Mail className="h-4 w-4" />}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            required
          />
          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Отправить
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

function navigateHome() {
  window.location.assign("/");
}
