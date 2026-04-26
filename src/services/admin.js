import { supabase } from './supabase';

export const adminGetAllClients = async () => {
  const { data, error } = await supabase.rpc('admin_get_all_clients');
  if (error) throw error;
  return data || [];
};

export const adminAddCredits = async (userId, amount, reason = 'شحن رصيد من الإدارة') => {
  const { data, error } = await supabase.rpc('admin_add_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason
  });
  if (error) throw error;
  return data;
};

export const adminToggleClient = async (userId, isActive) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);
  if (error) throw error;
  return data;
};

// ─── Integration Management (Admin impersonation) ───

export const adminGetClientIntegrations = async (userId) => {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
};

export const adminUpsertIntegration = async (userId, provider, config) => {
  const { data, error } = await supabase
    .from('integrations')
    .upsert({
      user_id: userId,
      provider,
      config,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,provider' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ─── Subscription Plans Management ───

export const adminGetPlans = async () => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data || [];
};

export const adminUpdatePlan = async (planId, updates) => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const adminTogglePlan = async (planId, isActive) => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .update({ is_active: isActive })
    .eq('id', planId);
  if (error) throw error;
  return data;
};

// ─── Platform Token Cost Settings ───

export const adminGetPlatformSettings = async () => {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .order('platform');
  if (error) throw error;
  return data || [];
};

export const adminUpdatePlatformSetting = async (platform, tokenCost) => {
  const { data, error } = await supabase
    .from('platform_settings')
    .update({ token_cost: tokenCost, updated_at: new Date().toISOString() })
    .eq('platform', platform)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ─── Agent/Salon Profile Management ───

export const adminGetClientAgent = async (userId) => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
