import { supabase } from './supabase';

export const getWallet = async (userId) => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getLedger = async (userId) => {
  const { data, error } = await supabase
    .from('wallet_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// ─── Subscription & Plans ───

export const getSubscription = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, subscription_plans(*)')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getPlans = async () => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data || [];
};

export const getTopupPackages = async (planId) => {
  let query = supabase
    .from('topup_packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  
  if (planId) {
    query = query.eq('plan_id', planId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

// ─── Stripe Checkout ───

export const createCheckoutSession = async (type, params) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ type, ...params }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Checkout failed');
  }

  return res.json();
};

export const openCustomerPortal = async (userId) => {
  const result = await createCheckoutSession('portal', { user_id: userId });
  if (result.url) {
    window.location.href = result.url;
  }
};
