-- Ferma.kz Database Schema
-- PostgreSQL for Supabase

-- ===== ENUMS =====

CREATE TYPE user_role AS ENUM ('customer', 'farmer', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled');
CREATE TYPE delivery_method AS ENUM ('delivery', 'pickup');

-- ===== PROFILES =====

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  city TEXT DEFAULT 'Актобе',
  bio TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_city ON profiles(city);

-- ===== CATEGORIES =====

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Мясо и птица', 'myaso', '🥩', 1),
  ('Молочные продукты', 'molochnye', '🧀', 2),
  ('Овощи', 'ovoshi', '🥔', 3),
  ('Фрукты', 'frukty', '🍎', 4),
  ('Мёд и сладости', 'med', '🍯', 5),
  ('Яйца', 'yaytsa', '🥚', 6),
  ('Зелень', 'zelen', '🌿', 7),
  ('Консервация', 'konservy', '🥫', 8),
  ('Домашняя выпечка', 'vypechka', '🥖', 9),
  ('Масло и жиры', 'maslo', '🧈', 10);

-- ===== PRODUCTS =====

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2),
  unit TEXT NOT NULL DEFAULT 'кг',
  quantity_available INTEGER DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  organic_certified BOOLEAN DEFAULT false,
  delivery_available BOOLEAN DEFAULT true,
  preparation_time TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_farmer ON products(farmer_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_created ON products(created_at DESC);

-- ===== ORDERS =====

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL UNIQUE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  farmer_id UUID NOT NULL REFERENCES profiles(id),
  status order_status DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_method delivery_method DEFAULT 'delivery',
  delivery_address TEXT,
  delivery_date DATE,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  customer_notes TEXT,
  payment_method TEXT,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_farmer ON orders(farmer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ===== ORDER ITEMS =====

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ===== REVIEWS =====

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  product_id UUID NOT NULL REFERENCES products(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);

-- ===== CART =====

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

CREATE INDEX idx_cart_customer ON cart_items(customer_id);

-- ===== CHAT =====

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID NOT NULL REFERENCES profiles(id),
  product_id UUID REFERENCES products(id),
  message TEXT,
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_participants ON chat_messages(sender_id, receiver_id);
CREATE INDEX idx_chat_unread ON chat_messages(receiver_id, is_read) WHERE is_read = false;

-- ===== FAVORITES =====

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

-- ===== SUBSCRIPTIONS =====

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  farmer_id UUID NOT NULL REFERENCES profiles(id),
  weekly_basket JSONB DEFAULT '[]',
  day_of_week INTEGER DEFAULT 6, -- 0=Sun, 6=Sat
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  next_delivery DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);

-- ===== PROMOTIONS =====

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_percent INTEGER NOT NULL,
  min_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== REFERRALS =====

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id),
  referred_email TEXT,
  referred_id UUID REFERENCES profiles(id),
  reward_amount DECIMAL(10,2) DEFAULT 500,
  is_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

-- ===== FARMER_SUBSCRIPTIONS (for monetization) =====

CREATE TABLE farmer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID UNIQUE NOT NULL REFERENCES profiles(id),
  plan TEXT NOT NULL DEFAULT 'free',
  price DECIMAL(10,2) DEFAULT 0,
  product_limit INTEGER DEFAULT 5,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== RLS POLICIES =====

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any profile, update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Products: anyone can read active, only farmers can create/update
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (is_active = true OR auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = products.farmer_id
  ));

CREATE POLICY "Farmers can create products" ON products
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = farmer_id AND role = 'farmer'
  ));

-- Orders: customers see own, farmers see theirs, admins see all
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = customer_id) OR
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = farmer_id) OR
    auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
  );

-- Cart: users manage their own
CREATE POLICY "Users can manage own cart" ON cart_items
  USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = customer_id));

-- Chat: participants can read
CREATE POLICY "Users can read their chats" ON chat_messages
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = sender_id) OR
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = receiver_id)
  );

-- ===== FUNCTIONS =====

-- Update product rating when review added
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE product_id = NEW.product_id AND is_verified = true
  )
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Auto-cancel expired pending orders
CREATE OR REPLACE FUNCTION cancel_expired_orders()
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET status = 'cancelled', updated_at = now()
  WHERE status = 'pending'
  AND created_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
