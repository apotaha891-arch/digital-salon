// @ts-ignore: Deno standard library import
import { serve } from 'std/http/server'
// @ts-ignore: Supabase client ESM import
import { createClient } from 'supabase'

interface Booking {
  id: string
  user_id: string
  external_id: string | null
  client_name: string
  client_phone: string | null
  service_name: string
  appointment_date: string
  appointment_time: string
  channel: string
}

interface Integration {
  config: {
    token?: string
    page_token?: string
    page_id?: string
    phone_id?: string
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')

  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    serviceRoleKey ?? ''
  )

  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, user_id, external_id, client_name, client_phone, service_name, appointment_date, appointment_time, channel')
      .eq('appointment_date', tomorrowStr)
      .eq('reminder_sent', false)
      .in('status', ['confirmed', 'pending'])
      .in('channel', ['whatsapp', 'instagram', 'facebook'])

    if (bookingsError) throw bookingsError

    const total = bookings?.length || 0
    console.log(`[REMINDERS] Found ${total} bookings to remind for ${tomorrowStr}`)

    let sent = 0
    let failed = 0

    for (const booking of (bookings as Booking[]) || []) {
      try {
        // Resolve external_id: use booking's own, or fall back to customers table via phone
        let recipientId = booking.external_id
        if (!recipientId && booking.client_phone) {
          const { data: customer } = await supabase
            .from('customers')
            .select('external_id')
            .eq('user_id', booking.user_id)
            .eq('phone', booking.client_phone)
            .eq('platform', booking.channel)
            .maybeSingle()
          recipientId = customer?.external_id ?? null
        }

        if (!recipientId) {
          console.warn(`[REMINDERS] No external_id for booking ${booking.id} (${booking.client_name})`)
          failed++
          continue
        }

        const provider = booking.channel === 'whatsapp' ? 'meta_whatsapp' : 'meta_social'

        const { data: integration } = await supabase
          .from('integrations')
          .select('config')
          .eq('user_id', booking.user_id)
          .eq('provider', provider)
          .maybeSingle()

        if (!integration) {
          console.warn(`[REMINDERS] No integration for user ${booking.user_id} on ${booking.channel}`)
          failed++
          continue
        }

        const message = buildReminderMessage(booking)

        if (booking.channel === 'whatsapp') {
          await sendWhatsAppMessage(
            recipientId,
            message,
            (integration as Integration).config.token ?? '',
            (integration as Integration).config.phone_id ?? ''
          )
        } else {
          const token = (integration as Integration).config.page_token || (integration as Integration).config.token || ''
          const pageId = (integration as Integration).config.page_id ?? ''
          await sendMessengerMessage(recipientId, message, token, pageId)
        }

        await supabase
          .from('bookings')
          .update({ reminder_sent: true })
          .eq('id', booking.id)

        console.log(`[REMINDERS] Sent to ${booking.client_name} via ${booking.channel} for ${booking.service_name} at ${booking.appointment_time}`)
        sent++
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[REMINDERS] Failed for booking ${booking.id}:`, msg)
        failed++
      }
    }

    return new Response(
      JSON.stringify({ success: true, date: tomorrowStr, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[REMINDERS] Fatal error:', msg)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildReminderMessage(booking: Booking): string {
  return `مرحباً ${booking.client_name} 👋\n\nتذكير بموعدك غداً:\n📌 الخدمة: ${booking.service_name}\n🕐 الوقت: ${booking.appointment_time}\n📅 التاريخ: ${booking.appointment_date}\n\nنتطلع لرؤيتك! إذا احتجتِ إلى تغيير الموعد، تواصلي معنا.`
}

async function sendWhatsAppMessage(recipientId: string, text: string, token: string, waPhoneId: string) {
  const url = `https://graph.facebook.com/v21.0/${waPhoneId}/messages?access_token=${token}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientId,
      type: 'text',
      text: { body: text }
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(`WhatsApp API: ${JSON.stringify(data.error)}`)
}

async function sendMessengerMessage(recipientId: string, text: string, token: string, pageId: string) {
  const url = `https://graph.facebook.com/v21.0/${pageId}/messages?access_token=${token}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text }
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(`Messenger API: ${JSON.stringify(data.error)}`)
}
