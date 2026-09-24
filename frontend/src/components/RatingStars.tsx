import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  count,
  size = 16,
  interactive = false,
  onChange,
}: {
  value: number;
  count?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i)}
            aria-label={`Оценка ${i}`}
            className={cn(!interactive && "cursor-default", interactive && "transition-transform hover:scale-110")}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className="text-sm font-semibold text-foreground">{value.toFixed(1)}</span>
      )}
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">
          ({count} {plural(count, ["отзыв", "отзыва", "отзывов"])})
        </span>
      )}
    </div>
  );
}

export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (d > 1 && d < 5) return forms[1];
  if (d === 1) return forms[0];
  return forms[2];
}
