import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Фирменный логотип (public/brand). tone="light" — кремовая версия для тёмного фона:
 * прозрачный хедер поверх видео, тёмные секции. По умолчанию версия следует теме сайта.
 */
export function Logo({
  className,
  to = "/",
  tone = "default",
}: {
  className?: string;
  to?: string;
  tone?: "default" | "light";
}) {
  const light = tone === "light";
  return (
    <Link
      to={to}
      aria-label="Ferma.kz — на главную"
      className={cn("inline-flex shrink-0 items-center transition-opacity hover:opacity-85", className)}
    >
      <LogoImage variant="dark" className={cn("h-9 md:h-11", light ? "hidden" : "dark:hidden")} />
      <LogoImage variant="light" className={cn("h-9 md:h-11", light ? "block" : "hidden dark:block")} />
    </Link>
  );
}

function LogoImage({ variant, className }: { variant: "dark" | "light"; className?: string }) {
  const name = variant === "light" ? "logo-light" : "logo";
  return (
    <img
      src={`/brand/${name}-96.webp`}
      srcSet={`/brand/${name}-96.webp 1x, /brand/${name}-192.webp 2x`}
      alt="Ferma.kz"
      width={328}
      height={96}
      decoding="async"
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}
