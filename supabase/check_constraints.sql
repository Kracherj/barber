-- Check current constraints and indexes on bookings table
-- Run this FIRST to see what's currently in your database

-- 1. Check all unique constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass
AND contype = 'u';

-- 2. Check all indexes (including unique indexes)
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'bookings'
ORDER BY indexname;

-- 3. Check if partial unique index exists
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'bookings' 
AND indexname = 'bookings_barber_date_unique_confirmed';
