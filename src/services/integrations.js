import { supabase } from './supabase';

export const getIntegrations = async (userId) => {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
};

export const upsertIntegration = async (userId, provider, config) => {
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
