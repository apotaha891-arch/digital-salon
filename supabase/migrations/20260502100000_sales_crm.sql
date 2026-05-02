-- ─── Sales CRM: Leads, Activities, Tasks ───────────────────────────────────

-- Enum types
CREATE TYPE lead_city        AS ENUM ('Riyadh', 'Jeddah', 'Dammam', 'Other');
CREATE TYPE lead_source      AS ENUM ('Instagram DM', 'Referral', 'WhatsApp', 'Website', 'Event');
CREATE TYPE lead_status      AS ENUM ('prospect', 'contacted', 'replied', 'demo_booked', 'proposal_sent', 'closed');
CREATE TYPE lead_closed_reason AS ENUM ('won', 'lost_price', 'lost_timing', 'lost_competitor', 'no_response');
CREATE TYPE activity_type    AS ENUM ('dm_sent', 'whatsapp_sent', 'call_completed', 'note', 'demo_completed', 'proposal_sent', 'follow_up');

-- ─── sales_leads ────────────────────────────────────────────────────────────
CREATE TABLE sales_leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_name      text NOT NULL,
  owner_name      text,
  instagram_handle text,
  whatsapp_number text,
  city            lead_city NOT NULL DEFAULT 'Other',
  source          lead_source NOT NULL DEFAULT 'Instagram DM',
  status          lead_status NOT NULL DEFAULT 'prospect',
  closed_reason   lead_closed_reason,
  assigned_to     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── sales_activities ────────────────────────────────────────────────────────
CREATE TABLE sales_activities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      uuid NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  type         activity_type NOT NULL DEFAULT 'note',
  content      text,
  performed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── sales_tasks ─────────────────────────────────────────────────────────────
CREATE TABLE sales_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      uuid NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  assigned_to  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  due_date     date,
  description  text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── updated_at trigger ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_sales_lead_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_sales_leads_updated_at
  BEFORE UPDATE ON sales_leads
  FOR EACH ROW EXECUTE FUNCTION update_sales_lead_timestamp();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE sales_leads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_tasks      ENABLE ROW LEVEL SECURITY;

-- Admins have full access; assigned users can read their own leads
CREATE POLICY "admin_all_sales_leads" ON sales_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "admin_all_sales_activities" ON sales_activities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR performed_by = auth.uid()
    OR EXISTS (SELECT 1 FROM sales_leads WHERE id = lead_id AND assigned_to = auth.uid())
  );

CREATE POLICY "admin_all_sales_tasks" ON sales_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR assigned_to = auth.uid()
    OR EXISTS (SELECT 1 FROM sales_leads WHERE id = lead_id AND assigned_to = auth.uid())
  );

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_sales_leads_status      ON sales_leads(status);
CREATE INDEX idx_sales_leads_assigned_to ON sales_leads(assigned_to);
CREATE INDEX idx_sales_activities_lead   ON sales_activities(lead_id);
CREATE INDEX idx_sales_tasks_lead        ON sales_tasks(lead_id);
CREATE INDEX idx_sales_tasks_due         ON sales_tasks(due_date) WHERE NOT is_completed;
