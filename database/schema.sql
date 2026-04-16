-- ============================================
-- Digital Salon - Database Schema V3.0 (Clean)
-- ============================================
-- Run this in your Supabase SQL Editor.
-- It is safe to run multiple times (idempotent).
-- ============================================


-- ============================================
-- 1. PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  role        TEXT DEFAULT 'client', -- 'client' | 'admin'
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Helper function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow admins to read all profiles
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());


-- ============================================
-- 2. BUSINESSES
-- ============================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name        TEXT,
  phone       TEXT,
  location    TEXT,
  hours       TEXT,
  instagram   TEXT,
  services    JSONB DEFAULT '[]', -- Array of {id, name, price, duration}
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own business" ON public.businesses;
CREATE POLICY "Users manage own business" ON public.businesses
  FOR ALL USING (auth.uid() = user_id);


-- ============================================
-- 3. AGENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.agents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name             TEXT DEFAULT 'لين',
  avatar           TEXT DEFAULT '💅',
  instructions     TEXT DEFAULT '',
  is_active        BOOLEAN DEFAULT false,
  model_provider   TEXT DEFAULT 'gemini', -- 'openai' | 'gemini'
  messages_today   INT DEFAULT 0,
  bookings_today   INT DEFAULT 0,
  total_messages   INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own agent" ON public.agents;
CREATE POLICY "Users manage own agent" ON public.agents
  FOR ALL USING (auth.uid() = user_id);


-- ============================================
-- 4. WALLETS & LEDGER
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance     INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own wallet" ON public.wallets;
CREATE POLICY "Users view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      INT NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own ledger" ON public.wallet_ledger;
CREATE POLICY "Users view own ledger" ON public.wallet_ledger
  FOR SELECT USING (auth.uid() = user_id);


-- ============================================
-- 5. BOOKINGS (Unified V3 — AI-Actionable)
--    DROP old table first to remove schema conflicts.
-- ============================================
DROP TABLE IF EXISTS public.bookings CASCADE;
CREATE TABLE public.bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Salon owner
  client_name      TEXT NOT NULL,
  client_phone     TEXT,
  service_name     TEXT,
  service_id       TEXT,  -- Optional reference to business.services JSONB item id
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status           TEXT DEFAULT 'pending',   -- 'pending' | 'confirmed' | 'cancelled' | 'completed'
  channel          TEXT DEFAULT 'manual',    -- 'whatsapp' | 'telegram' | 'widget' | 'manual'
  notes            TEXT,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own bookings" ON public.bookings;
CREATE POLICY "Users manage own bookings" ON public.bookings
  FOR ALL USING (auth.uid() = user_id);

-- Index for fast date-range queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_date ON public.bookings(user_id, appointment_date DESC);


-- ============================================
-- 6. TICKETS (Customer Support)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name   TEXT,
  customer_phone  TEXT,
  subject         TEXT,
  message         TEXT,
  status          TEXT DEFAULT 'open',    -- 'open' | 'in_progress' | 'resolved'
  priority        TEXT DEFAULT 'medium', -- 'low' | 'medium' | 'high'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own tickets" ON public.tickets;
CREATE POLICY "Users manage own tickets" ON public.tickets
  FOR ALL USING (auth.uid() = user_id);


-- ============================================
-- 7. INTEGRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.integrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL,  -- 'telegram' | 'whatsapp' | 'widget'
  config      JSONB DEFAULT '{}',
  is_active   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own integrations" ON public.integrations;
CREATE POLICY "Users manage own integrations" ON public.integrations
  FOR ALL USING (auth.uid() = user_id);


-- ============================================
-- 8. CONVERSATIONS & MESSAGES (AI Memory)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Salon owner
  external_id  TEXT NOT NULL,   -- Customer phone number or Telegram chat ID
  platform     TEXT NOT NULL,   -- 'whatsapp' | 'telegram' | 'widget'
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, external_id, platform)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own conversations" ON public.conversations;
CREATE POLICY "Users view own conversations" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL,    -- 'user' | 'assistant' | 'system'
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own messages" ON public.messages;
CREATE POLICY "Users view own messages" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
    )
  );

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_external_id ON public.conversations(user_id, external_id);


-- ============================================
-- 9. TRIGGER: Auto-create profile + wallet on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'client'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create wallet with welcome credits
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 100)
  ON CONFLICT (user_id) DO NOTHING;

  -- Log welcome credits in ledger
  INSERT INTO public.wallet_ledger (user_id, amount, reason)
  VALUES (NEW.id, 100, 'الرصيد المجاني للترحيب 🎁');

  -- Create default agent (Gemini is default — cheaper + no card needed)
  INSERT INTO public.agents (user_id, name, avatar, model_provider)
  VALUES (NEW.id, 'لين', '💅', 'gemini')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- 10. ADMIN FUNCTIONS
-- ============================================

