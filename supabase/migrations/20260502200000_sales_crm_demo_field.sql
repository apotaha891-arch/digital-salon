-- Add demo scheduling field to sales_leads
ALTER TABLE sales_leads
  ADD COLUMN IF NOT EXISTS demo_scheduled_at timestamptz;
