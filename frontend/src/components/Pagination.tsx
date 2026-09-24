import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;

  const nums: number[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  }
  const withDots: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) withDots.push("…");
    withDots.push(n);
  });

  const base =
    "flex h-9 min-w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Пагинация">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={cn(base, "border border-border bg-background text-foreground hover:bg-accent")}
        aria-label="Назад"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {withDots.map((n, i) =>
        n === "…" ? (
          <span key={`d${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn(
              base,
              n === page
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-foreground hover:bg-accent",
            )}
          >
            {n}
          </button>
        ),
      )}
      <button
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className={cn(base, "border border-border bg-background text-foreground hover:bg-accent")}
        aria-label="Вперёд"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
