-- ════════════════════════════════════════════════════════════════
-- DIGITAL SALON — MASTER MIGRATION (Safe to run multiple times)
-- Run this entire file in Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- ── 1. STRIPE: stripe_customer_id on profiles ────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- ── 2. SUBSCRIPTION PLANS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  name_ar               TEXT,
  price_usd             NUMERIC(10,2) NOT NULL,
  monthly_tokens        INTEGER NOT NULL DEFAULT 0,
  trial_days            INTEGER NOT NULL DEFAULT 0,
  topup_price_per_token NUMERIC(10,4) DEFAULT 0.20,
  stripe_price_id       TEXT,
  features              TEXT,
  features_ar           TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  sort_order            INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read plans" ON public.subscription_plans;
CREATE POLICY "Anyone can read plans" ON public.subscription_plans
  FOR SELECT USING (true);

INSERT INTO public.subscription_plans
  (id, name, name_ar, price_usd, monthly_tokens, trial_days, topup_price_per_token, features, features_ar, is_active, sort_order)
VALUES
  ('starter','Starter','المبتدئ',29,200,14,0.20,
    '["14-day free trial","200 AI tokens/mo","Rollover tokens","All channels","Bookings","CRM","Email support"]',
    '["تجربة مجانية 14 يوم","200 رسالة/شهر","ترحيل الرسائل","جميع القنوات","حجوزات","إدارة عملاء","دعم بالإيميل"]',
    true,1),
  ('pro','Pro','الاحترافي',49,400,14,0.15,
    '["14-day free trial","400 AI tokens/mo","Rollover tokens","All channels","Advanced bookings","CRM","Priority support","Analytics"]',
    '["تجربة مجانية 14 يوم","400 رسالة/شهر","ترحيل الرسائل","جميع القنوات","حجوزات متقدمة","إدارة عملاء","دعم أولوية","تحليلات"]',
    true,2),
  ('business','Business','الأعمال',100,400,14,0.10,
    '["14-day free trial","400 AI tokens/mo","All channels","Online payments","Stripe payouts","Priority support","Analytics","Custom AI"]',
    '["تجربة مجانية 14 يوم","400 رسالة/شهر","جميع القنوات","دفع إلكتروني","تحويلات Stripe","دعم أولوية","تحليلات","AI مخصص"]',
    true,3)
ON CONFLICT (id) DO NOTHING;

-- ── 3. SUBSCRIPTIONS TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id                 TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id  TEXT,
  stripe_customer_id      TEXT,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  trial_ends_at           TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own subscription" ON public.subscriptions;
CREATE POLICY "Users view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.subscriptions;
CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- ── 4. WALLET: add missing columns ──────────────────────────────
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS plan_id TEXT;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT false;

-- ── 5. TOKEN FUNCTIONS ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.refill_monthly_tokens(
  p_user_id   UUID,
  p_tokens    INT,
  p_plan_name TEXT DEFAULT 'Plan'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
    VALUES (p_user_id, p_tokens)
  ON CONFLICT (user_id) DO UPDATE SET
    balance    = public.wallets.balance + p_tokens,
    is_frozen  = false,
    updated_at = now();
  INSERT INTO public.wallet_ledger (user_id, amount, reason)
    VALUES (p_user_id, p_tokens, p_plan_name || ' token refill');
END;$$;

CREATE OR REPLACE FUNCTION public.freeze_user_tokens(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.wallets SET is_frozen = true, updated_at = now()
  WHERE user_id = p_user_id;
END;$$;

CREATE OR REPLACE FUNCTION public.unfreeze_user_tokens(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.wallets SET is_frozen = false, updated_at = now()
  WHERE user_id = p_user_id;
END;$$;

GRANT EXECUTE ON FUNCTION public.refill_monthly_tokens(UUID, INT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.freeze_user_tokens(UUID)               TO service_role;
GRANT EXECUTE ON FUNCTION public.unfreeze_user_tokens(UUID)             TO service_role;

-- ── 6. TOPUP PACKAGES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.topup_packages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tokens     INTEGER NOT NULL,
  price_usd  NUMERIC(10,2) NOT NULL,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.topup_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active topups" ON public.topup_packages;
CREATE POLICY "Anyone can read active topups" ON public.topup_packages
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins manage topups" ON public.topup_packages;
CREATE POLICY "Admins manage topups" ON public.topup_packages
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO public.topup_packages (tokens, price_usd, is_popular, sort_order)
VALUES (50,10.00,false,1),(100,20.00,true,2),(200,40.00,false,3)
ON CONFLICT DO NOTHING;

-- ── 7. PLATFORM SETTINGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_settings (
  platform   TEXT PRIMARY KEY,
  token_cost INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin can manage platform_settings" ON public.platform_settings;
CREATE POLICY "admin can manage platform_settings" ON public.platform_settings
  FOR ALL USING (true) WITH CHECK (true);
INSERT INTO public.platform_settings (platform, token_cost) VALUES
  ('whatsapp',3),('instagram',2),('facebook',2),
  ('telegram',1),('widget',2),('concierge',0)
ON CONFLICT (platform) DO NOTHING;

-- ── 8. CONCIERGE LEADS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.concierge_leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    TEXT NOT NULL UNIQUE,
  messages      JSONB NOT NULL DEFAULT '[]',
  visitor_name  TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  language      TEXT DEFAULT 'ar',
  is_resolved   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.concierge_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins view concierge leads" ON public.concierge_leads;
CREATE POLICY "admins view concierge leads" ON public.concierge_leads
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "admins update concierge leads" ON public.concierge_leads;
CREATE POLICY "admins update concierge leads" ON public.concierge_leads
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Service inserts concierge leads" ON public.concierge_leads;
CREATE POLICY "Service inserts concierge leads" ON public.concierge_leads
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Service upserts concierge leads" ON public.concierge_leads;
CREATE POLICY "Service upserts concierge leads" ON public.concierge_leads
  FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_concierge_leads_created ON public.concierge_leads(created_at DESC);

-- ── 9. CONTACT SUBMISSIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  subject    TEXT,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert contact" ON public.contact_submissions;
CREATE POLICY "Anyone can insert contact" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read contacts" ON public.contact_submissions;
CREATE POLICY "Admins read contacts" ON public.contact_submissions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 10. BOOKINGS: add missing columns ────────────────────────────
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE INDEX IF NOT EXISTS idx_bookings_reminder
  ON public.bookings (appointment_date, reminder_sent, status, channel)
  WHERE reminder_sent = false;

-- ════════════════════════════════════════════════════════════════
-- DONE. All tables and functions are up to date.
-- ════════════════════════════════════════════════════════════════
