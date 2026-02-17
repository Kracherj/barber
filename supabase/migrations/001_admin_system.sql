-- =====================================================
-- ADMIN CONTROL PANEL - DATABASE SCHEMA
-- Production-ready, scalable barber management system
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For password hashing

-- =====================================================
-- 1. ROLE-BASED ACCESS CONTROL (RBAC)
-- =====================================================

-- Update admin_users table with proper structure
ALTER TABLE admin_users 
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'barber')),
  ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES admin_users(id);

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_barber_id ON admin_users(barber_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- =====================================================
-- 2. BARBER MANAGEMENT EXTENSIONS
-- =====================================================

-- Add columns to barbers table
ALTER TABLE barbers
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS time_slot_duration_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS services_offered UUID[] DEFAULT ARRAY[]::UUID[],
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create barber_services junction table (many-to-many)
CREATE TABLE IF NOT EXISTS barber_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(barber_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_barber_services_barber ON barber_services(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_services_service ON barber_services(service_id);

-- =====================================================
-- 3. WORKING HOURS MANAGEMENT
-- =====================================================

-- Weekly recurring schedule (default working hours)
CREATE TABLE IF NOT EXISTS barber_weekly_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(barber_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_barber_weekly_schedule_barber ON barber_weekly_schedule(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_weekly_schedule_day ON barber_weekly_schedule(day_of_week);

-- Break times for weekly schedule
CREATE TABLE IF NOT EXISTS barber_weekly_breaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES barber_weekly_schedule(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_barber_weekly_breaks_schedule ON barber_weekly_breaks(schedule_id);

-- Custom date overrides (specific dates with different hours)
CREATE TABLE IF NOT EXISTS barber_date_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(barber_id, date)
);

CREATE INDEX IF NOT EXISTS idx_barber_date_overrides_barber ON barber_date_overrides(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_date_overrides_date ON barber_date_overrides(date);

-- Break times for date overrides
CREATE TABLE IF NOT EXISTS barber_date_breaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  override_id UUID NOT NULL REFERENCES barber_date_overrides(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_barber_date_breaks_override ON barber_date_breaks(override_id);

-- Blocked time slots (emergency/unavailable)
CREATE TABLE IF NOT EXISTS barber_blocked_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  auto_notify_customers BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_barber_blocked_slots_barber ON barber_blocked_slots(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_blocked_slots_time ON barber_blocked_slots(start_time, end_time);

-- =====================================================
-- 4. BOOKING REASSIGNMENT TRACKING
-- =====================================================

-- Track booking reassignments for audit trail
CREATE TABLE IF NOT EXISTS booking_reassignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_barber_id UUID NOT NULL REFERENCES barbers(id),
  new_barber_id UUID NOT NULL REFERENCES barbers(id),
  reason TEXT,
  notified_customer BOOLEAN DEFAULT false,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_booking_reassignments_booking ON booking_reassignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reassignments_old_barber ON booking_reassignments(old_barber_id);
CREATE INDEX IF NOT EXISTS idx_booking_reassignments_new_barber ON booking_reassignments(new_barber_id);

-- =====================================================
-- 5. NOTIFICATION LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('booking_confirmed', 'booking_cancelled', 'booking_reassigned', 'reminder_24h', 'reminder_same_day')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_booking ON notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_phone ON notifications(customer_phone);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- =====================================================
-- 6. TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_barber_weekly_schedule_updated_at ON barber_weekly_schedule;
CREATE TRIGGER update_barber_weekly_schedule_updated_at 
  BEFORE UPDATE ON barber_weekly_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_barber_date_overrides_updated_at ON barber_date_overrides;
CREATE TRIGGER update_barber_date_overrides_updated_at 
  BEFORE UPDATE ON barber_date_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if barber has future bookings before deletion
CREATE OR REPLACE FUNCTION check_barber_future_bookings()
RETURNS TRIGGER AS $$
DECLARE
  future_count INTEGER;
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    -- Check for future confirmed bookings
    SELECT COUNT(*) INTO future_count
    FROM bookings
    WHERE barber_id = NEW.id
      AND status = 'confirmed'
      AND booking_date > NOW();
    
    IF future_count > 0 THEN
      RAISE EXCEPTION 'Cannot deactivate barber with % future bookings. Please reassign or cancel bookings first.', future_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS check_barber_future_bookings_trigger ON barbers;
CREATE TRIGGER check_barber_future_bookings_trigger
  BEFORE UPDATE OF is_active ON barbers
  FOR EACH ROW
  EXECUTE FUNCTION check_barber_future_bookings();

-- Function to automatically cancel bookings when barber is blocked
CREATE OR REPLACE FUNCTION handle_barber_blocked_slot()
RETURNS TRIGGER AS $$
DECLARE
  affected_booking RECORD;
BEGIN
  -- Find all bookings that overlap with blocked slot
  FOR affected_booking IN
    SELECT b.id, b.customer_phone, b.customer_email, b.booking_date
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.barber_id = NEW.barber_id
      AND b.status = 'confirmed'
      AND b.booking_date >= NEW.start_time
      AND b.booking_date < NEW.end_time
  LOOP
    -- Cancel the booking
    UPDATE bookings
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = affected_booking.id;
    
    -- Create notification record if auto_notify is enabled
    IF NEW.auto_notify_customers THEN
      INSERT INTO notifications (
        booking_id,
        customer_phone,
        customer_email,
        notification_type,
        channel,
        status,
        message
      ) VALUES (
        affected_booking.id,
        affected_booking.customer_phone,
        affected_booking.customer_email,
        'booking_cancelled',
        'sms',
        'pending',
        'Votre rendez-vous du ' || TO_CHAR(affected_booking.booking_date, 'DD/MM/YYYY à HH24:MI') || ' a été annulé. Veuillez réserver un nouveau créneau.'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS handle_barber_blocked_slot_trigger ON barber_blocked_slots;
CREATE TRIGGER handle_barber_blocked_slot_trigger
  AFTER INSERT ON barber_blocked_slots
  FOR EACH ROW
  EXECUTE FUNCTION handle_barber_blocked_slot();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE barber_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_weekly_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_weekly_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_date_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_date_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reassignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public read access to barber schedules (for booking page)
DROP POLICY IF EXISTS "Public read barber schedules" ON barber_weekly_schedule;
CREATE POLICY "Public read barber schedules" ON barber_weekly_schedule FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read barber date overrides" ON barber_date_overrides;
CREATE POLICY "Public read barber date overrides" ON barber_date_overrides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read barber blocked slots" ON barber_blocked_slots;
CREATE POLICY "Public read barber blocked slots" ON barber_blocked_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read barber services" ON barber_services;
CREATE POLICY "Public read barber services" ON barber_services FOR SELECT USING (true);

-- Admin full access (enforced by application logic + service role key)
DROP POLICY IF EXISTS "Admin full access barber services" ON barber_services;
CREATE POLICY "Admin full access barber services" ON barber_services FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access weekly schedule" ON barber_weekly_schedule;
CREATE POLICY "Admin full access weekly schedule" ON barber_weekly_schedule FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access weekly breaks" ON barber_weekly_breaks;
CREATE POLICY "Admin full access weekly breaks" ON barber_weekly_breaks FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access date overrides" ON barber_date_overrides;
CREATE POLICY "Admin full access date overrides" ON barber_date_overrides FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access date breaks" ON barber_date_breaks;
CREATE POLICY "Admin full access date breaks" ON barber_date_breaks FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access blocked slots" ON barber_blocked_slots;
CREATE POLICY "Admin full access blocked slots" ON barber_blocked_slots FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access reassignments" ON booking_reassignments;
CREATE POLICY "Admin full access reassignments" ON booking_reassignments FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access notifications" ON notifications;
CREATE POLICY "Admin full access notifications" ON notifications FOR ALL USING (true);

-- =====================================================
-- 8. HELPER FUNCTIONS FOR AVAILABILITY CALCULATION
-- =====================================================

-- Function to get barber availability for a specific date/time
CREATE OR REPLACE FUNCTION get_barber_availability(
  p_barber_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  day_of_week INTEGER;
  weekly_schedule RECORD;
  date_override RECORD;
  blocked_slot RECORD;
BEGIN
  -- Check if barber is active
  IF NOT EXISTS (SELECT 1 FROM barbers WHERE id = p_barber_id AND is_active = true) THEN
    RETURN false;
  END IF;
  
  day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;
  
  -- Check for date-specific override
  SELECT * INTO date_override
  FROM barber_date_overrides
  WHERE barber_id = p_barber_id
    AND date = p_date;
  
  IF date_override IS NOT NULL THEN
    -- Use date override
    IF date_override.is_available = false THEN
      RETURN false;
    END IF;
    
    IF date_override.start_time IS NOT NULL AND date_override.end_time IS NOT NULL THEN
      IF p_start_time < date_override.start_time OR p_end_time > date_override.end_time THEN
        RETURN false;
      END IF;
    END IF;
    
    -- Check breaks in date override
    IF EXISTS (
      SELECT 1 FROM barber_date_breaks
      WHERE override_id = date_override.id
        AND (p_start_time, p_end_time) OVERLAPS (start_time, end_time)
    ) THEN
      RETURN false;
    END IF;
  ELSE
    -- Use weekly schedule
    SELECT * INTO weekly_schedule
    FROM barber_weekly_schedule
    WHERE barber_id = p_barber_id
      AND barber_weekly_schedule.day_of_week = day_of_week;
    
    IF weekly_schedule IS NULL OR weekly_schedule.is_available = false THEN
      RETURN false;
    END IF;
    
    IF p_start_time < weekly_schedule.start_time OR p_end_time > weekly_schedule.end_time THEN
      RETURN false;
    END IF;
    
    -- Check breaks in weekly schedule
    IF EXISTS (
      SELECT 1 FROM barber_weekly_breaks
      WHERE schedule_id = weekly_schedule.id
        AND (p_start_time, p_end_time) OVERLAPS (start_time, end_time)
    ) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check for blocked slots
  IF EXISTS (
    SELECT 1 FROM barber_blocked_slots
    WHERE barber_id = p_barber_id
      AND (p_date::TIMESTAMP + p_start_time, p_date::TIMESTAMP + p_end_time) 
          OVERLAPS (start_time, end_time)
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ language 'plpgsql' STABLE;

-- =====================================================
-- 9. INITIAL DATA SETUP
-- =====================================================

-- Set default weekly schedules for existing barbers (Mon-Fri 9-21, Sat 9-21, Fri starts 14)
INSERT INTO barber_weekly_schedule (barber_id, day_of_week, start_time, end_time, is_available)
SELECT 
  id,
  day_num,
  CASE WHEN day_num = 5 THEN '14:00'::TIME ELSE '09:00'::TIME END,
  '21:00'::TIME,
  CASE WHEN day_num = 0 THEN false ELSE true END -- Sunday closed
FROM barbers
CROSS JOIN generate_series(1, 6) AS day_num -- Monday to Saturday
WHERE NOT EXISTS (
  SELECT 1 FROM barber_weekly_schedule 
  WHERE barber_id = barbers.id AND day_of_week = day_num
)
ON CONFLICT DO NOTHING;

-- Link all existing barbers to all services
INSERT INTO barber_services (barber_id, service_id)
SELECT b.id, s.id
FROM barbers b
CROSS JOIN services s
WHERE NOT EXISTS (
  SELECT 1 FROM barber_services 
  WHERE barber_id = b.id AND service_id = s.id
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. PERFORMANCE INDEXES
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_barber_weekly_schedule_barber_day 
  ON barber_weekly_schedule(barber_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_barber_date_overrides_barber_date 
  ON barber_date_overrides(barber_id, date);

CREATE INDEX IF NOT EXISTS idx_barber_blocked_slots_barber_time 
  ON barber_blocked_slots(barber_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_bookings_barber_date_status 
  ON bookings(barber_id, booking_date, status);

-- =====================================================
-- END OF MIGRATION
-- =====================================================
