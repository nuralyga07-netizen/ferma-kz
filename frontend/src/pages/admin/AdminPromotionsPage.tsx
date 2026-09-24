import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgePercent, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/ui/modal";
import { api, ApiError } from "@/lib/api";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { Promotion } from "@/types";

interface PromoForm {
  code: string;
  description: string;
  discount_percent: string;
  min_amount: string;
  max_uses: string;
  expires_at: string;
  is_active: boolean;
}

const emptyForm: PromoForm = {
  code: "",
  description: "",
  discount_percent: "10",
  min_amount: "0",
  max_uses: "100",
  expires_at: "",
  is_active: true,
};

export function AdminPromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listPromotions()
      .then(setPromos)
      .catch((err) =>
        toast.error(err instanceof ApiError ? err.message : "Не удалось загрузить промокоды"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setCreating(true);
  };

  const openEdit = (p: Promotion) => {
    setForm({
      code: p.code,
      description: p.description ?? "",
      discount_percent: String(p.discount_percent),
      min_amount: String(p.min_amount),
      max_uses: String(p.max_uses),
      expires_at: p.expires_at ? p.expires_at.slice(0, 10) : "",
      is_active: p.is_active,
    });
    setFormError(null);
    setEditing(p);
  };

  const set = <K extends keyof PromoForm>(k: K, v: PromoForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const body = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      discount_percent: Number(form.discount_percent),
      min_amount: Number(form.min_amount) || 0,
      max_uses: Number(form.max_uses) || 0,
      expires_at: form.expires_at ? new Date(`${form.expires_at}T23:59:59`).toISOString() : undefined,
      is_active: form.is_active,
    };

    if (body.code.length < 3) return setFormError("Код — минимум 3 символа");
    if (!body.discount_percent || body.discount_percent <= 0 || body.discount_percent > 100)
      return setFormError("Скидка — от 1 до 100%");

    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.updatePromotion(editing.id, body);
        toast.success("Промокод обновлён");
      } else {
        await api.createPromotion(body);
        toast.success("Промокод создан");
      }
      setCreating(false);
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Promotion) => {
    if (!confirm(`Удалить промокод ${p.code}?`)) return;
    setBusyId(p.id);
    try {
      await api.deletePromotion(p.id);
      toast.success("Промокод удалён");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось удалить");
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (p: Promotion) => {
    setBusyId(p.id);
    try {
      await api.updatePromotion(p.id, {
        code: p.code,
        description: p.description ?? undefined,
        discount_percent: p.discount_percent,
        min_amount: p.min_amount,
        max_uses: p.max_uses,
        expires_at: p.expires_at ?? undefined,
        is_active: !p.is_active,
      });
      toast.success(p.is_active ? "Промокод отключён" : "Промокод включён");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось обновить");
    } finally {
      setBusyId(null);
    }
  };

  const modalOpen = creating || !!editing;

  return (
    <Container className="max-w-4xl pb-16 pt-8 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Промокоды</h1>
          <p className="mt-1 text-sm text-muted-foreground">Скидки при оформлении заказа</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Новый промокод
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : promos.length === 0 ? (
        <EmptyState
          icon={<BadgePercent className="h-6 w-6" />}
          title="Промокодов пока нет"
          text="Создайте первый — покупатели введут код при оформлении"
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Создать
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          {promos.map((p) => {
            const expired = p.expires_at && new Date(p.expires_at) < new Date();
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-emerald-800 dark:text-emerald-400">
                      {p.code}
                    </span>
                    <Badge variant="success">−{p.discount_percent}%</Badge>
                    {p.min_amount > 0 && (
                      <Badge>от {formatPrice(p.min_amount)}</Badge>
                    )}
                    {!p.is_active && <Badge variant="danger">выключен</Badge>}
                    {expired && p.is_active && <Badge variant="warning">истёк</Badge>}
                  </div>
                  {p.description && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{p.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    использований: {p.current_uses} из {p.max_uses || "∞"}
                    {p.expires_at && ` · до ${formatDate(p.expires_at)}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => openEdit(p)}
                  >
                    Изменить
                  </Button>
                  <Button
                    variant={p.is_active ? "outline" : "primary"}
                    size="sm"
                    isLoading={busyId === p.id}
                    onClick={() => void toggleActive(p)}
                  >
                    {p.is_active ? "Выключить" : "Включить"}
                  </Button>
                  <Button
                    variant="danger"
                    size="icon"
                    isLoading={busyId === p.id}
                    onClick={() => void remove(p)}
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модалка создания/редактирования */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? `Промокод ${editing.code}` : "Новый промокод"}
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
              {formError}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Код *"
              placeholder="FARMA10"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              className="font-mono uppercase"
            />
            <Input
              label="Скидка, % *"
              type="number"
              min={1}
              max={100}
              value={form.discount_percent}
              onChange={(e) => set("discount_percent", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Мин. сумма заказа, ₸"
              type="number"
              min={0}
              value={form.min_amount}
              onChange={(e) => set("min_amount", e.target.value)}
              hint="0 — без ограничения"
            />
            <Input
              label="Лимит использований"
              type="number"
              min={0}
              value={form.max_uses}
              onChange={(e) => set("max_uses", e.target.value)}
              hint="0 — без лимита"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Действует до"
              type="date"
              value={form.expires_at}
              onChange={(e) => set("expires_at", e.target.value)}
            />
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">Статус</p>
              <button
                type="button"
                onClick={() => set("is_active", !form.is_active)}
                className={cn(
                  "flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-sm font-medium transition-colors",
                  form.is_active
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                {form.is_active ? "Активен" : "Выключен"}
                <span
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    form.is_active ? "bg-emerald-500" : "bg-muted-foreground/30",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                      form.is_active ? "left-[18px]" : "left-0.5",
                    )}
                  />
                </span>
              </button>
            </div>
          </div>

          <Input
            label="Описание"
            placeholder="Например: Скидка к дню города"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />

          <Button className="w-full" size="lg" isLoading={saving} onClick={() => void save()}>
            {editing ? "Сохранить" : "Создать промокод"}
          </Button>
        </div>
      </Modal>
    </Container>
  );
}
