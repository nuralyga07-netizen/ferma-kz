import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Clock, MapPin, Phone, Sprout, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/ui/modal";
import { api, ApiError } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import type { FarmerApplication } from "@/types";

const TABS: { value: string; label: string }[] = [
  { value: "pending", label: "Новые" },
  { value: "approved", label: "Одобрены" },
  { value: "rejected", label: "Отклонены" },
  { value: "", label: "Все" },
];

export function AdminApplicationsPage() {
  const [apps, setApps] = useState<FarmerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState<FarmerApplication | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback((s: string) => {
    setLoading(true);
    api
      .listApplications(s)
      .then(setApps)
      .catch((err) =>
        toast.error(err instanceof ApiError ? err.message : "Не удалось загрузить заявки"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(status);
  }, [status, load]);

  const review = async (id: string, r: "approved" | "rejected") => {
    setBusy(true);
    try {
      await api.reviewApplication(id, r);
      toast.success(r === "approved" ? "Заявка одобрена — пользователь стал фермером" : "Заявка отклонена");
      setSelected(null);
      load(status);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось обработать заявку");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-4xl pb-16 pt-8 sm:pt-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Заявки фермеров
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Одобрите заявку — и пользователь сможет добавлять товары
      </p>

      <div className="-mx-4 mt-5 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            aria-pressed={status === t.value}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              status === t.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-foreground hover:bg-accent",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <EmptyState
          icon={<Sprout className="h-6 w-6" />}
          title={status ? "Заявок в этой категории нет" : "Заявок пока нет"}
        />
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="block w-full rounded-xl border border-border bg-card p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-muted-foreground/25 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold text-foreground">{a.farm_name}</span>
                  <Badge
                    variant={
                      a.status === "pending" ? "warning" : a.status === "approved" ? "success" : "danger"
                    }
                  >
                    {a.status === "pending" && <Clock className="h-3 w-3" />}
                    {a.status === "approved" && <Check className="h-3 w-3" />}
                    {a.status === "rejected" && <X className="h-3 w-3" />}
                    {a.status === "pending" ? "новая" : a.status === "approved" ? "одобрена" : "отклонена"}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>{a.full_name}</span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {a.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {a.city}
                </span>
              </div>
              <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Товары:</span> {a.products}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Детали */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Заявка: ${selected.farm_name}` : ""}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoRow label="Имя" value={selected.full_name} />
              <InfoRow label="Email" value={selected.user_email} />
              <InfoRow label="Телефон" value={selected.phone} href={`tel:${selected.phone}`} />
              <InfoRow label="Город" value={selected.city} />
            </div>
            {selected.experience && <InfoRow label="Опыт" value={selected.experience} />}
            <InfoRow label="Что продаёт" value={selected.products} />
            {selected.bio && <InfoRow label="О себе" value={selected.bio} />}

            {selected.status === "pending" && (
              <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
                <Button
                  className="flex-1"
                  leftIcon={<Check className="h-4 w-4" />}
                  isLoading={busy}
                  onClick={() => void review(selected.id, "approved")}
                >
                  Одобрить
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  leftIcon={<X className="h-4 w-4" />}
                  disabled={busy}
                  onClick={() => {
                    if (confirm("Отклонить заявку?")) void review(selected.id, "rejected");
                  }}
                >
                  Отклонить
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Container>
  );
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {href ? (
        <a href={href} className="mt-0.5 block text-sm text-foreground hover:underline">
          {value}
        </a>
      ) : (
        <p className="mt-0.5 text-sm text-foreground">{value}</p>
      )}
    </div>
  );
}
