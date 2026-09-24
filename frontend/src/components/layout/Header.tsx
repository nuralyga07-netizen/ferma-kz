import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Moon,
  Package,
  Settings,
  ShoppingBag,
  Sun,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/Logo";
import { useAuthStore } from "@/store/auth";
import { useCartCount } from "@/store/cart";
import { useThemeStore } from "@/store/theme";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Главная", match: (p: string) => p === "/" },
  { to: "/catalog", label: "Каталог", match: (p: string) => p.startsWith("/catalog") || p.startsWith("/product") },
  { to: "/farmers", label: "Фермеры", match: (p: string) => p.startsWith("/farmers") },
  { to: "/about", label: "О нас", match: (p: string) => p.startsWith("/about") || p.startsWith("/terms") },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const cartCount = useCartCount();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  const dashboardPath =
    user?.role === "admin" ? "/admin" : user?.role === "farmer" ? "/farmer" : "/account/orders";
  const showCart = !user || user.role === "customer";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* Десктоп-навигация */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Основная навигация">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                item.match(pathname)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Действия */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          {showCart && (
            <button
              onClick={() => navigate("/cart")}
              aria-label={`Корзина, ${cartCount} товаров`}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold leading-none text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          )}

          {user && (
            <Link
              to="/chat"
              aria-label="Сообщения"
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Меню профиля" className="ml-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar src={user.avatar_url} name={user.full_name} size="md" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex flex-col items-start gap-0.5 font-normal">
                  <span className="text-sm font-semibold text-foreground">{user.full_name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                  <User className="h-4 w-4" />
                  Личный кабинет
                </DropdownMenuItem>
                {user.role === "farmer" && (
                  <DropdownMenuItem onClick={() => navigate("/farmer/products")}>
                    <Package className="h-4 w-4" />
                    Мои товары
                  </DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <LayoutDashboard className="h-4 w-4" />
                    Админ-панель
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/account/profile")}>
                  <Settings className="h-4 w-4" />
                  Настройки
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    void logout();
                    navigate("/");
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 pl-1.5 sm:flex">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Войти
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Регистрация
              </Button>
            </div>
          )}

          {/* Бургер */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent md:hidden"
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </Container>

      {/* Мобильное меню */}
      {mobileOpen && (
        <nav
          className="border-t border-border bg-background md:hidden"
          aria-label="Мобильная навигация"
        >
          <Container className="flex flex-col gap-1 py-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  item.match(pathname)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
            {user?.role !== "admin" && user?.role !== "farmer" && (
              <Link
                to="/cart"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                Корзина {cartCount > 0 && <span className="text-foreground">({cartCount})</span>}
              </Link>
            )}
            <div className="mt-2 border-t border-border pt-3">
              {user ? (
                <>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
                  >
                    Личный кабинет
                  </Link>
                  <button
                    onClick={() => {
                      void logout();
                      navigate("/");
                    }}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-muted/60"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-3 pb-1">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/login");
                    }}
                  >
                    Войти
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/register");
                    }}
                  >
                    Регистрация
                  </Button>
                </div>
              )}
            </div>
          </Container>
        </nav>
      )}
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
