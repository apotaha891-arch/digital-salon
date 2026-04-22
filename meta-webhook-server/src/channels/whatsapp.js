const GRAPH_URL = 'https://graph.facebook.com/v21.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const TOKEN = process.env.WHATSAPP_TOKEN

/**
 * Send a text message via WhatsApp Business Cloud API.
 * @param {string} to   - Recipient phone number in E.164 format (e.g. "201012345678")
 * @param {string} text - Message text
 */
export async function sendWhatsAppMessage(to, text) {
  const url = `${GRAPH_URL}/${PHONE_NUMBER_ID}/messages`

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body: text },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('[WHATSAPP SEND ERROR]', JSON.stringify(data))
  } else {
    console.log(`[WHATSAPP] Sent to ${to}: "${text}"`)
  }

  return data
}
