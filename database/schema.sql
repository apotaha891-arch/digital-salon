-- ============================================
-- Digital Salon - Database Schema V2.2 (With Tickets)
-- ============================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'client', 
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- 2. BUSINESSES
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT,
  phone TEXT,
  location TEXT,
  hours TEXT,
  instagram TEXT,
  services TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own business" ON public.businesses;
CREATE POLICY "Users manage own business" ON public.businesses FOR ALL USING (auth.uid() = user_id);

-- 3. AGENTS
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT DEFAULT 'لين',
  avatar TEXT DEFAULT '💅',
  is_active BOOLEAN DEFAULT false,
  messages_today INT DEFAULT 0,
  bookings_today INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  model_provider TEXT DEFAULT 'openai', -- 'openai' or 'gemini'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own agent" ON public.agents;
CREATE POLICY "Users manage own agent" ON public.agents FOR ALL USING (auth.uid() = user_id);

-- 4. WALLETS & LEDGER
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own wallet" ON public.wallets;
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason TEXT, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own ledger" ON public.wallet_ledger;
CREATE POLICY "Users view own ledger" ON public.wallet_ledger FOR SELECT USING (auth.uid() = user_id);

-- 5. BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  service_requested TEXT,
  booking_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', 
  channel TEXT, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own bookings" ON public.bookings;
CREATE POLICY "Users manage own bookings" ON public.bookings FOR ALL USING (auth.uid() = user_id);

-- 6. TICKETS (Customer Support for Salon Clients)
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own tickets" ON public.tickets;
CREATE POLICY "Users manage own tickets" ON public.tickets FOR ALL USING (auth.uid() = user_id);

-- 7. INTEGRATIONS
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own integrations" ON public.integrations;
CREATE POLICY "Users manage own integrations" ON public.integrations FOR ALL USING (auth.uid() = user_id);

-- 8. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', ''), 'client')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 100)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.wallet_ledger (user_id, amount, reason)
  VALUES (new.id, 100, 'الرصيد المجاني للترحيب')
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. ADMIN FUNCTIONS
CREATE OR REPLACE FUNCTION public.admin_get_all_clients()
RETURNS TABLE (
  id UUID, email TEXT, full_name TEXT,
  is_active BOOLEAN, wallet_balance INT,
  agent_name TEXT, agent_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.email, p.full_name, p.is_active,
    COALESCE(w.balance, 0),
    a.name, a.is_active,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.wallets w ON w.user_id = p.id
  LEFT JOIN public.agents a ON a.user_id = p.id
  WHERE p.role = 'client'
  ORDER BY p.created_at DESC;
END;$$;

CREATE OR REPLACE FUNCTION public.admin_add_credits(p_user_id UUID, p_amount INT, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = wallets.balance + p_amount, updated_at = NOW();

  INSERT INTO public.wallet_ledger (user_id, amount, reason)
  VALUES (p_user_id, p_amount, p_reason);
END;$$;

-- 10. CONVERSATIONS & MESSAGES (The Memory of the Soul)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- Phone number or Telegram Chat ID
  platform TEXT NOT NULL, -- 'whatsapp', 'telegram', 'widget'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, external_id, platform)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own conversations" ON public.conversations;
CREATE POLICY "Users view own conversations" ON public.conversations FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own messages" ON public.messages;
CREATE POLICY "Users view own messages" ON public.messages FOR ALL 
USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()));

-- Index for performance in context fetching
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_conversations_external_id ON public.conversations(external_id);

-- 11. BOOKINGS (Actionable Soul)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Salon Owner
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_name TEXT,
  client_phone TEXT,
  service_id TEXT, -- ID from business.services JSONB
  service_name TEXT,
  appointment_date DATE,
  appointment_time TIME,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own bookings" ON public.bookings;
CREATE POLICY "Users manage own bookings" ON public.bookings FOR ALL USING (auth.uid() = user_id);

-- 12. AI CORE FUNCTIONS (The Actual Soul)
CREATE OR REPLACE FUNCTION public.get_agent_full_context(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_context JSONB;
BEGIN
  SELECT jsonb_build_object(
    'agent', (SELECT to_jsonb(a) FROM public.agents a WHERE a.user_id = p_user_id),
    'business', (SELECT to_jsonb(b) FROM public.businesses b WHERE b.user_id = p_user_id),
    'services', (SELECT to_jsonb(b.services) FROM public.businesses b WHERE b.user_id = p_user_id)
  ) INTO v_context;
  RETURN v_context;
END;$$;

CREATE OR REPLACE FUNCTION public.create_booking(
  p_salon_id UUID,
  p_client_name TEXT,
  p_client_phone TEXT,
  p_service_name TEXT,
  p_date DATE,
  p_time TIME
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  INSERT INTO public.bookings (user_id, client_name, client_phone, service_name, appointment_date, appointment_time)
  VALUES (p_salon_id, p_client_name, p_client_phone, p_service_name, p_date, p_time)
  RETURNING id INTO v_booking_id;
  
  -- Update agent statistics
  UPDATE public.agents SET bookings_today = bookings_today + 1 WHERE user_id = p_salon_id;
  
  RETURN v_booking_id;
END;$$;

GRANT EXECUTE ON FUNCTION public.admin_get_all_clients() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_credits(UUID, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_full_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, TEXT, TEXT, TEXT, DATE, TIME) TO authenticated;
