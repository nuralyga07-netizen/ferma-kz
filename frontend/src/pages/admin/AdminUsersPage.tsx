import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Search, ShieldCheck, Sprout, User as UserIcon, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { api, ApiError } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Role, UserSummary } from "@/types";

const PAGE_SIZE = 25;

const ROLE_LABELS: Record<Role, string> = {
  customer: "Покупатель",
  farmer: "Фермер",
  admin: "Админ",
};

const ROLE_ICONS: Record<Role, ReactNode> = {
  customer: <UserIcon className="h-3.5 w-3.5" />,
  farmer: <Sprout className="h-3.5 w-3.5" />,
  admin: <ShieldCheck className="h-3.5 w-3.5" />,
};

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    (p: number, query: string, r: string) => {
      setLoading(true);
      api
        .listUsers(query, r, PAGE_SIZE, (p - 1) * PAGE_SIZE)
        .then(setUsers)
        .catch((err) =>
          toast.error(err instanceof ApiError ? err.message : "Не удалось загрузить пользователей"),
        )
        .finally(() => setLoading(false));
    },
    [],
  );

  useEffect(() => {
    load(page, q.trim(), role);
  }, [page, q, role, load]);

  const toggleActive = async (u: UserSummary) => {
    setBusyId(u.id);
    try {
      await api.setUserActive(u.id, !u.is_active);
      toast.success(u.is_active ? "Пользователь деактивирован" : "Пользователь активирован");
      load(page, q.trim(), role);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось изменить статус");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Container className="max-w-4xl pb-16 pt-8 sm:pt-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Пользователи
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Поиск, роли, блокировка</p>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <Input
            placeholder="Поиск по имени или email…"
            icon={<Search className="h-4 w-4" />}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["", "customer", "farmer", "admin"].map((r) => (
            <button
              key={r || "all"}
              onClick={() => {
                setRole(r);
                setPage(1);
              }}
              aria-pressed={role === r}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                role === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {r ? ROLE_LABELS[r as Role] : "Все"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-5 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Никого не нашли"
            text="Попробуйте изменить запрос или фильтр"
          />
        </div>
      ) : (
        <div className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 p-4">
              <Avatar name={u.full_name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "truncate font-medium text-foreground",
                      !u.is_active && "text-muted-foreground line-through",
                    )}
                  >
                    {u.full_name}
                  </span>
                  <Badge
                    variant={
                      u.role === "admin" ? "info" : u.role === "farmer" ? "primary" : "default"
                    }
                  >
                    {ROLE_ICONS[u.role]} {ROLE_LABELS[u.role]}
                  </Badge>
                  {!u.is_active && <Badge variant="danger">заблокирован</Badge>}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {u.email} · с {formatDate(u.created_at)}
                </p>
              </div>
              {u.role !== "admin" && (
                <Button
                  variant={u.is_active ? "danger" : "primary"}
                  size="sm"
                  className="shrink-0"
                  isLoading={busyId === u.id}
                  onClick={() => void toggleActive(u)}
                >
                  {u.is_active ? "Блокировать" : "Включить"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && users.length < PAGE_SIZE && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Показано {users.length}
        </p>
      )}
    </Container>
  );
}
