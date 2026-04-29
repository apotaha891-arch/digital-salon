-- Add stripe_customer_id to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create subscription_plans if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id                    TEXT PRIMARY KEY,          -- e.g. 'starter', 'pro', 'business'
  name                  TEXT NOT NULL,
  name_ar               TEXT,
  price_usd             NUMERIC(10,2) NOT NULL,
  monthly_tokens        INTEGER NOT NULL DEFAULT 0,
  trial_days            INTEGER NOT NULL DEFAULT 0,
  topup_price_per_token NUMERIC(10,4) DEFAULT 0.20,
  stripe_price_id       TEXT,                      -- Stripe Price ID (price_xxx)
  features              TEXT,                      -- JSON array string
  features_ar           TEXT,                      -- JSON array string
  is_active             BOOLEAN NOT NULL DEFAULT true,
  sort_order            INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Add stripe_price_id if table already existed without it
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Seed default plans (upsert so it's idempotent)
INSERT INTO public.subscription_plans
  (id, name, name_ar, price_usd, monthly_tokens, trial_days, topup_price_per_token, features, features_ar, is_active, sort_order)
VALUES
  ('starter',  'Starter',  'المبتدئ',  29,  200, 14, 0.20,
    '["14-day free trial","200 AI tokens/mo","Rollover tokens","All channels","Bookings","CRM","Email support"]',
    '["تجربة مجانية 14 يوم","200 رسالة/شهر","ترحيل الرسائل","جميع القنوات","حجوزات","إدارة عملاء","دعم بالإيميل"]',
    true, 1),
  ('pro',      'Pro',      'الاحترافي', 49,  400, 14, 0.15,
    '["14-day free trial","400 AI tokens/mo","Rollover tokens","All channels","Advanced bookings","CRM","Priority support","Analytics"]',
    '["تجربة مجانية 14 يوم","400 رسالة/شهر","ترحيل الرسائل","جميع القنوات","حجوزات متقدمة","إدارة عملاء","دعم أولوية","تحليلات"]',
    true, 2),
  ('business', 'Business', 'الأعمال',  100, 400, 14, 0.10,
    '["14-day free trial","400 AI tokens/mo","All channels","Online payments","Stripe payouts","Priority support","Analytics","Custom AI"]',
    '["تجربة مجانية 14 يوم","400 رسالة/شهر","جميع القنوات","دفع إلكتروني","تحويلات Stripe","دعم أولوية","تحليلات","AI مخصص"]',
    true, 3)
ON CONFLICT (id) DO NOTHING;

-- RLS for subscription_plans (public read, no write from client)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read plans" ON public.subscription_plans;
CREATE POLICY "Anyone can read plans" ON public.subscription_plans
  FOR SELECT USING (true);
