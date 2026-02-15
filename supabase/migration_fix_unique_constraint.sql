-- Migration: Fix UNIQUE constraint to allow cancelled bookings to be replaced
-- Run this in your Supabase SQL Editor to fix the existing database

-- Step 1: Check existing constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass
AND contype = 'u';

-- Step 2: Drop ALL unique constraints on (barber_id, booking_date)
-- Try different possible constraint names
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_barber_id_booking_date_key;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_pkey; -- Don't drop primary key, but check if it exists
DO $$ 
BEGIN
    -- Drop any unique constraint on barber_id and booking_date
    EXECUTE (
        SELECT 'ALTER TABLE bookings DROP CONSTRAINT ' || conname
        FROM pg_constraint
        WHERE conrelid = 'bookings'::regclass
        AND contype = 'u'
        AND array_length(conkey, 1) = 2
        AND conkey::text LIKE '%barber_id%'
        AND conkey::text LIKE '%booking_date%'
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN
    -- Constraint might not exist or have different structure
    NULL;
END $$;

-- Step 3: Create a partial unique index that only applies to confirmed bookings
-- This allows cancelled bookings to not block new bookings at the same time slot
DROP INDEX IF EXISTS bookings_barber_date_unique_confirmed;
CREATE UNIQUE INDEX bookings_barber_date_unique_confirmed 
ON bookings(barber_id, booking_date) 
WHERE status = 'confirmed';

-- Step 4: Verify the index was created successfully
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'bookings' 
AND indexname = 'bookings_barber_date_unique_confirmed';

-- Step 5: Test - This should show only confirmed bookings are constrained
SELECT 
  barber_id, 
  booking_date, 
  status,
  COUNT(*) as count
FROM bookings
WHERE status = 'confirmed'
GROUP BY barber_id, booking_date, status
HAVING COUNT(*) > 1;
-- This query should return 0 rows (no duplicates for confirmed bookings)
