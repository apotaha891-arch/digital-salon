import { supabase } from './supabase';

const LEAD_SELECT = `
  *,
  assignee:profiles!sales_leads_assigned_to_fkey(id, full_name, email),
  activities:sales_activities(*, performer:profiles!sales_activities_performed_by_fkey(id, full_name)),
  tasks:sales_tasks(*, assignee:profiles!sales_tasks_assigned_to_fkey(id, full_name))
`;

export const getLeads = async () => {
  const { data, error } = await supabase
    .from('sales_leads')
    .select(LEAD_SELECT)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Returns the existing lead if the Instagram handle is already in the system, null otherwise.
export const findDuplicateByHandle = async (handle) => {
  if (!handle?.trim()) return null;
  const normalized = handle.trim().replace(/^@/, '').toLowerCase();
  const { data } = await supabase
    .from('sales_leads')
    .select('id, salon_name, status, instagram_handle')
    .ilike('instagram_handle', normalized)
    .maybeSingle();
  return data || null;
};

export const createLead = async (lead) => {
  const { data, error } = await supabase
    .from('sales_leads')
    .insert(lead)
    .select(LEAD_SELECT)
    .single();
  if (error) throw error;
  return data;
};

export const updateLead = async (id, updates) => {
  const { data, error } = await supabase
    .from('sales_leads')
    .update(updates)
    .eq('id', id)
    .select(LEAD_SELECT)
    .single();
  if (error) throw error;
  return data;
};

export const deleteLead = async (id) => {
  const { error } = await supabase.from('sales_leads').delete().eq('id', id);
  if (error) throw error;
};

// ─── Activities ──────────────────────────────────────────────────────────────
export const addActivity = async (activity) => {
  const { data, error } = await supabase
    .from('sales_activities')
    .insert(activity)
    .select('*, performer:profiles!sales_activities_performed_by_fkey(id, full_name)')
    .single();
  if (error) throw error;
  return data;
};

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const addTask = async (task) => {
  const { data, error } = await supabase
    .from('sales_tasks')
    .insert(task)
    .select('*, assignee:profiles!sales_tasks_assigned_to_fkey(id, full_name)')
    .single();
  if (error) throw error;
  return data;
};

export const toggleTask = async (id, is_completed) => {
  const { data, error } = await supabase
    .from('sales_tasks')
    .update({ is_completed })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ─── Team members (admin users only) ─────────────────────────────────────────
export const getTeamMembers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'admin');
  if (error) throw error;
  return data || [];
};
