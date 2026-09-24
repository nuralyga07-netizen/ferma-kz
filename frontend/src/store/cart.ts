import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";
import type { Cart, CartItem, Product } from "@/types";
import { useAuthStore } from "./auth";

interface CartState {
  /** Локальная (гостевая) корзина — синхронизируется с API при login. */
  local: Record<string, { quantity: number; product: Product }>;
  remote: Cart | null;
  setLocalItem: (product: Product, quantity: number) => void;
  setLocalQuantity: (productId: string, quantity: number) => void;
  removeLocalItem: (productId: string) => void;
  clearLocal: () => void;
  /** Загрузить корзину из API (после login / изменения). */
  fetchRemote: () => Promise<void>;
  addRemote: (productId: string, quantity: number) => Promise<void>;
  setRemoteQuantity: (productId: string, quantity: number) => Promise<void>;
  removeRemote: (productId: string) => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      local: {},
      remote: null,

      setLocalItem: (product, quantity) =>
        set((s) => ({ local: { ...s.local, [product.id]: { quantity, product } } })),

      setLocalQuantity: (productId, quantity) =>
        set((s) => {
          const cur = s.local[productId];
          if (!cur) return s;
          if (quantity <= 0) {
            const next = { ...s.local };
            delete next[productId];
            return { local: next };
          }
          return { local: { ...s.local, [productId]: { ...cur, quantity } } };
        }),

      removeLocalItem: (productId) =>
        set((s) => {
          const next = { ...s.local };
          delete next[productId];
          return { local: next };
        }),

      clearLocal: () => set({ local: {}, remote: null }),

      fetchRemote: async () => {
        try {
          const cart = await api.getCart();
          set({ remote: cart });
        } catch {
          /* не критично */
        }
      },

      addRemote: async (productId, quantity) => {
        const cart = await api.addToCart(productId, quantity);
        set({ remote: cart });
      },

      setRemoteQuantity: async (productId, quantity) => {
        const cart = await api.setCartQuantity(productId, quantity);
        set({ remote: cart });
      },

      removeRemote: async (productId) => {
        const cart = await api.removeFromCart(productId);
        set({ remote: cart });
      },
    }),
    { name: "ferma-cart" },
  ),
);

/** Актуальные позиции корзины (с учётом того, авторизован ли пользователь). */
export function useCartItems(): CartItem[] {
  const authed = useAuthStore((s) => !!s.user);
  const local = useCartStore((s) => s.local);
  const remote = useCartStore((s) => s.remote);
  if (authed) {
    return remote?.items ?? [];
  }
  return Object.values(local).map(
    (v): CartItem => ({
      id: v.product.id,
      product: v.product,
      quantity: v.quantity,
      total: v.quantity * v.product.price,
      created_at: new Date().toISOString(),
    }),
  );
}

export function useCartCount(): number {
  const items = useCartItems();
  return items.reduce((acc, i) => acc + i.quantity, 0);
}

export function useCartSubtotal(): number {
  const items = useCartItems();
  return items.reduce((acc, i) => acc + i.total, 0);
}
