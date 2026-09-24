import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 shadow-xs transition-transform group-hover:scale-105">
        <Leaf className="h-4.5 w-4.5 text-white" strokeWidth={2.2} />
      </span>
      <span className="text-[17px] font-semibold tracking-tight text-foreground">
        Ferma<span className="text-emerald-600 dark:text-emerald-500">.kz</span>
      </span>
    </Link>
  );
}
