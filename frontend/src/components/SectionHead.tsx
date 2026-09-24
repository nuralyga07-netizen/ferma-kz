import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function SectionHead({
  title,
  subtitle,
  linkTo,
  linkLabel = "Смотреть все",
  className,
}: {
  title: string;
  subtitle?: string;
  linkTo?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={`mb-6 flex items-end justify-between gap-4 ${className ?? ""}`}>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="group hidden shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
