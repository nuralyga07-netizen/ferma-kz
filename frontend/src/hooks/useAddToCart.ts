import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/types";

/**
 * Добавление в корзину:
 * - гость → локальная корзина (persist)
 * - авторизованный → API (DB — источник правды)
 */
export function useAddToCart() {
  const user = useAuthStore((s) => s.user);
  const setLocalItem = useCartStore((s) => s.setLocalItem);
  const addRemote = useCartStore((s) => s.addRemote);

  const addToCart = (product: Product, quantity = 1) => {
    if (product.quantity_available <= 0) {
      toast.error("Товара нет в наличии");
      return;
    }
    if (user) {
      addRemote(product.id, quantity)
        .then(() => toast.success(`${product.name} — в корзине`))
        .catch((err) =>
          toast.error(err instanceof ApiError ? err.message : "Не удалось добавить"),
        );
    } else {
      setLocalItem(product, quantity);
      toast.success(`${product.name} — в корзине`);
    }
  };

  const setQuantity = (product: Product, quantity: number) => {
    if (user) {
      void useCartStore
        .getState()
        .setRemoteQuantity(product.id, quantity)
        .catch(() => toast.error("Не удалось обновить корзину"));
    } else {
      useCartStore.getState().setLocalQuantity(product.id, quantity);
    }
  };

  const removeFromCart = (productId: string) => {
    if (user) {
      void useCartStore
        .getState()
        .removeRemote(productId)
        .catch(() => toast.error("Не удалось обновить корзину"));
    } else {
      useCartStore.getState().removeLocalItem(productId);
    }
  };

  return { addToCart, setQuantity, removeFromCart };
}
