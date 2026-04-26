-- Platform token cost settings (editable by admin)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  platform    TEXT PRIMARY KEY,
  token_cost  INT  NOT NULL DEFAULT 1,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed defaults
INSERT INTO public.platform_settings (platform, token_cost) VALUES
  ('whatsapp',  3),
  ('instagram', 2),
  ('facebook',  2),
  ('telegram',  1),
  ('widget',    2),
  ('concierge', 0)
ON CONFLICT (platform) DO NOTHING;

-- Allow service role full access; authenticated users read-only
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin can manage platform_settings"
  ON public.platform_settings FOR ALL
  USING (true) WITH CHECK (true);
