CREATE TABLE IF NOT EXISTS public.topup_packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tokens      INTEGER NOT NULL,
  price_usd   NUMERIC(10,2) NOT NULL,
  is_popular  BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.topup_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active topups" ON public.topup_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage topups" ON public.topup_packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Default packages
INSERT INTO public.topup_packages (tokens, price_usd, is_popular, sort_order)
VALUES
  (50,  10.00, false, 1),
  (100, 20.00, true,  2),
  (200, 40.00, false, 3)
ON CONFLICT DO NOTHING;
