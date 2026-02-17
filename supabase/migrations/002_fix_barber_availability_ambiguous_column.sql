-- Fix ambiguous column reference in get_barber_availability function
-- Renamed variable to avoid conflict with column name

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
  blocked_slot RECORD;
BEGIN
  -- Check if barber is active
  IF NOT EXISTS (SELECT 1 FROM barbers WHERE id = p_barber_id AND is_active = true) THEN
    RETURN false;
  END IF;
  
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;
  
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
    -- Use weekly schedule (fixed: use renamed variable to avoid ambiguity)
    SELECT * INTO weekly_schedule
    FROM barber_weekly_schedule
    WHERE barber_id = p_barber_id
      AND day_of_week = v_day_of_week;
    
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
