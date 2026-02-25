-- Interpret availability window (date + time) as salon local time (Tunis).
-- Client now sends local date/time; this ensures v_ts_start/v_ts_end are correct
-- for overlap checks with bookings (stored as timestamptz).
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

  -- Treat (p_date + p_start_time) as salon local time (Africa/Tunis)
  v_ts_start := ((p_date::date + p_start_time) AT TIME ZONE 'Africa/Tunis')::timestamptz;
  v_ts_end := ((p_date::date + p_end_time) AT TIME ZONE 'Africa/Tunis')::timestamptz;
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

  -- Confirmed bookings: strict overlap
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE barber_id = p_barber_id
      AND status = 'confirmed'
      AND effective_start_at IS NOT NULL
      AND effective_end_at IS NOT NULL
      AND v_ts_start < effective_end_at
      AND v_ts_end > effective_start_at
  ) THEN RETURN false; END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;
