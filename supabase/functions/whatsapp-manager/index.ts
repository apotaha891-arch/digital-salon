import { serve } from "std/http/server"
import { createClient } from "supabase"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Helper to ensure ALL responses have CORS headers
const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

console.log('WhatsApp Manager Function Started')

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const url = new URL(req.url)
    console.log('[DEBUG] Incoming URL:', req.url)
    const userId = url.searchParams.get('userId')
    const action = url.searchParams.get('action')
    const session = url.searchParams.get('session') || 'default'
    
    // --- Helper for QR Detection ---
    const getQrFromData = (d: any) => d?.qrcode || d?.base64 || d?.qr || d?.code;

    // --- 1. PROXY ACTION HANDLER (Bypasses CORS for the UI) ---
    if (action === 'start-session' && userId) {
      console.log(`[PROXY] Start Session: user=${userId}, session=${session}`)
      const { data: itg } = await supabase
        .from('integrations')
        .select('config')
        .eq('user_id', userId)
        .eq('provider', 'whatsapp')
        .maybeSingle()
        
      if (!itg?.config?.url || !itg?.config?.token) {
        return jsonResponse({ error: 'WhatsApp not configured. Please save settings first.' }, 200)
      }

      const railwayUrl = itg.config.url.trim().replace(/\/$/, '').replace(/\/api$/, '').replace(/\/api-docs$/, '')
      const secretKey = itg.config.token.trim()
      let bearerToken = null
      let lastError = ""
      let data: any = {}
      let serverIdentity = "Unknown"

      // --- DISCOVERY STEP: Identifying Server Version ---
      try {
        const discRes = await fetch(`${railwayUrl}`, { method: 'GET' })
        const discText = await discRes.text()
        const poweredBy = discRes.headers.get('x-powered-by') || discRes.headers.get('server') || 'Express'
        serverIdentity = `Identity: ${poweredBy} | Root Length: ${discText.length}`
        if (discText.includes('WPPConnect')) serverIdentity += ` (Confirmed WPPConnect)`
      } catch (e) {
        serverIdentity = `Discovery Failed: ${(e as any).message}`
      }

      // --- NUCLEAR CLEANUP: Terminate any zombie session first ---
      try {
        console.log(`[PROXY] Nuclear Cleanup: Closing session "${session}"...`)
        await fetch(`${railwayUrl}/api/${session}/logout-session`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/json' }
        })
        await fetch(`${railwayUrl}/api/${session}/close-session`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/json' }
        })
      } catch (_e) { /* ignore cleanup errors */ }

      // --- STRATEGY A (The Core Handshake) ---
      const strategyAUrl = `${railwayUrl}/api/${session}/${encodeURIComponent(secretKey)}/generate-token`;
      try {
        console.log(`[PROXY] Handshake: ${strategyAUrl}`)
        const aRes = await fetch(strategyAUrl, { method: 'POST' })
        const aText = await aRes.text()
        const aData = JSON.parse(aText)
        if (aRes.ok && aData.status === 'success' && aData.token) {
          bearerToken = aData.token
        } else if (aRes.ok && aData.token) {
          // Fallback if status field is missing but token exists
          bearerToken = aData.token
        } else {
          lastError = `Server Rejected Key: ${aData.message || aData.error || aText.substring(0, 50)}`
        }
      } catch (e) {
        lastError = `Network Error: ${(e as any).message}`
      }

      if (!bearerToken) {
        return jsonResponse({ 
          error: `Handshake Failed (Nuclear Mode).`,
          details: `Path: ${strategyAUrl}\nServer: ${serverIdentity}\nReason: ${lastError}` 
        }, 200)
      }

      // --- STEP 2: START SESSION ---
      console.log(`[PROXY] Handshake Success. Deploying ${session}...`)
      try {
        const res = await fetch(`${railwayUrl}/api/${session}/start-session`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ waitQrCode: true })
        })

        const text = await res.text()
        try {
          data = JSON.parse(text)
        } catch (_e) {
          return jsonResponse({ error: `Server Error: Non-JSON response after login.`, details: text.substring(0, 200) }, 200)
        }
        
        if (!res.ok) {
          return jsonResponse({ 
            error: `Session Activation Failed (Status ${res.status}).`,
            details: `Identity: ${serverIdentity}\nServer Message: ${JSON.stringify(data).substring(0, 500)}`
          }, 200)
        }
      } catch (e) {
        return jsonResponse({ error: `Runtime Exception: ${(e as any).message}` }, 200)
      }

      // --- IMPROVEMENT: FALLBACK IF QRCODE MISSING AND NOT CONNECTED ---
      const finalQr = getQrFromData(data);
      if (!finalQr && data.status !== 'CONNECTED') {
        console.log(`[PROXY] QR code missing. Retrying via qrcode-session...`)
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        try {
          const qrRes = await fetch(`${railwayUrl}/api/${session}/qrcode-session`, {
            method: 'GET',
            headers: { 'Authorization': bearerToken !== 'STRATEGY_C_NO_TOKEN' ? `Bearer ${bearerToken}` : '', 'Content-Type': 'application/json' }
          })
          const qrText = await qrRes.text()
          try {
            const qrData = JSON.parse(qrText)
            const foundQr = getQrFromData(qrData);
            if (qrRes.ok && foundQr) {
              data.qrcode = foundQr
            } else {
              return jsonResponse({ 
                error: `Success, but no QR code found (Status: ${data.status}).`,
                details: `Start Body: ${JSON.stringify(data)}\nQR Body: ${qrText.substring(0, 200)}`
              }, 200)
            }
          } catch (_e) {
            return jsonResponse({ error: `QR fetch failed to parse JSON: ${qrText.substring(0, 100)}` }, 200)
          }
        } catch (e) {
          console.log(`[PROXY] Fallback QR exception: ${(e as any).message}`)
        }
      }

      // Final Normalization & Automatic Prefixing
      let qrcode = getQrFromData(data);
      if (qrcode && typeof qrcode === 'string' && !qrcode.startsWith('data:')) {
        qrcode = `data:image/png;base64,${qrcode}`;
      }
      data.qrcode = qrcode;

      return jsonResponse(data)
    }

    // --- 2. WEBHOOK INCOMING MESSAGE HANDLER ---
    // Only parse body if it's not a proxy action and method is POST
    let payload: any = {}
    try {
      payload = await req.json()
    } catch (e) {
      console.log('[PROXY] No JSON body found (expected for proxy calls)')
    }

    console.log('--- WhatsApp Manager Webhook ---', payload?.event || 'No Event')

    // Only handle text messages
    if (payload.event !== 'onmessage' || payload.data?.type !== 'chat') {
      return jsonResponse({ ok: true })
    }

    if (!userId) {
      console.error('Missing userId in webhook URL')
      return jsonResponse({ error: 'Missing userId' }, 400)
    }

    const messageData = payload.data
    const from = messageData.from.split('@')[0]
    const userMessage = messageData.body

    // 1. CRM Sync
    const fullName = messageData.sender?.pushname || 'WhatsApp Customer'
    await supabase.from('customers').upsert({
      user_id: userId, external_id: from, platform: 'whatsapp', full_name: fullName, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,external_id,platform' })

    // 2. Call AI Brain
    const messengerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/messenger`
    const res = await fetch(messengerUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'whatsapp', external_id: from, message: userMessage, userId })
    })

    if (res.ok) {
      const { response: aiResponse } = await res.json()
      if (aiResponse) {
        // 3. Send via WPPConnect
        const { data: config } = await supabase.from('integrations').select('config').eq('user_id', userId).eq('provider', 'whatsapp').single()
        if (config?.config?.url && config?.config?.token) {
          const rUrl = config.config.url.replace(/\/$/, '')
          await fetch(`${rUrl}/api/default/send-message`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${config.config.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: from, message: aiResponse })
          })
          await supabase.rpc('deduct_tokens', { p_user_id: userId, p_amount: 1, p_reason: 'AI Response (WhatsApp)' })
        }
      }
    }

    return jsonResponse({ ok: true })

  } catch (error) {
    console.error('Global Error:', error)
    return jsonResponse({ error: String(error) }, 500)
  }
})
