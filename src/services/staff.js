import { supabase } from './supabase';

export const getStaff = async (userId) => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const createStaffMember = async (userId, staffData) => {
  const { data, error } = await supabase
    .from('staff')
    .insert({ user_id: userId, ...staffData, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateStaffMember = async (id, staffData) => {
  const { data, error } = await supabase
    .from('staff')
    .update({ ...staffData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteStaffMember = async (id) => {
  const { error } = await supabase.from('staff').delete().eq('id', id);
  if (error) throw error;
};
