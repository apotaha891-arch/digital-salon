import { supabase } from './supabase';

export const getBusiness = async (userId) => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const upsertBusiness = async (userId, businessData) => {
  const { data, error } = await supabase
    .from('businesses')
    .upsert({ user_id: userId, ...businessData, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
};
