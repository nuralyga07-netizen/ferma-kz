import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, getAccessToken, setAccessToken, setOnUserUpdated } from "@/lib/api";
import { useCartStore } from "./cart";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  initialized: boolean;
  setSession: (user: User, accessToken: string) => void;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      initialized: false,

      setSession: (user, accessToken) => {
        setAccessToken(accessToken);
        set({ user, accessToken, initialized: true });
      },

      updateUser: (user) => set({ user }),

      logout: async () => {
        try {
          await api.logout();
        } catch {
          /* даже если запрос не прошёл — сессию сбрасываем */
        }
        setAccessToken(null);
        set({ user: null, accessToken: null });
        useCartStore.getState().clearLocal();
      },

      init: async () => {
        if (get().initialized) return;
        const token = getAccessToken();
        if (!token) {
          set({ initialized: true });
          return;
        }
        try {
          const user = await api.me();
          set({ user, initialized: true });
        } catch {
          setAccessToken(null);
          set({ user: null, accessToken: null, initialized: true });
        }
      },
    }),
    {
      name: "ferma-auth",
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
    },
  ),
);

// Подключаем колбэк обновления пользователя (после silent-refresh)
setOnUserUpdated((u) => {
  const cur = useAuthStore.getState();
  if (cur.user && cur.user.id === u.id) cur.updateUser(u);
});

export function useIsFarmer() {
  return useAuthStore((s) => s.user?.role === "farmer");
}
export function useIsAdmin() {
  return useAuthStore((s) => s.user?.role === "admin");
}
