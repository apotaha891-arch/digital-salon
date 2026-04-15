import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
});

// ==================== AUTH ====================

export const signUp = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// ==================== PROFILE ====================

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ==================== BUSINESS ====================

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

// ==================== AGENT ====================

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

// ==================== WALLET & LEDGER ====================

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

// ==================== BOOKINGS ====================

export const getBookings = async (userId, filters = {}) => {
  let query = supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.date)   query = query.eq('appointment_date', filters.date);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const updateBookingStatus = async (bookingId, status) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const createBooking = async (salonId, { clientName, clientPhone, serviceName, date, time, channel = 'manual' }) => {
  const { data, error } = await supabase.rpc('create_booking', {
    p_salon_id:     salonId,
    p_client_name:  clientName,
    p_client_phone: clientPhone,
    p_service_name: serviceName,
    p_date:         date,
    p_time:         time,
    p_channel:      channel,
  });
  if (error) throw error;
  return data;
};

// ==================== TICKETS ====================

export const getTickets = async (userId) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const updateTicketStatus = async (ticketId, status) => {
  const { data, error } = await supabase
    .from('tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ==================== INTEGRATIONS ====================

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

// ==================== ADMIN ====================

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
