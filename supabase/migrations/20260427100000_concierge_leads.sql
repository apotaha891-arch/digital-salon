-- ─── Concierge Leads — website visitor conversations ───
CREATE TABLE IF NOT EXISTS public.concierge_leads (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     TEXT        NOT NULL UNIQUE,
  messages       JSONB       NOT NULL DEFAULT '[]',
  visitor_name   TEXT,
  visitor_email  TEXT,
  visitor_phone  TEXT,
  language       TEXT        DEFAULT 'ar',
  is_resolved    BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.concierge_leads ENABLE ROW LEVEL SECURITY;

-- Admins can read all leads
CREATE POLICY "admins view concierge leads" ON public.concierge_leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update (mark resolved)
CREATE POLICY "admins update concierge leads" ON public.concierge_leads
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_concierge_leads_created ON public.concierge_leads(created_at DESC);
