import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline"
  | "glass";

const variants: Record<Variant, string> = {
  default: "border-transparent bg-muted text-muted-foreground",
  primary: "border-transparent bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  success: "border-transparent bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  warning: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
  danger: "border-transparent bg-rose-500/12 text-rose-700 dark:text-rose-400",
  info: "border-transparent bg-blue-500/12 text-blue-700 dark:text-blue-400",
  outline: "border bg-background text-foreground",
  glass: "border-white/20 bg-white/10 text-white backdrop-blur-sm",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
