// ── Общие типы API ────────────────────────────────

export interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export type Role = "customer" | "farmer" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  telegram?: string | null;
  avatar_url?: string | null;
  role: Role;
  city: string;
  address?: string | null;
  bio?: string | null;
  farm_name?: string | null;
  is_active: boolean;
  xp: number;
  level: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  image_url?: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  farmer_id: string;
  farmer_name?: string | null;
  farmer_city?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  name: string;
  description?: string | null;
  price: number;
  old_price?: number | null;
  unit: string;
  quantity_available: number;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  organic: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  total: number;
  created_at: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivering"
  | "delivered"
  | "cancelled";

export type DeliveryMethod = "delivery" | "pickup";

export interface Order {
  id: string;
  order_number: number;
  customer_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  farmer_id: string;
  farmer_name?: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  delivery_method: DeliveryMethod;
  delivery_address?: string | null;
  notes?: string | null;
  payment_method: string;
  promo_code?: string | null;
  items: OrderItem[];
  /** Число позиций (из списка заказов — без загрузки самих позиций) */
  items_count?: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Review {
  id: string;
  order_id: string;
  product_id: string;
  customer_id: string;
  customer_name: string;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface Farmer {
  id: string;
  full_name: string;
  farm_name?: string | null;
  city: string;
  bio?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  product_count: number;
  rating?: number | null;
  review_count?: number | null;
}

export interface FarmerDetail extends Farmer {
  products: Product[];
}

export interface Conversation {
  id: string;
  other_id: string;
  other_name: string;
  other_avatar?: string;
  product_id?: string | null;
  product_name?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

export interface Promotion {
  id: string;
  code: string;
  description?: string | null;
  discount_percent: number;
  min_amount: number;
  max_uses: number;
  current_uses: number;
  expires_at?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referred_name?: string | null;
  reward_amount: number;
  status: "pending" | "rewarded";
  created_at: string;
}

export interface FarmerApplication {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  full_name: string;
  phone: string;
  farm_name: string;
  city: string;
  products: string;
  experience?: string | null;
  bio?: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_at?: string | null;
  created_at: string;
}

export interface UserSummary {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface AdminStats {
  users: number;
  farmers: number;
  orders: number;
  revenue: number;
  weekly: { day: string; count: number; total: number }[];
}

// ── Запросы ───────────────────────────────────────

export interface ProductFilters {
  category?: string;
  farmer?: string;
  /** Только свои товары (кабинет фермера) */
  mine?: boolean;
  q?: string;
  min_price?: number;
  max_price?: number;
  organic?: boolean;
  featured?: boolean;
  sort?: "new" | "price_asc" | "price_desc" | "rating";
  page?: number;
  limit?: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
