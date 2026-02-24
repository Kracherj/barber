-- =====================================================
-- HOME SERVICE FEATURE - UNIFIED BOOKING MODEL
-- Adds IN_SHOP | HOME_SERVICE without duplicating booking logic.
-- Uses effective_start_at / effective_end_at for overlap detection.
-- =====================================================

-- 1. BOOKINGS: type + home address + effective window
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_type TEXT NOT NULL DEFAULT 'in_shop'
    CHECK (booking_type IN ('in_shop', 'home_service')),
  ADD COLUMN IF NOT EXISTS customer_address_line TEXT,
  ADD COLUMN IF NOT EXISTS customer_city_zone TEXT,
  ADD COLUMN IF NOT EXISTS customer_location_pin TEXT,
  ADD COLUMN IF NOT EXISTS total_price_tnd DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS effective_start_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS effective_end_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN bookings.booking_type IS 'in_shop = at salon; home_service = at client';
COMMENT ON COLUMN bookings.effective_start_at IS 'Start of blocked window (for in_shop = booking_date; for home = booking_date - travel)';
COMMENT ON COLUMN bookings.effective_end_at IS 'End of blocked window (for in_shop = booking_date + duration; for home = booking_date + duration + buffer)';

-- 2. BARBERS: home service eligibility and travel config
ALTER TABLE barbers
  ADD COLUMN IF NOT EXISTS home_service_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_travel_minutes INTEGER DEFAULT 30 CHECK (home_travel_minutes IS NULL OR (home_travel_minutes >= 0 AND home_travel_minutes <= 180)),
  ADD COLUMN IF NOT EXISTS home_buffer_minutes INTEGER DEFAULT 15 CHECK (home_buffer_minutes IS NULL OR (home_buffer_minutes >= 0 AND home_buffer_minutes <= 60)),
  ADD COLUMN IF NOT EXISTS max_home_visits_per_day INTEGER DEFAULT 5 CHECK (max_home_visits_per_day IS NULL OR (max_home_visits_per_day >= 0 AND max_home_visits_per_day <= 20)),
  ADD COLUMN IF NOT EXISTS home_travel_radius_km DECIMAL(6, 2);

-- 3. SERVICES: home availability and surcharge
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS available_for_home BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_surcharge_tnd DECIMAL(10, 2) DEFAULT 0;

-- 4. SALON CONFIG (single-row config for global home settings)
CREATE TABLE IF NOT EXISTS salon_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value_text TEXT,
  value_number DECIMAL(12, 2),
  value_bool BOOLEAN,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO salon_config (key, value_number, value_bool) VALUES
  ('home_service_base_fee_tnd', 10.00, NULL),
  ('home_service_enabled', NULL, true)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE salon_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read salon_config" ON salon_config;
CREATE POLICY "Public read salon_config" ON salon_config FOR SELECT USING (true);

-- 5. Backfill effective window for existing in_shop bookings
UPDATE bookings b
SET
  effective_start_at = b.booking_date,
  effective_end_at = b.booking_date + (COALESCE((SELECT s.duration_minutes FROM services s WHERE s.id = b.service_id), 30) || ' minutes')::INTERVAL
WHERE b.status = 'confirmed'
  AND (b.effective_start_at IS NULL OR b.effective_end_at IS NULL);

-- 6. Ensure all confirmed bookings have effective window (safety)
UPDATE bookings b
SET
  effective_start_at = COALESCE(b.effective_start_at, b.booking_date),
  effective_end_at = COALESCE(b.effective_end_at, b.booking_date + (COALESCE((SELECT s.duration_minutes FROM services s WHERE s.id = b.service_id), 30) || ' minutes')::INTERVAL)
WHERE b.status = 'confirmed';

-- 7. Drop old partial unique index (we enforce overlap via trigger)
DROP INDEX IF EXISTS bookings_barber_date_unique_confirmed;

