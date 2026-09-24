import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useChatEvent, useWebSocket } from "@/hooks/useWebSocket";
import { formatPrice, cn } from "@/lib/utils";
import type { Conversation, Message, Product } from "@/types";

const PAGE_SIZE = 30;

export function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [conv, setConv] = useState<Conversation | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOld, setLoadingOld] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { tick } = useWebSocket(id);
  const { last: wsEvent } = useChatEvent(id);

  const isMine = useCallback((m: Message) => m.sender_id === user?.id, [user?.id]);

  const loadConv = useCallback(async () => {
    if (!id) return;
    const list = await api.listConversations();
    const c = list.find((x) => x.id === id) ?? null;
    setConv(c);
    if (c?.product_id) {
      api
        .getProduct(c.product_id)
        .then(setProduct)
        .catch(() => setProduct(null));
    }
  }, [id]);

  // Первичная загрузка диалога и сообщений
  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        await loadConv();
        const list = await api.listMessages(id, PAGE_SIZE);
        if (!alive) return;
        setMessages([...list].reverse()); // API отдаёт новые сверху → показываем старые сверху
        setHasMore(list.length === PAGE_SIZE);
      } catch {
        if (alive) setConv(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, loadConv]);

  // Пометить прочитанным при открытии/при новых входящих
  useEffect(() => {
    if (!id || !conv?.other_id || !user) return;
    const hasUnread = messages.some((m) => !isMine(m) && !m.is_read);
    if (hasUnread) {
      api
        .markRead(id, conv.other_id)
        .then(() => setMessages((prev) => prev.map((m) => (isMine(m) ? m : { ...m, is_read: true }))))
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, conv?.other_id, messages.length, tick]);

  // События по WS: новое сообщение / собеседник прочитал
  useEffect(() => {
    if (!wsEvent) return;
    if (wsEvent.type === "message") {
      const m = wsEvent.data as Message;
      setMessages((prev) => {
        if (prev.some((x) => x.id === m.id)) return prev;
        return [...prev, m];
      });
    } else if (wsEvent.type === "read") {
      // собеседник прочитал — все наши сообщения теперь прочитаны
      setMessages((prev) => prev.map((m) => (isMine(m) ? { ...m, is_read: true } : m)));
    }
  }, [wsEvent, isMine]);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length, scrollToBottom]);

  const prevHeightRef = useRef(0);

  const loadOlder = useCallback(async () => {
    if (!id || messages.length === 0 || loadingOld) return;
    setLoadingOld(true);
    const el = listRef.current;
    prevHeightRef.current = el ? el.scrollHeight : 0;
    try {
      const oldest = messages[0];
      const older = await api.listMessages(id, PAGE_SIZE, oldest.created_at);
      setMessages((prev) => [...older.slice().reverse(), ...prev]);
      setHasMore(older.length === PAGE_SIZE);
    } catch {
      /* ignore */
    } finally {
      setLoadingOld(false);
    }
  }, [id, messages, loadingOld]);

  // После подгрузки старых — сохраняем позицию прокрутки
  useEffect(() => {
    const el = listRef.current;
    if (el && prevHeightRef.current > 0) {
      el.scrollTop = el.scrollHeight - prevHeightRef.current;
      prevHeightRef.current = 0;
    }
  }, [messages.length]);

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !id || sending) return;
    setSending(true);
    try {
      const m = await api.sendMessage(id, trimmed);
      setMessages((prev) => [...prev, { ...m, sender_name: user?.full_name }]);
      setText("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  }, [text, id, sending, user?.full_name]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!conv) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-32 text-center">
        <p className="text-lg font-semibold text-foreground">Диалог не найден</p>
        <Link
          to="/chat"
          className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-500"
        >
          ← К сообщениям
        </Link>
      </div>
    );
  }

  const grouped = useMemo(() => {
    const out: { key: string; messages: Message[] }[] = [];
    for (const m of messages) {
      const day = new Date(m.created_at).toLocaleDateString("ru-RU");
      const last = out[out.length - 1];
      if (last && last.key === day) last.messages.push(m);
      else out.push({ key: day, messages: [m] });
    }
    return out;
  }, [messages]);

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-3xl flex-col sm:px-6 sm:pt-20 md:h-[calc(100dvh-4rem)]">
      {/* Шапка */}
      <div className="flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => navigate("/chat")}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar src={conv.other_avatar} name={conv.other_name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{conv.other_name}</p>
          {product && (
            <Link
              to={`/product/${product.id}`}
              className="block truncate text-xs text-emerald-700 hover:underline dark:text-emerald-500"
            >
              {product.name} · {formatPrice(product.price)}/{product.unit}
            </Link>
          )}
        </div>
      </div>

      {/* Лента */}
      <div ref={listRef} className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {hasMore && (
          <div className="mb-3 flex justify-center">
            <Button variant="secondary" size="sm" isLoading={loadingOld} onClick={loadOlder}>
              Загрузить ранние
            </Button>
          </div>
        )}

        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Сообщений пока нет — напишите первым 👋
          </p>
        )}

        {grouped.map((g) => (
          <div key={g.key}>
            <div className="my-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{g.key}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            {g.messages.map((m) => {
              const mine = isMine(m);
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-xs sm:max-w-[80%]",
                      mine
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border bg-card text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p
                      className={cn(
                        "mt-1 text-right text-[10px] leading-none",
                        mine ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Ввод */}
      <div className="border-t border-border bg-background/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder="Написать сообщение…"
            aria-label="Сообщение"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground shadow-xs outline-none transition-all placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <Button
            size="icon"
            isLoading={sending}
            disabled={!text.trim()}
            onClick={() => void send()}
            aria-label="Отправить"
          >
            {!sending && <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
          Enter — отправить, Shift+Enter — новая строка
        </p>
      </div>
    </div>
  );
}
