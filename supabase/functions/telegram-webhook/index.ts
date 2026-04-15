import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SB_URL') ?? '',
    Deno.env.get('SB_KEY') ?? ''
  )

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    if (!token) throw new Error('Bot token missing in URL')

    const update = await req.json()
    console.log('Received Telegram update:', update)

    // Handle incoming message
    if (!update.message || !update.message.text) {
      return new Response('ok') 
    }

    const chatId = update.message.chat.id
    const userMessage = update.message.text

    // 1. Identify Salon Owner by token
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('provider', 'telegram')
      .filter('config->>token', 'eq', token)
      .single()

    if (intError || !integration) throw new Error('Link between token and user not found in database')

    const userId = integration.user_id

    // 2. Check Wallet Balance (at least 1 token)
    const { data: hasFunds } = await supabase.rpc('check_wallet_balance', { 
      p_user_id: userId, 
      p_required: 1 
    })

    if (!hasFunds) {
      await sendTelegramMessage(token, chatId, "عذراً، الرصيد في حساب الصالون غير كافٍ للرد على استفسارك حالياً. يرجى التواصل مع الإدارة.")
      return new Response('ok')
    }

    // 3. Call Messenger logic (External call to existing Edge Function)
    // We can just call the messenger logic directly by passing the data
    const messengerUrl = `${Deno.env.get('SB_URL')}/functions/v1/messenger`
    const res = await fetch(messengerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SB_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platform: 'telegram',
        external_id: chatId.toString(),
        message: userMessage,
        userId: userId
      })
    })

    const { response: aiResponse } = await res.json()

    if (aiResponse) {
      // 4. Send response back to Telegram
      await sendTelegramMessage(token, chatId, aiResponse)

      // 5. Deduct token
      await supabase.rpc('deduct_tokens', {
        p_user_id: userId,
        p_amount: 1,
        p_reason: 'رد ذكاء اصطناعي (تيلقرام)'
      })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Telegram Webhook Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})

async function sendTelegramMessage(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  })
}
