import { supabase } from './supabase';

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

export const createBooking = async (salonId, { clientName, clientPhone, serviceName, date, time, channel = 'manual', staffId, staffName }) => {
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

  // Attach staff info if provided — ignore error if columns don't exist yet
  if (data && (staffId || staffName)) {
    await supabase
      .from('bookings')
      .update({ staff_id: staffId || null, staff_name: staffName || null })
      .eq('id', data)
      .then(() => {}); // fire-and-forget, never throw
  }

  return data;
};
