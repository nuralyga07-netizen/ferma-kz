import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Gift, Link as LinkIcon, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Referral } from "@/types";

export function ReferralsPage() {
  const [code, setCode] = useState("");
  const [list, setList] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([api.referralCode(), api.myReferrals()])
      .then(([c, r]) => {
        if (!alive) return;
        setCode(c.code);
        setList(r);
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const link = code ? `https://ferma.kz/register?ref=${code}` : "";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Скопировано");
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  return (
    <Container className="max-w-4xl pb-16 pt-8 sm:pt-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Реферальная программа
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Приглашайте друзей — и получайте 100 XP после их первой доставки.
      </p>

      {/* Инвайт */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Gift className="h-5 w-5 text-emerald-700 dark:text-emerald-500" />
          Ваш реферальный код
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="rounded-lg border border-border bg-muted/60 px-4 py-2.5 font-mono text-lg font-bold tracking-wider text-foreground">
            {code || "…"}
          </code>
          <Button
            variant="outline"
            onClick={() => copy(code)}
            leftIcon={<Copy className="h-4 w-4" />}
          >
            Копировать
          </Button>
        </div>
        {link && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Или отправьте ссылку:
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  readOnly
                  value={link}
                  aria-label="Реферальная ссылка"
                  className="h-10 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm text-muted-foreground outline-none"
                />
              </div>
              <Button
                variant="secondary"
                className="shrink-0"
                onClick={() => copy(link)}
                leftIcon={<Copy className="h-4 w-4" />}
              >
                Ссылка
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Приглашённые */}
      <h2 className="mb-4 mt-8 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
        <Users className="h-5 w-5 text-emerald-700 dark:text-emerald-500" />
        Приглашённые
      </h2>
      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Пока никого нет"
          text="Поделитесь кодом — и следите за результатами здесь"
        />
      ) : (
        <div className="space-y-2.5">
          {list.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {r.referred_name ?? "Пользователь"}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-500">
                  +{r.reward_amount} XP
                </span>
                <Badge variant={r.status === "rewarded" ? "success" : "warning"}>
                  {r.status === "rewarded" ? "Начислено" : "Ожидает доставки"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
