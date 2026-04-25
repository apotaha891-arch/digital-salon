-- 1. Add reminder_sent and external_id to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS external_id TEXT;

-- 2. Update create_booking to store external_id
CREATE OR REPLACE FUNCTION public.create_booking(
  p_salon_id    UUID,
  p_client_name TEXT,
  p_client_phone TEXT,
  p_service_name TEXT,
  p_date        DATE,
  p_time        TIME,
  p_channel     TEXT DEFAULT 'whatsapp',
  p_external_id TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  INSERT INTO public.bookings (
    user_id, client_name, client_phone, service_name,
    appointment_date, appointment_time, channel, external_id
  )
  VALUES (
    p_salon_id, p_client_name, p_client_phone, p_service_name,
    p_date, p_time, p_channel, p_external_id
  )
  RETURNING id INTO v_booking_id;

  IF p_external_id IS NOT NULL THEN
    UPDATE public.customers
    SET full_name = p_client_name,
        phone = p_client_phone,
        updated_at = NOW()
    WHERE user_id = p_salon_id
      AND external_id = p_external_id
      AND platform = p_channel;
  END IF;

  UPDATE public.agents
  SET bookings_today = bookings_today + 1,
      updated_at = NOW()
  WHERE user_id = p_salon_id;

  RETURN v_booking_id;
END;$$;

-- 3. Index for fast daily reminder queries (correct column names)
CREATE INDEX IF NOT EXISTS idx_bookings_reminder
  ON public.bookings (appointment_date, reminder_sent, status, channel)
  WHERE reminder_sent = false;

-- 4. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 5. Schedule daily reminders at 8:00 AM UTC
--    IMPORTANT: Replace YOUR_SERVICE_ROLE_KEY with your actual key from:
--    Supabase Dashboard > Settings > API > service_role (secret)
SELECT cron.schedule(
  'send-booking-reminders',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://fnswcmzydxtibqoicgng.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body    := '{}'::jsonb
  );
  $$
);
