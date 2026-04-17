-- ============================================
-- Add Customers Table (CRM) for Salon
-- ============================================

CREATE TABLE IF NOT EXISTS public.customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Salon owner
  full_name       TEXT,
  phone           TEXT,
  external_id     TEXT NOT NULL, -- Telegram chat ID or WhatsApp number
  platform        TEXT NOT NULL, -- 'telegram' | 'whatsapp'
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, external_id, platform)
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own customers
DROP POLICY IF EXISTS "Owners manage own customers" ON public.customers;
CREATE POLICY "Owners manage own customers" ON public.customers
  FOR ALL USING (auth.uid() = user_id);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_customers_external_id ON public.customers(user_id, external_id);
