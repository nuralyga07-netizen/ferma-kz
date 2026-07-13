"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Store,
  Package,
  Percent,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
  Sprout,
  ChevronDown,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const navItems: NavItem[] = [
  { label: "Дашборд", href: "/admin", icon: LayoutDashboard },
  { label: "Пользователи", href: "/admin/users", icon: Users, badge: "24" },
  { label: "Заказы", href: "/admin/orders", icon: ShoppingCart, badge: "156" },
  { label: "Фермеры", href: "/admin/farmers", icon: Store, badge: "8" },
  { label: "Товары", href: "/admin/products", icon: Package },
  { label: "Акции", href: "/admin/promotions", icon: Percent },
  { label: "Настройки", href: "/admin/settings", icon: Settings },
];

const sidebarVariants = {
  open: { width: 260, transition: { duration: 0.3, ease: "easeInOut" as const } },
  closed: { width: 72, transition: { duration: 0.3, ease: "easeInOut" as const } },
};

const mobileOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const mobileSidebarVariants = {
  hidden: { x: -300 },
  visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
};

function SidebarContent({
  collapsed,
  onNavClick,
}: {
  collapsed: boolean;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-20 shrink-0 border-b border-emerald-500/10">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <Sprout className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden"
          >
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              Ferma.kz
            </span>
            <span className="block text-[11px] text-muted-foreground whitespace-nowrap">
              Админ-панель
            </span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-emerald-500/5"
              }`}
            >
              <div
                className={`w-5 h-5 shrink-0 flex items-center justify-center ${
                  isActive ? "text-emerald-500" : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
              </div>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[15px]"
                >
                  {item.label}
                </motion.span>
              )}
              {item.badge && (
                <span
                  className={`ml-auto flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  } ${collapsed ? "absolute -top-0.5 -right-0.5" : ""}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-emerald-500/10">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-emerald-500/5 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
            Н
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-foreground truncate">Нуралы</div>
              <div className="text-[12px] text-muted-foreground truncate">Основатель</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 to-amber-50/30 dark:from-[#030712] dark:to-[#0f172a]">
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={sidebarCollapsed ? "closed" : "open"}
        variants={sidebarVariants}
        className="hidden lg:flex fixed left-0 top-0 h-full z-30 flex-col glass-card rounded-none border-r border-emerald-500/10"
      >
        <SidebarContent collapsed={sidebarCollapsed} />

        {/* Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full glass-card flex items-center justify-center hover:scale-110 transition-transform z-10"
        >
          <ChevronLeft
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${
              sidebarCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={mobileOverlayVariants}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={mobileSidebarVariants}
            className="fixed left-0 top-0 h-full w-[260px] z-50 lg:hidden glass-card rounded-none border-r border-emerald-500/10"
          >
            <SidebarContent collapsed={false} onNavClick={() => setMobileOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"}`}>
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-20 lg:hidden glass-card rounded-none border-b border-emerald-500/10">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={() => setMobileOpen(true)}
              className="w-10 h-10 rounded-xl hover:bg-emerald-500/10 flex items-center justify-center transition-colors"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-500" />
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                Ferma.kz
              </span>
            </div>
            <button className="w-10 h-10 rounded-xl hover:bg-red-500/10 flex items-center justify-center transition-colors">
              <LogOut className="w-5 h-5 text-muted-foreground hover:text-red-500 transition-colors" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
