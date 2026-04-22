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
    const bodyBuffer = await req.arrayBuffer()
    const signature = req.headers.get("x-hub-signature-256")
    
    // HMAC Signature Verification (warn-only — never blocks message processing)
    if (signature) {
      const isValid = await verifyMetaSignature(bodyBuffer, signature)
      if (!isValid) {
        console.warn("[META SECURITY] HMAC mismatch — logging only, continuing.")
      }
    }
    
    const bodyText = new TextDecoder().decode(bodyBuffer)
    const payload = JSON.parse(bodyText)
    
    // [DIAGNOSTIC LOG] Save raw payload to database
    await supabase.from('webhook_logs').insert({ payload })

    console.log("[META] Received Payload:", JSON.stringify(payload))

    // INSTAGRAM & FACEBOOK MESSENGER HANDLER
    if (payload.object === "instagram" || payload.object === "page") {
      const platform = payload.object === "page" ? "facebook" : "instagram";
      
      for (const entry of payload.entry || []) {
        for (const messaging of entry.messaging || []) {
          const externalId = messaging.sender?.id
          let messageText = ""
          
          if (messaging.message && !messaging.message.is_echo) {
            messageText = messaging.message.text
            console.log(`[META] New ${platform.toUpperCase()} Message from ${externalId}: ${messageText}`)
          } else if (messaging.message_edit) {
            messageText = messaging.message_edit.text
            console.log(`[META] ${platform.toUpperCase()} Message EDIT from ${externalId}: ${messageText}`)
          }

          if (externalId && messageText) {
            await routeToBrainAndRespond(platform, externalId, messageText)
          } else {
            console.log(`[META] Skipping ${platform.toUpperCase()} payload (missing sender.id or text). Full object:`, JSON.stringify(messaging))
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
      if (platform === "instagram" || platform === "facebook") {
        await sendMessengerMessage(externalId, aiText, platform)
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

async function sendMessengerMessage(recipientId: string, text: string, platform: string) {
  // Use specific INSTAGRAM_PAGE_TOKEN if it's IG, otherwise fallback correctly to standard PAGE_ACCESS_TOKEN
  const TOKEN = platform === "instagram" 
    ? (Deno.env.get("INSTAGRAM_PAGE_TOKEN") || PAGE_ACCESS_TOKEN) 
    : PAGE_ACCESS_TOKEN;
    
  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${TOKEN}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: text }
    })
  })
  const data = await res.json()
  console.log(`[${platform.toUpperCase()} SEND RESULT]`, JSON.stringify(data))
}

async function sendWhatsAppMessage(recipientId: string, text: string) {
  // Simple text back via WhatsApp Business Cloud API
  const WA_TOKEN = Deno.env.get("WHATSAPP_TOKEN") || PAGE_ACCESS_TOKEN;
  const url = `https://graph.facebook.com/v21.0/${Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")}/messages?access_token=${WA_TOKEN}`
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

// Phase 3 Security: Verify HMAC Signature of the Meta payload
async function verifyMetaSignature(bodyBuffer: ArrayBuffer, signature: string): Promise<boolean> {
  const secret = Deno.env.get("META_APP_SECRET");
  if (!secret) {
    console.error("[META SECURITY] Missing META_APP_SECRET in environment");
    return false;
  }
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, bodyBuffer);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedHash = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const passedHash = signature.replace("sha256=", "").trim();
    
    if (expectedHash !== passedHash) {
      console.error(`[META SECURITY] Check Failed. Expected: ${expectedHash} | Received: ${passedHash}`);
      // Diagnostic log of exact payload length to check for mangling
      console.error(`[META SECURITY] Body length: ${bodyBuffer.byteLength}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[META SECURITY] Error verifying signature:", err);
    return false;
  }
}


