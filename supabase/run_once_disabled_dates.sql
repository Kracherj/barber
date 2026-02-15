-- Run this once in Supabase: SQL Editor → New query → paste and Run
-- Creates the disabled_dates table so admin can block booking days.

CREATE TABLE IF NOT EXISTS disabled_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disabled_dates_date ON disabled_dates(date);

ALTER TABLE disabled_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read disabled_dates" ON disabled_dates FOR SELECT USING (true);
CREATE POLICY "Public insert disabled_dates" ON disabled_dates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete disabled_dates" ON disabled_dates FOR DELETE USING (true);
