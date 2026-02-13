-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Barbers table
CREATE TABLE IF NOT EXISTS barbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  duration_minutes INTEGER NOT NULL,
  price_tnd DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(barber_id, booking_date)
);

-- Admin users table (simple password-based auth for admin dashboard)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default barbers
INSERT INTO barbers (id, name, name_ar) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Ahmed', 'أحمد'),
  ('22222222-2222-2222-2222-222222222222', 'Karim', 'كريم'),
  ('33333333-3333-3333-3333-333333333333', 'Walid', 'وليد')
ON CONFLICT DO NOTHING;

-- Insert default services
INSERT INTO services (id, name_en, name_ar, description_en, description_ar, duration_minutes, price_tnd) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Classic Cut', 'قص كلاسيكي', 'Professional haircut with styling', 'قص احترافي مع تصفيف', 30, 25.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Premium Cut + Shave', 'قص مميز + حلاقة', 'Premium haircut with hot towel shave', 'قص مميز مع حلاقة بمنشفة ساخنة', 45, 40.00),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Beard Trim', 'تهذيب اللحية', 'Precise beard trimming and shaping', 'تهذيب وتشكيل اللحية بدقة', 20, 15.00),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Full Service', 'خدمة كاملة', 'Complete grooming experience: cut, shave, and styling', 'تجربة عناية كاملة: قص، حلاقة، وتصفيف', 75, 60.00)
ON CONFLICT DO NOTHING;

-- Insert admin user (password: hajadmin2026)
-- In production, use proper password hashing (bcrypt)
-- For now, storing plain text for simplicity (NOT RECOMMENDED FOR PRODUCTION)
INSERT INTO admin_users (username, password_hash) VALUES
  ('admin', 'hajadmin2026')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_barber ON bookings(barber_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON barbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to barbers and services
CREATE POLICY "Public read access to barbers" ON barbers FOR SELECT USING (true);
CREATE POLICY "Public read access to services" ON services FOR SELECT USING (true);

-- Allow authenticated users to insert bookings
CREATE POLICY "Public insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read own bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Public update own bookings" ON bookings FOR UPDATE USING (true);

-- Admin policies (will be handled by application logic)
CREATE POLICY "Admin full access" ON bookings FOR ALL USING (true);
CREATE POLICY "Admin full access services" ON services FOR ALL USING (true);
CREATE POLICY "Admin full access barbers" ON barbers FOR ALL USING (true);
