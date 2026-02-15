-- Table: disabled_dates
-- When a date is in this table, no client can book on that day (salon closed / day off).
CREATE TABLE IF NOT EXISTS disabled_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disabled_dates_date ON disabled_dates(date);

-- RLS: allow everyone to read (so booking page can check), allow insert/delete (admin only via app)
ALTER TABLE disabled_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read disabled_dates" ON disabled_dates FOR SELECT USING (true);
CREATE POLICY "Public insert disabled_dates" ON disabled_dates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete disabled_dates" ON disabled_dates FOR DELETE USING (true);
