import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function NotFoundPage() {
  return (
    <Container className="flex min-h-[calc(100dvh-4rem)] items-center justify-center py-16">
      <div className="text-center">
        <p className="text-7xl font-bold tracking-tight text-muted-foreground/20 sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Страница не найдена
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Возможно, товар убрали с продажи, или вы опечатались в адресе.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button size="lg">На главную</Button>
        </Link>
      </div>
    </Container>
  );
}
