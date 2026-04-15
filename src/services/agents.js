import { supabase } from './supabase';

export const getAgent = async (userId) => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const upsertAgent = async (userId, agentData) => {
  const { data, error } = await supabase
    .from('agents')
    .upsert({ user_id: userId, ...agentData, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const toggleAgent = async (agentId, isActive) => {
  const { data, error } = await supabase
    .from('agents')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', agentId)
    .select()
    .single();
  if (error) throw error;
  return data;
};
