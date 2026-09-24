import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { timeAgo, cn } from "@/lib/utils";
import type { Conversation } from "@/types";

export function ChatPage() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { tick, connected } = useWebSocket();

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    api
      .listConversations()
      .then(setConvs)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, tick]);

  return (
    <Container className="max-w-3xl pb-16 pt-8 sm:pt-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Сообщения
        </h1>
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            connected ? "text-emerald-700 dark:text-emerald-500" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              connected ? "bg-emerald-500" : "bg-muted-foreground/40",
            )}
          />
          {connected ? "онлайн" : "офлайн"}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          ))}
        </div>
      ) : convs.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-6 w-6" />}
          title="Диалогов пока нет"
          text="Напишите фермеру со страницы его профиля — вопрос по товару, срокам или доставке"
          action={
            <Link to="/farmers">
              <Button variant="outline">К фермерам</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {convs.map((c) => (
            <li key={c.id}>
              <Link
                to={`/chat/${c.id}`}
                className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-muted-foreground/25 hover:shadow-md"
              >
                <Avatar src={c.other_avatar} name={c.other_name} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {c.other_name}
                    </p>
                    {c.last_message_at && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(c.last_message_at)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm",
                        c.unread_count > 0
                          ? "font-medium text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {c.product_name && (
                        <span className="text-emerald-700 dark:text-emerald-500">
                          {c.product_name} ·{" "}
                        </span>
                      )}
                      {c.last_message || "Нет сообщений"}
                    </p>
                    {c.unread_count > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                        {c.unread_count > 99 ? "99+" : c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
