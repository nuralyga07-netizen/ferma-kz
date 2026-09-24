import type {
  AdminStats,
  AuthResponse,
  Cart,
  Category,
  Conversation,
  Envelope,
  Farmer,
  FarmerApplication,
  FarmerDetail,
  Message,
  Order,
  Product,
  ProductFilters,
  ProductPage,
  Promotion,
  Referral,
  Review,
  User,
  UserSummary,
} from "@/types";

const BASE = "/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

let refreshing: Promise<boolean> | null = null;

/** POST /auth/refresh по cookie; обновляет access-токен. */
async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) return false;
        const body = (await res.json()) as Envelope<AuthResponse>;
        if (!body.success || !body.data) return false;
        accessToken = body.data.access_token;
        onUserUpdated?.(body.data.user);
        return true;
      } catch {
        return false;
      } finally {
        // сбрасываем после завершения, чтобы следующие запросы видели актуальный токен
        setTimeout(() => (refreshing = null), 0);
      }
    })();
  }
  return refreshing;
}

// Хук для обновления user в store (подключается из auth-store)
let onUserUpdated: ((u: User) => void) | null = null;
export function setOnUserUpdated(fn: ((u: User) => void) | null) {
  onUserUpdated = fn;
}

async function request<T>(
  path: string,
  options: RequestInit & { retry?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // 401 — пробовать refresh (кроме сам
  if (res.status === 401 && options.retry !== false && !path.startsWith("/auth/")) {
    const ok = await tryRefresh();
    if (ok) return request<T>(path, { ...options, retry: false });
    throw new ApiError(401, "Требуется авторизация");
  }

  let body: Envelope<T> | null = null;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    /* пустое тело */
  }

  if (!res.ok || !body || !body.success) {
    const msg = body?.error ?? `Ошибка сервера (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return body.data as T;
}

const qs = (params: Record<string, unknown>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
};

// ── Auth ──────────────────────────────────────────
export const api = {
  register: (body: {
    email: string;
    password: string;
    full_name: string;
    role: "customer" | "farmer";
    phone?: string;
    referral_code?: string;
  }) => request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  logout: () => request<void>("/auth/logout", { method: "POST" }),

  me: () => request<User>("/auth/me"),

  updateMe: (body: Partial<Pick<User, "full_name" | "phone" | "telegram" | "avatar_url" | "city" | "address" | "bio">>) =>
    request<User>("/auth/me", { method: "PATCH", body: JSON.stringify(body) }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // ── Каталог ─────────────────────────────────────
  listProducts: (f: ProductFilters = {}) =>
    request<ProductPage>(`/products${qs(f as Record<string, unknown>)}`),

  getProduct: (id: string) => request<Product>(`/products/${id}`),

  listCategories: () => request<Category[]>("/categories"),

  listReviews: (productId: string, limit = 20, offset = 0) =>
    request<Review[]>(`/products/${productId}/reviews?limit=${limit}&offset=${offset}`),

  // ── Фермеры ─────────────────────────────────────
  listFarmers: (q = "", limit = 50, offset = 0) =>
    request<Farmer[]>(`/farmers${qs({ q, limit, offset })}`),

  getFarmer: (id: string) => request<FarmerDetail>(`/farmers/${id}`),

  applyFarmer: (body: {
    full_name: string;
    phone: string;
    farm_name: string;
    city: string;
    products: string;
    experience?: string;
    bio?: string;
  }) => request<FarmerApplication>("/farmers/apply", { method: "POST", body: JSON.stringify(body) }),

  myApplication: () => request<FarmerApplication>("/farmers/apply/mine"),

  // ── CRUD товаров (фармер) ───────────────────────
  createProduct: (body: ProductInput) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(body) }),

  updateProduct: (id: string, body: ProductInput) =>
    request<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  deactivateProduct: (id: string) => request<void>(`/products/${id}`, { method: "DELETE" }),

  // ── Корзина ─────────────────────────────────────
  getCart: () => request<Cart>("/cart"),

  addToCart: (productId: string, quantity: number) =>
    request<Cart>("/cart", { method: "POST", body: JSON.stringify({ product_id: productId, quantity }) }),

  setCartQuantity: (productId: string, quantity: number) =>
    request<Cart>(`/cart/${productId}`, { method: "PATCH", body: JSON.stringify({ quantity }) }),

  removeFromCart: (productId: string) => request<Cart>(`/cart/${productId}`, { method: "DELETE" }),

  // ── Заказы ──────────────────────────────────────
  checkout: (body: {
    delivery_method: "delivery" | "pickup";
    delivery_address?: string;
    notes?: string;
    payment_method?: string;
    promo_code?: string;
  }) => request<{ orders: Order[] }>("/orders/checkout", { method: "POST", body: JSON.stringify(body) }),

  listOrders: (status = "") => request<Order[]>(`/orders${qs({ status })}`),

  getOrder: (id: string) => request<Order>(`/orders/${id}`),

  updateOrderStatus: (id: string, status: string) =>
    request<Order>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  createReview: (orderId: string, body: { product_id: string; rating: number; comment?: string }) =>
    request<Review>(`/orders/${orderId}/reviews`, { method: "POST", body: JSON.stringify(body) }),

  // ── Избранное ───────────────────────────────────
  listFavorites: () => request<Product[]>("/favorites"),

  addFavorite: (productId: string) => request<void>(`/favorites/${productId}`, { method: "POST" }),

  removeFavorite: (productId: string) => request<void>(`/favorites/${productId}`, { method: "DELETE" }),

  // ── Чат ─────────────────────────────────────────
  listConversations: () => request<Conversation[]>("/conversations"),

  startConversation: (userId: string, productId?: string) =>
    request<Conversation>("/conversations", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, product_id: productId }),
    }),

  listMessages: (conversationId: string, limit = 50, before?: string) =>
    request<Message[]>(`/conversations/${conversationId}/messages${qs({ limit, before })}`),

  sendMessage: (conversationId: string, text: string) =>
    request<Message>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  markRead: (conversationId: string, userId: string) =>
    request<{ read: number }>(`/conversations/${conversationId}/read`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),

  // ── Рефералы ────────────────────────────────────
  myReferrals: () => request<Referral[]>("/referrals"),

  referralCode: () => request<{ code: string }>("/referrals/code"),

  // ── Загрузка ────────────────────────────────────
  uploadFile: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ url: string }>("/uploads", { method: "POST", body: fd });
  },

  // ── Админ ───────────────────────────────────────
  adminStats: () => request<AdminStats>("/admin/stats"),

  listUsers: (q = "", role = "", limit = 50, offset = 0) =>
    request<UserSummary[]>(`/admin/users${qs({ q, role, limit, offset })}`),

  setUserActive: (id: string, isActive: boolean) =>
    request<void>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    }),

  listApplications: (status = "") => request<FarmerApplication[]>(`/admin/applications${qs({ status })}`),

  reviewApplication: (id: string, status: "approved" | "rejected") =>
    request<FarmerApplication>(`/admin/applications/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  listPromotions: () => request<Promotion[]>("/admin/promotions"),

  createPromotion: (body: {
    code: string;
    description?: string;
    discount_percent: number;
    min_amount: number;
    max_uses: number;
    expires_at?: string;
    is_active?: boolean;
  }) => request<Promotion>("/admin/promotions", { method: "POST", body: JSON.stringify(body) }),

  updatePromotion: (id: string, body: {
    code: string;
    description?: string;
    discount_percent: number;
    min_amount: number;
    max_uses: number;
    expires_at?: string;
    is_active?: boolean;
  }) => request<Promotion>(`/admin/promotions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  deletePromotion: (id: string) => request<void>(`/admin/promotions/${id}`, { method: "DELETE" }),
};

export interface ProductInput {
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  old_price?: number | null;
  unit: string;
  quantity_available: number;
  images: string[];
  is_featured: boolean;
  organic: boolean;
}
