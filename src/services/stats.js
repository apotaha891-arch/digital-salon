import { supabase } from './supabase';

const getTodayKSA = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });

export const getDashboardStats = async (userId) => {
  const today    = getTodayKSA();
  const dayStart = `${today}T00:00:00+03:00`;
  const dayEnd   = `${today}T23:59:59+03:00`;

  const [messagesResult, bookingsResult] = await Promise.all([
    supabase
      .from('messages')
      .select('id, conversations!inner(user_id)', { count: 'exact', head: true })
      .eq('conversations.user_id', userId)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd),

    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('appointment_date', today),
  ]);

  return {
    messagesToday: messagesResult.count ?? 0,
    bookingsToday: bookingsResult.count ?? 0,
  };
};
