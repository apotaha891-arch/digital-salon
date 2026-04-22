import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuration from Environment Variables
const APP_SECRET = Deno.env.get("META_APP_SECRET") || "";
const VERIFY_TOKEN = "ds_meta_v1_secret"; // Matches what we set in Meta Dashboard
const PAGE_ACCESS_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN") || "";
const INSTAGRAM_ACCOUNT_ID = Deno.env.get("INSTAGRAM_BUSINESS_ACCOUNT_ID") || "";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const url = new URL(req.url)

  // 1. HANDLE META VERIFICATION (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode")
    const token = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[META] Webhook Verified.")
      return new Response(challenge, { status: 200 })
    }
    return new Response("Forbidden", { status: 403 })
  }

    // 2. HANDLE INCOMING MESSAGES (POST)
  try {
    const body = await req.text()
    const payload = JSON.parse(body)
    
    // [DIAGNOSTIC LOG] Save raw payload to database
    await supabase.from('webhook_logs').insert({ payload })

    console.log("[META] Received Payload:", JSON.stringify(payload))

    // INSTAGRAM HANDLER
    if (payload.object === "instagram") {
      for (const entry of payload.entry || []) {
        for (const messaging of entry.messaging || []) {
          const externalId = messaging.sender?.id
          let messageText = ""
          
          if (messaging.message && !messaging.message.is_echo) {
            messageText = messaging.message.text
            console.log(`[META] New IG Message from ${externalId}: ${messageText}`)
          } else if (messaging.message_edit) {
            messageText = messaging.message_edit.text
            console.log(`[META] IG Message EDIT from ${externalId}: ${messageText}`)
          }

          if (externalId && messageText) {
            await routeToBrainAndRespond("instagram", externalId, messageText)
          } else {
            console.log(`[META] Skipping IG payload (missing sender.id or text). Full object:`, JSON.stringify(messaging))
          }
        }
      }
    } 
    // DASHBOARD TEST HANDLER (Simplified format)
    else if (payload.field === "messages" && payload.value) {
      console.log("[META] Received simplified Test Payload from Dashboard.")
      const v = payload.value
      const externalId = v.sender?.id
      const messageText = v.message?.text
      const customerName = v.sender?.name || ""

      if (externalId && messageText) {
        console.log(`[META] Test Message from ${externalId}: ${messageText}`)
        await routeToBrainAndRespond("instagram", externalId, messageText, customerName)
      } else {
        console.log(`[META] Test Payload missing ID or Text:`, JSON.stringify(payload))
      }
    }
    // WHATSAPP HANDLER
    else if (payload.object === "whatsapp_business_account") {
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value
          for (const message of value?.messages || []) {
            const externalId = message.from
            const customerName = value.contacts?.[0]?.profile?.name || ""
            const messageText = message.text?.body

            if (externalId && messageText) {
              console.log(`[META] WhatsApp Message from ${externalId} (${customerName}): ${messageText}`)
              await routeToBrainAndRespond("whatsapp", externalId, messageText, customerName)
            } else {
              console.log(`[META] Skipping WhatsApp non-text/empty event from ${externalId}`)
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ status: "success" }), { status: 200 })
  } catch (err) {
    console.error("[META ERROR]", err)
    return new Response("Error", { status: 500 })
  }
})

async function routeToBrainAndRespond(platform: string, externalId: string, messageText: string, customerName = "") {
  console.log(`[META] Routing to Brain: ${platform} | ID: ${externalId} | Msg: ${messageText}`)
  
  try {
    const brainResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/messenger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        platform,
        external_id: externalId,
        message: messageText,
        userId: Deno.env.get('ADMIN_USER_ID'),
        name: customerName
      })
    })

    if (!brainResponse.ok) {
      throw new Error(`Brain response error: ${brainResponse.status} ${await brainResponse.text()}`)
    }

    const brainData = await brainResponse.json()
    const aiText = brainData.response

    if (aiText) {
      console.log(`[META] AI Response obtained: "${aiText}". Sending back to ${platform}...`)
      if (platform === "instagram") {
        await sendInstagramMessage(externalId, aiText)
      } else if (platform === "whatsapp") {
        await sendWhatsAppMessage(externalId, aiText)
      }
    } else {
      console.log(`[META] Brain returned no response text.`)
    }
  } catch (brainErr) {
    console.error(`[META] Brain Error:`, brainErr)
  }
}

async function sendInstagramMessage(recipientId: string, text: string) {
  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: text }
    })
  })
  const data = await res.json()
  console.log("[IG SEND RESULT]", JSON.stringify(data))
}

async function sendWhatsAppMessage(recipientId: string, text: string) {
  // Simple text back via WhatsApp Business Cloud API
  const url = `https://graph.facebook.com/v21.0/${Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")}/messages?access_token=${PAGE_ACCESS_TOKEN}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientId,
      type: "text",
      text: { body: text }
    })
  })
  const data = await res.json()
  console.log("[WA SEND RESULT]", JSON.stringify(data))
}
