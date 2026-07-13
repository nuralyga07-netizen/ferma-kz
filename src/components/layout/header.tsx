"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme-provider";
import { Menu, X, ShoppingCart, User, Sun, Moon, Search } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

const navLinks = [
  { href: "/catalog", label: "Каталог" },
  { href: "/#how-it-works", label: "Как это работает" },
  { href: "/farmer/apply", label: "Стать фермером" },
  { href: "/#faq", label: "FAQ" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass shadow-lg shadow-black/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">
              Ferma<span className="text-emerald-500">.kz</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <Link
              href="/cart"
              className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full gradient-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              <User className="w-4 h-4" />
              Войти
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="glass px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-500/10 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-500 text-white text-center"
              >
                Войти
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
