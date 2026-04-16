import { serve } from "std/http/server"
import { createClient } from "supabase"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const url = new URL(req.url)
    const token = (url.searchParams.get('token') || '').trim()
    if (!token) throw new Error('Bot token missing in URL')

    const update = await req.json()
    console.log('--- New Telegram Update ---')
    console.log('Update ID:', update.update_id)
    console.log('From:', update.message?.from?.username || 'unknown')

    if (!update.message || !update.message.text) {
      console.log('Skipping: No message text found')
      return new Response('ok') 
    }

    const chatId = update.message.chat.id
    const userMessage = update.message.text
    console.log('Message:', userMessage)

    // 1. Identify Salon Owner
    console.log(`Looking up owner for token starting with: ${token.substring(0, 10)} (Length: ${token.length})`)
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('provider', 'telegram')
      .filter('config->>token', 'eq', token)
      .single()

    if (intError || !integration) {
      console.error('Owner NOT FOUND in database for this token.')
      if (intError) console.error('Database Error:', intError.message)
      throw new Error(`Link between token and user not found (Token Length: ${token.length})`)
    }

    const userId = integration.user_id
    console.log('User ID Identified:', userId)

    // 2. Check Wallet
    console.log('Checking wallet balance for:', userId)
    const { data: hasFunds, error: walletError } = await supabase.rpc('check_wallet_balance', { 
      p_user_id: userId, 
      p_required: 1 
    })

    if (walletError) {
      console.error('Wallet RPC Error:', walletError.message)
      throw new Error(`Database error while checking wallet: ${walletError.message}`)
    }

    if (!hasFunds) {
      console.log('Wallet empty for user:', userId)
      await sendTelegramMessage(token, chatId, "عذراً، الرصيد في حساب الصالون غير كافٍ للرد على استفسارك حالياً. يرجى التواصل مع الإدارة.")
      return new Response('ok')
    }

    // 3. Call Brain (Messenger)
    console.log('Calling AI Brain via Fetch...')
    const messengerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/messenger`
    // deno-lint-ignore no-explicit-any
    const serviceRoleKey = (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    const res = await fetch(messengerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platform: 'telegram',
        external_id: chatId.toString(),
        message: userMessage,
        userId: userId
      })
    })

    console.log(`Brain Response Status: ${res.status}`)

    if (!res.ok) {
      const errText = await res.text()
      console.error('Brain Error:', errText)
      throw new Error(`Messenger error: ${errText}`)
    }

    const brainData = await res.json()
    const aiResponse = brainData.response
    const systemVersion = res.headers.get('X-System-Version')

    console.log(`AI Response Received (Version: ${systemVersion || 'Unknown'}).`)
    console.log('RAW Brain Response:', JSON.stringify(brainData))
    console.log('Extracted AI Response:', aiResponse)

    if (aiResponse) {
      // 4. Send Message back
      await sendTelegramMessage(token, chatId, aiResponse)
      console.log('Message sent back to Telegram.')

      // 5. Deduct token
      await supabase.rpc('deduct_tokens', {
        p_user_id: userId,
        p_amount: 1,
        p_reason: 'رد ذكاء اصطناعي (تيلقرام - Gemini 3)'
      })
      console.log('Token deducted.')
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })

  } catch (error: unknown) {
    console.error('--- Webhook Error ---')
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), { status: 200 })
  }
})

async function sendTelegramMessage(token: string, chatId: number, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  })
  if (!res.ok) {
     const data = await res.json()
     console.error('Telegram API Error:', data)
  }
}
