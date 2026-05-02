import { supabase } from './supabase';

export const getTickets = async (userId) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createTicket = async (userId, { clientName, clientPhone, subject, message }) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      user_id: userId,
      client_name: clientName,
      client_phone: clientPhone,
      subject,
      message,
      status: 'open',
      channel: 'manual',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
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