-- 8. Trigger: prevent overlapping effective windows for same barber (confirmed only)
CREATE OR REPLACE FUNCTION check_booking_effective_window_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND NEW.effective_start_at IS NOT NULL AND NEW.effective_end_at IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM bookings
      WHERE barber_id = NEW.barber_id
        AND status = 'confirmed'
        AND (effective_start_at, effective_end_at) OVERLAPS (NEW.effective_start_at, NEW.effective_end_at)
        AND (TG_OP = 'INSERT' OR id != NEW.id)
    ) THEN
      RAISE EXCEPTION 'Booking effective window overlaps existing confirmed booking for this barber';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_booking_overlap ON bookings;
CREATE TRIGGER trigger_check_booking_overlap
  BEFORE INSERT OR UPDATE OF barber_id, booking_date, status, effective_start_at, effective_end_at
  ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_effective_window_overlap();

-- 9. Index for overlap / availability queries
CREATE INDEX IF NOT EXISTS idx_bookings_effective_window
  ON bookings(barber_id, effective_start_at, effective_end_at)
  WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON bookings(booking_type);

-- 10. RPC: check availability for a time window (schedule + blocked + no booking overlap)
-- Keeps existing get_barber_availability(date, start_time, end_time) for backward compat.
-- Add new function that also checks booking effective windows.
CREATE OR REPLACE FUNCTION get_barber_availability(
  p_barber_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  weekly_schedule RECORD;
  date_override RECORD;
  v_ts_start TIMESTAMP WITH TIME ZONE;
  v_ts_end TIMESTAMP WITH TIME ZONE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM barbers WHERE id = p_barber_id AND (is_active = true OR is_active IS NULL)) THEN
    RETURN false;
  END IF;

  v_ts_start := (p_date::timestamp + p_start_time)::timestamptz;
  v_ts_end := (p_date::timestamp + p_end_time)::timestamptz;
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;

  -- Date override
  SELECT * INTO date_override
  FROM barber_date_overrides
  WHERE barber_id = p_barber_id AND date = p_date;

  IF date_override IS NOT NULL THEN
    IF date_override.is_available = false THEN RETURN false; END IF;
    IF date_override.start_time IS NOT NULL AND date_override.end_time IS NOT NULL THEN
      IF p_start_time < date_override.start_time OR p_end_time > date_override.end_time THEN
        RETURN false;
      END IF;
    END IF;
    IF EXISTS (
      SELECT 1 FROM barber_date_breaks
      WHERE override_id = date_override.id
        AND (p_start_time, p_end_time) OVERLAPS (start_time, end_time)
    ) THEN RETURN false; END IF;
  ELSE
    SELECT * INTO weekly_schedule
    FROM barber_weekly_schedule
    WHERE barber_id = p_barber_id AND day_of_week = v_day_of_week;

    IF weekly_schedule IS NULL OR weekly_schedule.is_available = false THEN RETURN false; END IF;
    IF p_start_time < weekly_schedule.start_time OR p_end_time > weekly_schedule.end_time THEN RETURN false; END IF;
    IF EXISTS (
      SELECT 1 FROM barber_weekly_breaks
      WHERE schedule_id = weekly_schedule.id
        AND (p_start_time, p_end_time) OVERLAPS (start_time, end_time)
    ) THEN RETURN false; END IF;
  END IF;

  -- Blocked slots
  IF EXISTS (
    SELECT 1 FROM barber_blocked_slots
    WHERE barber_id = p_barber_id
      AND (v_ts_start, v_ts_end) OVERLAPS (start_time, end_time)
  ) THEN RETURN false; END IF;

  -- Confirmed bookings: overlap on effective window
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE barber_id = p_barber_id
      AND status = 'confirmed'
      AND effective_start_at IS NOT NULL
      AND effective_end_at IS NOT NULL
      AND (v_ts_start, v_ts_end) OVERLAPS (effective_start_at, effective_end_at)
  ) THEN RETURN false; END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;
