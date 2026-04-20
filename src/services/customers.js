import { supabase } from './supabase';

export const getCustomers = async (userId) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const deleteCustomer = async (id) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const getCustomerMessages = async (userId, externalId, platform) => {
  // 1. Find the conversation ID
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('external_id', externalId)
    .eq('platform', platform)
    .single();

  if (convError || !conv) return [];

  // 2. Fetch all messages for this conversation
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conv.id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};
