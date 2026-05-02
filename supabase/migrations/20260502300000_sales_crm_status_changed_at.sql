-- Track when a lead's status last changed (powers days-in-stage calculation)
ALTER TABLE sales_leads
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz NOT NULL DEFAULT now();

-- Backfill: set to updated_at for any existing rows
UPDATE sales_leads SET status_changed_at = updated_at WHERE status_changed_at IS NULL;

-- Auto-update status_changed_at whenever status column changes
CREATE OR REPLACE FUNCTION update_sales_lead_status_changed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sales_leads_status_changed
  BEFORE UPDATE ON sales_leads
  FOR EACH ROW EXECUTE FUNCTION update_sales_lead_status_changed_at();
