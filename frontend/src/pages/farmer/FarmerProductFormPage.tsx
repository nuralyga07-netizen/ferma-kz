import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, Leaf, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/skeleton";
import { api, ApiError, type ProductInput } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types";

const UNITS = ["кг", "г", "л", "мл", "шт", "уп", "компл"];

export function FarmerProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    category_id: "",
    name: "",
    description: "",
    price: "",
    old_price: "",
    unit: "кг",
    quantity_available: "",
    images: [] as string[],
    is_featured: false,
    organic: false,
  });

  // Загрузка категорий и товара (в режиме редактирования)
  useEffect(() => {
    api
      .listCategories()
      .then(setCategories)
      .catch(() => undefined);
    if (!id) return;
    let alive = true;
    api
      .getProduct(id)
      .then((p) => {
        if (!alive) return;
        setProduct(p);
        setForm({
          category_id: p.category_id ?? "",
          name: p.name,
          description: p.description ?? "",
          price: String(p.price),
          old_price: p.old_price ? String(p.old_price) : "",
          unit: p.unit,
          quantity_available: String(p.quantity_available),
          images: p.images ?? [],
          is_featured: p.is_featured,
          organic: p.organic,
        });
      })
      .catch((e) => {
        if (alive) setError(e instanceof ApiError ? e.message : "Не удалось загрузить товар");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (form.images.length >= 5) break;
        const res = await api.uploadFile(file);
        set("images", [...form.images, res.url]);
      }
      toast.success("Фото загружено");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async () => {
    const body: ProductInput = {
      category_id: form.category_id || undefined,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      old_price: form.old_price ? Number(form.old_price) : null,
      unit: form.unit,
      quantity_available: Number(form.quantity_available) || 0,
      images: form.images,
      is_featured: form.is_featured,
      organic: form.organic,
    };

    if (body.name.length < 2) return setError("Название — минимум 2 символа");
    if (!body.price || body.price <= 0) return setError("Укажите цену больше нуля");
    if (body.old_price && body.old_price <= body.price)
      return setError("Старая цена должна быть больше текущей");

    setSaving(true);
    setError(null);
    try {
      if (isEdit && id) {
        await api.updateProduct(id, body);
        toast.success("Товар обновлён");
      } else {
        await api.createProduct(body);
        toast.success("Товар добавлен в каталог");
      }
      navigate("/farmer/products");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить товар");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error && isEdit && !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-32 text-center">
        <p className="text-lg font-semibold text-foreground">{error}</p>
        <button
          onClick={() => navigate("/farmer/products")}
          className="mt-3 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-500"
        >
          ← К товарам
        </button>
      </div>
    );
  }

  return (
    <Container className="max-w-3xl pb-16 pt-8 sm:pt-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Назад
      </button>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {isEdit ? "Редактировать товар" : "Новый товар"}
      </h1>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-5 rounded-2xl border border-border bg-card p-5 shadow-xs sm:mt-5 sm:p-6">
        {/* Фото */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Фото (до 5)</p>
          <div className="flex flex-wrap gap-2">
            {form.images.map((url, i) => (
              <div key={`${url}-${i}`} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-border">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 rounded-lg bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Удалить фото"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    обложка
                  </span>
                )}
              </div>
            ))}
            {form.images.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-emerald-400 hover:text-emerald-500"
              >
                {uploading ? <Spinner className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
                <span className="text-[11px]">Добавить</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void uploadFiles(e.target.files)}
          />
        </div>

        <Input
          label="Название *"
          placeholder="Например: Говядина мраморная, отруби"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />

        <Textarea
          label="Описание"
          placeholder="Откуда продукт, как выращен, сроки хранения…"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Цена, ₸ *"
            type="number"
            min={1}
            placeholder="1500"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
          />
          <Input
            label="Старая цена, ₸"
            type="number"
            min={1}
            placeholder="2000"
            value={form.old_price}
            onChange={(e) => set("old_price", e.target.value)}
            hint="для скидки"
          />
          <Input
            label="Остаток, шт *"
            type="number"
            min={0}
            placeholder="20"
            value={form.quantity_available}
            onChange={(e) => set("quantity_available", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Категория</label>
            <select
              value={form.category_id}
              onChange={(e) => set("category_id", e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3.5 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <option value="">Без категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Единица</label>
            <div className="flex flex-wrap gap-1.5">
              {UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => set("unit", u)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    form.unit === u
                      ? "border-emerald-600/40 bg-emerald-500/5 text-emerald-800 ring-1 ring-emerald-600/20 dark:text-emerald-300"
                      : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => set("is_featured", !form.is_featured)}
            aria-pressed={form.is_featured}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              form.is_featured
                ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Star className="h-4 w-4" /> В подборке недели
          </button>
          <button
            type="button"
            onClick={() => set("organic", !form.organic)}
            aria-pressed={form.organic}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              form.organic
                ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Leaf className="h-4 w-4" /> Органическое
          </button>
        </div>

        {product && !product.is_active && (
          <Badge variant="danger">
            Товар скрыт — после сохранения он снова появится в каталоге
          </Badge>
        )}

        <div className="border-t border-border pt-5">
          <Button
            className="w-full sm:w-auto"
            size="lg"
            isLoading={saving}
            onClick={() => void submit()}
          >
            {isEdit ? "Сохранить изменения" : "Опубликовать товар"}
          </Button>
        </div>
      </div>
    </Container>
  );
}
