// ============================================================
// Ferma.kz — Core Type Definitions
// ============================================================

// ─── User Roles ──────────────────────────────────────────────
export type UserRole = 'customer' | 'farmer' | 'admin';

// ─── User ────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Farmer Profile (extends User) ───────────────────────────
export interface Farmer {
  id: string;
  user_id: string;
  farm_name: string;
  farm_description: string;
  farm_location: string;
  farm_image?: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Category ────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  children?: Category[];
  created_at: string;
}

// ─── Product ─────────────────────────────────────────────────
export interface Product {
  id: string;
  farmer_id: string;
  farmer?: Farmer;
  category_id: string;
  category?: Category;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_price?: number;
  unit: string;
  min_order: number;
  stock: number;
  images: string[];
  tags: string[];
  is_organic: boolean;
  is_available: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Order ───────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: string;
  user_id: string;
  user?: User;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  delivery_address: DeliveryAddress;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface DeliveryAddress {
  full_name: string;
  phone: string;
  city: string;
  district?: string;
  street: string;
  building: string;
  apartment?: string;
  entrance?: string;
  floor?: number;
  comment?: string;
}

// ─── Cart ────────────────────────────────────────────────────
export interface CartItem {
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
}

// ─── Review ──────────────────────────────────────────────────
export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user?: User;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Chat / Messaging ────────────────────────────────────────
export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender?: User;
  receiver?: User;
  text: string;
  image_url?: string;
  read_at?: string;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  last_message?: ChatMessage;
  unread_count: number;
  updated_at: string;
}

// ─── Subscription ────────────────────────────────────────────
export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  user_id: string;
  products: { product_id: string; quantity: number }[];
  frequency: SubscriptionFrequency;
  delivery_day: number; // day of week (0-6) or month (1-31)
  next_delivery: string;
  status: SubscriptionStatus;
  total: number;
  delivery_address: DeliveryAddress;
  created_at: string;
  updated_at: string;
}

// ─── Promotion / Coupon ──────────────────────────────────────
export interface Promotion {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order?: number;
  max_uses?: number;
  used_count: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string;
  created_at: string;
}

// ─── Referral ────────────────────────────────────────────────
export interface Referral {
  id: string;
  referrer_id: string;
  referred_email: string;
  referred_id?: string;
  status: 'pending' | 'joined' | 'rewarded';
  reward_amount: number;
  created_at: string;
  updated_at: string;
}

// ─── API Response wrappers ───────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