-- Get all clients with wallet & agent info
CREATE OR REPLACE FUNCTION public.admin_get_all_clients()
RETURNS TABLE (
  id             UUID,
  email          TEXT,
  full_name      TEXT,
  is_active      BOOLEAN,
  wallet_balance INT,
  agent_name     TEXT,
  agent_active   BOOLEAN,
  created_at     TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.is_active,
    COALESCE(w.balance, 0),
    a.name,
    a.is_active,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.wallets w ON w.user_id = p.id
  LEFT JOIN public.agents a ON a.user_id = p.id
  WHERE p.role = 'client'
  ORDER BY p.created_at DESC;
END;$$;

-- Add credits to a user
CREATE OR REPLACE FUNCTION public.admin_add_credits(
  p_user_id UUID,
  p_amount  INT,
  p_reason  TEXT DEFAULT 'شحن رصيد من الإدارة'
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = wallets.balance + p_amount,
        updated_at = NOW();

  INSERT INTO public.wallet_ledger (user_id, amount, reason)
  VALUES (p_user_id, p_amount, p_reason);
END;$$;

-- Check if wallet has sufficient funds
CREATE OR REPLACE FUNCTION public.check_wallet_balance(p_user_id UUID, p_required INT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.wallets 
    WHERE user_id = p_user_id AND balance >= p_required
  );
END;$$;

-- Deduct tokens for AI message
CREATE OR REPLACE FUNCTION public.deduct_tokens(p_user_id UUID, p_amount INT, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.wallets 
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_ledger (user_id, amount, reason)
  VALUES (p_user_id, -p_amount, p_reason);
END;$$;


-- ============================================
-- 11. AI CORE FUNCTIONS
-- ============================================

-- Get full agent context for the messenger Edge Function
CREATE OR REPLACE FUNCTION public.get_agent_full_context(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_context JSONB;
BEGIN
  SELECT jsonb_build_object(
    'agent',    (SELECT to_jsonb(a) FROM public.agents    a WHERE a.user_id = p_user_id),
    'business', (SELECT to_jsonb(b) FROM public.businesses b WHERE b.user_id = p_user_id),
    'services', (SELECT b.services  FROM public.businesses b WHERE b.user_id = p_user_id)
  ) INTO v_context;
  RETURN v_context;
END;$$;

-- Create a booking (called by the AI agent)
CREATE OR REPLACE FUNCTION public.create_booking(
  p_salon_id    UUID,
  p_client_name TEXT,
  p_client_phone TEXT,
  p_service_name TEXT,
  p_date        DATE,
  p_time        TIME,
  p_channel     TEXT DEFAULT 'whatsapp'
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  INSERT INTO public.bookings (
    user_id, client_name, client_phone, service_name,
    appointment_date, appointment_time, channel
  )
  VALUES (
    p_salon_id, p_client_name, p_client_phone, p_service_name,
    p_date, p_time, p_channel
  )
  RETURNING id INTO v_booking_id;

  -- Increment agent daily bookings counter
  UPDATE public.agents
  SET bookings_today = bookings_today + 1,
      updated_at = NOW()
  WHERE user_id = p_salon_id;

  RETURN v_booking_id;
END;$$;

-- Check availability for a specific date and time
CREATE OR REPLACE FUNCTION public.check_availability(
  p_salon_id UUID,
  p_date     DATE,
  p_time     TIME
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE user_id = p_salon_id
      AND appointment_date = p_date
      AND appointment_time = p_time
  );
END;$$;

-- Get all bookings for a day (for the agent to see slots)
CREATE OR REPLACE FUNCTION public.get_day_bookings(
  p_salon_id UUID,
  p_date     DATE
)
RETURNS TABLE (appointment_time TIME, service_name TEXT) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT b.appointment_time, b.service_name
  FROM public.bookings b
  WHERE b.user_id = p_salon_id
    AND b.appointment_date = p_date
  ORDER BY b.appointment_time;
END;$$;

-- Get recent conversation history for AI context window
CREATE OR REPLACE FUNCTION public.get_conversation_history(
  p_user_id    UUID,
  p_external_id TEXT,
  p_platform   TEXT,
  p_limit      INT DEFAULT 20
)
RETURNS TABLE (role TEXT, content TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT m.role, m.content, m.created_at
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE c.user_id = p_user_id
    AND c.external_id = p_external_id
    AND c.platform = p_platform
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;$$;


-- ============================================
-- 12. GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.admin_get_all_clients()                              TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_credits(UUID, INT, TEXT)                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_full_context(UUID)                         TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, TEXT, TEXT, TEXT, DATE, TIME, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_history(UUID, TEXT, TEXT, INT)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_availability(UUID, DATE, TIME)                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_day_bookings(UUID, DATE)                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_wallet_balance(UUID, INT)                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_tokens(UUID, INT, TEXT)                      TO authenticated;
