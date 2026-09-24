import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useAddToCart } from "@/hooks/useAddToCart";
import type { FarmerDetail } from "@/types";

export function FarmerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { addToCart } = useAddToCart();
  const [farmer, setFarmer] = useState<FarmerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [writeOpen, setWriteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    api
      .getFarmer(id)
      .then((f) => alive && setFarmer(f))
      .catch(() => alive && setFarmer(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <Spinner className="min-h-[50vh]" />;
  if (!farmer) {
    return (
      <Container className="pt-32 text-center">
        <p className="text-lg font-semibold text-foreground">Фермер не найден</p>
        <Link
          to="/farmers"
          className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-500"
        >
          ← К списку фермеров
        </Link>
      </Container>
    );
  }

  const isOwn = user?.id === farmer.id;

  return (
    <div className="pb-16">
      {/* Шапка */}
      <div className="border-b border-border bg-muted/30 dark:bg-muted/20">
        <Container className="flex flex-col items-center gap-5 py-10 text-center sm:flex-row sm:text-left sm:py-12">
          <Avatar
            src={farmer.avatar_url}
            name={farmer.farm_name ?? farmer.full_name}
            size="xl"
            className="h-20 w-20 sm:h-24 sm:w-24"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {farmer.farm_name ?? farmer.full_name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{farmer.full_name}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground sm:justify-start">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {farmer.city}
              </span>
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {farmer.rating ? farmer.rating.toFixed(1) : "Новый"}
                {farmer.review_count ? ` (${farmer.review_count})` : ""}
              </span>
              <span>{farmer.product_count} товаров</span>
              {farmer.phone && (
                <a href={`tel:${farmer.phone}`} className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                  <Phone className="h-4 w-4" /> {farmer.phone}
                </a>
              )}
            </div>
          </div>
          {!isOwn && (
            <Button
              leftIcon={<MessageCircle className="h-4 w-4" />}
              onClick={() => setWriteOpen(true)}
            >
              Написать
            </Button>
          )}
        </Container>
      </div>

      <Container>
        {farmer.bio && (
          <p className="mx-auto mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-left">
            {farmer.bio}
          </p>
        )}

        <h2 className="mb-5 mt-10 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Товары хозяйства
        </h2>
        {farmer.products.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Товары скоро появятся
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {farmer.products.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
            ))}
          </div>
        )}
      </Container>

      {/* Модалка: начать диалог */}
      <Modal open={writeOpen} onClose={() => setWriteOpen(false)} title="Диалог с фермером">
        <p className="text-sm text-muted-foreground">
          Напишите вопрос — {farmer.full_name} ответит в личном чате.
        </p>
        <div className="mt-5 flex gap-2">
          <Button
            className="flex-1"
            onClick={async () => {
              if (!user) {
                window.location.assign("/login");
                return;
              }
              try {
                const conv = await api.startConversation(farmer.id);
                window.location.assign(`/chat/${conv.id}`);
              } catch (e) {
                console.error(e);
                window.location.assign("/login");
              }
            }}
          >
            {user ? "Перейти в чат" : "Войти и написать"}
          </Button>
          <Button variant="outline" onClick={() => setWriteOpen(false)}>
            Отмена
          </Button>
        </div>
      </Modal>
    </div>
  );
}
