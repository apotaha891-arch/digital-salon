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
