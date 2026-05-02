-- ── STAFF TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT,                          -- e.g. "مصففة شعر", "خبيرة مكياج"
  phone       TEXT,
  avatar      TEXT,                          -- emoji or initials fallback
  specialties JSONB DEFAULT '[]',            -- array of service IDs
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_owner_all" ON staff;
CREATE POLICY "staff_owner_all"
  ON staff FOR ALL
  USING (auth.uid() = user_id);

-- ── ADD STAFF COLUMNS TO BOOKINGS ────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS staff_id   UUID REFERENCES staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS staff_name TEXT;
