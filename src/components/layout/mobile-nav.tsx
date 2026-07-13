"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Grid3X3, MessageCircle, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

const NAV_ITEMS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/catalog", label: "Каталог", icon: Grid3X3 },
  { href: "/chat", label: "Чат", icon: MessageCircle },
  { href: "/cart", label: "Корзина", icon: ShoppingCart },
  { href: "/profile", label: "Профиль", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Don't show on pages where mobile nav would conflict
  const hiddenPaths = ["/login", "/register", "/forgot-password"];
  if (hiddenPaths.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="glass border-t border-border/50">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-emerald-500"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {/* Cart badge */}
                  {item.href === "/cart" && cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full gradient-primary text-white text-[9px] font-bold flex items-center justify-center"
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </motion.span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-emerald-500"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
