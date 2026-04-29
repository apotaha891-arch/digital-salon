-- ── Subscriptions table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id                 TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'active', -- active | trialing | past_due | cancelled
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

-- Add plan_id to wallets if missing
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS plan_id TEXT;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT false;

-- ── refill_monthly_tokens ─────────────────────────────────────────────────────
-- Adds tokens to wallet balance (rollover — does not reset)
CREATE OR REPLACE FUNCTION public.refill_monthly_tokens(
  p_user_id UUID,
  p_tokens  INT,
  p_plan_name TEXT DEFAULT 'Plan'
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Upsert wallet
  INSERT INTO public.wallets (user_id, balance)
    VALUES (p_user_id, p_tokens)
  ON CONFLICT (user_id)
    DO UPDATE SET
      balance    = public.wallets.balance + p_tokens,
      is_frozen  = false,
      updated_at = now();

  -- Log in ledger
  INSERT INTO public.wallet_ledger (user_id, amount, reason)
    VALUES (p_user_id, p_tokens, p_plan_name || ' token refill');
END;
$$;

-- ── freeze_user_tokens ────────────────────────────────────────────────────────
-- Marks wallet as frozen so agent stops responding (tokens preserved)
CREATE OR REPLACE FUNCTION public.freeze_user_tokens(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.wallets
    SET is_frozen  = true,
        updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- ── unfreeze_user_tokens ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unfreeze_user_tokens(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.wallets
    SET is_frozen  = false,
        updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Grant execute to service role (used by edge functions)
GRANT EXECUTE ON FUNCTION public.refill_monthly_tokens(UUID, INT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.freeze_user_tokens(UUID)               TO service_role;
GRANT EXECUTE ON FUNCTION public.unfreeze_user_tokens(UUID)             TO service_role;
