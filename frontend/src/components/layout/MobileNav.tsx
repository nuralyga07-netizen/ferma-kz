import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, MessageCircle, ShoppingBag, User } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useCartCount } from "@/store/cart";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartCount();

  const items = [
    {
      to: "/",
      icon: Home,
      label: "Главная",
      match: (p: string) => p === "/",
      hide: false,
    },
    {
      to: "/catalog",
      icon: LayoutGrid,
      label: "Каталог",
      match: (p: string) => p.startsWith("/catalog") || p.startsWith("/product"),
      hide: false,
    },
    {
      to: "/cart",
      icon: ShoppingBag,
      label: "Корзина",
      badge: cartCount,
      match: (p: string) => p.startsWith("/cart") || p.startsWith("/checkout"),
      hide: !user || user.role !== "customer",
    },
    {
      to: "/chat",
      icon: MessageCircle,
      label: "Чат",
      match: (p: string) => p.startsWith("/chat"),
      hide: !user,
    },
    {
      to: user
        ? user.role === "admin"
          ? "/admin"
          : user.role === "farmer"
            ? "/farmer"
            : "/account/orders"
        : "/login",
      icon: User,
      label: user ? "Кабинет" : "Войти",
      match: (p: string) =>
        p.startsWith("/account") || p.startsWith("/farmer") || p.startsWith("/admin"),
      hide: false,
    },
  ].filter((i) => !i.hide);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Мобильная нижняя навигация"
    >
      <div className="grid auto-cols-fr grid-flow-col">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                {"badge" in item && (item.badge ?? 0) > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold leading-none text-white">
                    {item.badge}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
