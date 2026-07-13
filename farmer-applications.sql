-- Запусти этот SQL в Supabase SQL Editor
-- Создаёт таблицу заявок фермеров + обновляет профили

CREATE TABLE IF NOT EXISTS farmer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  farm_name TEXT,
  city TEXT DEFAULT 'Актобе',
  products TEXT NOT NULL,
  experience TEXT,
  bio TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE farmer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can see all applications" ON farmer_applications
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Anyone can create application" ON farmer_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update applications" ON farmer_applications
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin'));

-- Добавляем новые поля в profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS farm_name TEXT;
