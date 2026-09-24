import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Award, Carrot, LogOut, Save } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { formatDate } from "@/lib/utils";
import type { FarmerApplication } from "@/types";

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)!;
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [form, setForm] = useState({
    full_name: user.full_name,
    phone: user.phone ?? "",
    telegram: user.telegram ?? "",
    address: user.address ?? "",
    bio: user.bio ?? "",
    city: user.city,
  });
  const [saving, setSaving] = useState(false);
  const [app, setApp] = useState<FarmerApplication | null>(null);
  const [checkingApp, setCheckingApp] = useState(false);

  useEffect(() => {
    if (user.role === "farmer" && user.farm_name) return;
    let alive = true;
    api
      .myApplication()
      .then((a) => alive && setApp(a))
      .catch(() => alive && setApp(null))
      .finally(() => alive && setCheckingApp(false));
    return () => {
      alive = false;
    };
  }, [user.id, user.role, user.farm_name]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const u = await api.updateMe({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        telegram: form.telegram.trim() || null,
        address: form.address.trim() || null,
        bio: form.bio.trim() || null,
        city: form.city.trim() || undefined,
      });
      updateUser(u);
      toast.success("Профиль сохранён");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const submitApplication = async () => {
    if (checkingApp) return;
    setCheckingApp(true);
    try {
      await api.applyFarmer({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || "+7 700 000 00 00",
        farm_name: form.bio.trim() ? "Моя ферма" : "Хозяйство",
        city: form.city,
        products: "—",
      });
      toast.success("Заявка отправлена на модерацию");
      const a = await api.myApplication();
      setApp(a);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось отправить заявку");
    } finally {
      setCheckingApp(false);
    }
  };

  const nextLevelXp = user.level * 500;
  const progress = Math.min(100, Math.round((user.xp / nextLevelXp) * 100));

  return (
    <Container className="max-w-4xl pb-16 pt-8 sm:pt-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Профиль
      </h1>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[300px_1fr] lg:gap-6">
        {/* Сводка */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-xs">
            <Avatar src={user.avatar_url} name={user.full_name} size="xl" />
            <p className="mt-3 font-semibold text-foreground">{user.full_name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              <Badge variant="primary">
                {user.role === "admin"
                  ? "Администратор"
                  : user.role === "farmer"
                    ? "Фермер"
                    : "Покупатель"}
              </Badge>
              <Badge>С нами с {formatDate(user.created_at).split(" ")[2]}</Badge>
            </div>

            <div className="mt-5 w-full">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Award className="h-3.5 w-3.5 text-amber-500" /> Уровень {user.level}
                </span>
                <span className="text-muted-foreground">{user.xp} XP</span>
              </div>
              <Progress value={progress} className="mt-2" />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                До уровня {user.level + 1}: {Math.max(0, nextLevelXp - user.xp)} XP
              </p>
            </div>

            <Button
              variant="outline"
              className="mt-5 w-full text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => void logout()}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Выйти
            </Button>
          </div>

          {(user.role === "customer" || user.role === "farmer") && !user.farm_name && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Carrot className="h-4 w-4 text-emerald-700 dark:text-emerald-500" /> Статус фермера
              </h3>
              {app === null ? (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Хотите продавать на Ferma.kz? Отправьте заявку — модерация 1–2 дня.
                  </p>
                  <Button
                    className="mt-3 w-full"
                    onClick={submitApplication}
                    isLoading={checkingApp}
                  >
                    Отправить заявку
                  </Button>
                </>
              ) : app.status === "pending" ? (
                <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
                  Заявка на рассмотрении с {formatDate(app.created_at)}
                </p>
              ) : app.status === "approved" ? (
                <p className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-800 dark:text-emerald-300">
                  Заявка одобрена
                </p>
              ) : (
                <p className="mt-2 rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-800 dark:text-rose-300">
                  Заявка отклонена. Можно отправить новую.
                </p>
              )}
            </div>
          )}
        </aside>

        {/* Форма */}
        <form
          onSubmit={submit}
          className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6"
        >
          <Input
            label="Имя и фамилия"
            value={form.full_name}
            onChange={set("full_name")}
            required
            minLength={2}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Телефон"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+7 700 000 00 00"
            />
            <Input
              label="Telegram"
              value={form.telegram}
              onChange={set("telegram")}
              placeholder="@username"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Город" value={form.city} onChange={set("city")} />
            <Input
              label="Адрес (для доставки)"
              value={form.address}
              onChange={set("address")}
              placeholder="улица, дом, кв."
            />
          </div>
          <Textarea
            label="О себе"
            value={form.bio}
            onChange={set("bio")}
            placeholder="Пара слов о вас — увидят фермеры и администраторы"
          />
          <div className="flex justify-end">
            <Button type="submit" leftIcon={<Save className="h-4 w-4" />} isLoading={saving}>
              Сохранить
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
