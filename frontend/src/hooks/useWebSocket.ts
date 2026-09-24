import { useEffect, useRef, useState } from "react";
import { getAccessToken } from "@/lib/api";

export interface WSEvent {
  type: "message" | "read" | string;
  data: any;
}

type Listener = (event: WSEvent) => void;

/**
 * Глобальное WS-соединение на пользователя (одна вкладка — один сокет).
 * Подключение: /ws?token=<access JWT> (dev-прокси / production — nginx).
 * Автопереподключение с экспоненциальным backoff.
 */
let socket: WebSocket | null = null;
let listeners = new Set<Listener>();
let reconnectDelay = 1000;

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }
  const token = getAccessToken();
  if (!token) return;

  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${window.location.host}/ws?token=${encodeURIComponent(token)}`);
  socket = ws;

  ws.onopen = () => {
    reconnectDelay = 1000;
  };

  ws.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data) as WSEvent;
      listeners.forEach((fn) => fn(event));
    } catch {
      /* некорректное сообщение — игнорируем */
    }
  };

  ws.onclose = () => {
    if (socket !== ws) return; // уже заменили
    socket = null;
    const delay = Math.min(reconnectDelay, 15000);
    reconnectDelay = Math.min(reconnectDelay * 1.7, 15000);
    setTimeout(connect, delay);
  };

  ws.onerror = () => {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  };
}

/**
 * Хук: подписка на WS-события чата.
 * Возвращает «тик» — растёт при каждом событии, чтобы страницы могли обновлять списки.
 */
export function useWebSocket(convId?: string) {
  const [tick, setTick] = useState(0);
  const [connected, setConnected] = useState(false);
  const convRef = useRef(convId);
  convRef.current = convId;

  useEffect(() => {
    const listener = (event: WSEvent) => {
      // В диалоге — фильтруем по нему; в списке — реагируем на любое
      if (convRef.current) {
        if (event.type === "message" && event.data?.conversation_id !== convRef.current) return;
        if (event.type === "read" && event.data?.conversation_id !== convRef.current) return;
      }
      setTick((t) => t + 1);
    };

    listeners.add(listener);
    connect();

    return () => {
      listeners.delete(listener);
    };
  }, []);

  // обновляем индикатор подключения при реальном состоянии сокета
  useEffect(() => {
    const check = () => setConnected(socket?.readyState === WebSocket.OPEN);
    const iv = setInterval(check, 3000);
    check();
    return () => clearInterval(iv);
  }, [tick]);

  return { tick, connected };
}

/** Последнее событие (message / read) для конкретного диалога. */
export function useChatEvent(convId: string | undefined): { last: WSEvent | null } {
  const [last, setLast] = useState<WSEvent | null>(null);

  useEffect(() => {
    if (!convId) return;
    const listener = (event: WSEvent) => {
      if (event.data?.conversation_id === convId) {
        setLast(event);
      }
    };
    listeners.add(listener);
    connect();
    return () => {
      listeners.delete(listener);
    };
  }, [convId]);

  return { last };
}
