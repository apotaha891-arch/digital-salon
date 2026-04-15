import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { record, type } = await req.json()
    console.log('Setup Webhook Triggered:', type, record)

    // Only process inserts or updates for telegram provider
    if (record.provider !== 'telegram') return new Response('Skipped: not telegram')

    const token = record.config?.token
    if (!token) return new Response('Skipped: no token')

    // Construct the webhook URL
    const projectUrl = Deno.env.get('SUPABASE_URL')
    const webhookUrl = `${projectUrl}/functions/v1/telegram-webhook?token=${token}`

    console.log(`Setting up Telegram Webhook for bot: ${token.substring(0, 10)}...`)

    // Call Telegram API
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: webhookUrl,
        allowed_updates: ["message"] 
      })
    })

    const result = await res.json()
    console.log('Telegram API Result:', result)

    if (!result.ok) throw new Error(`Telegram error: ${result.description}`)

    return new Response(JSON.stringify({ ok: true, message: 'Webhook registered successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Setup Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
