const GRAPH_URL = 'https://graph.facebook.com/v21.0'
const TOKEN = process.env.PAGE_ACCESS_TOKEN

/**
 * Send a text message via Facebook Messenger.
 * @param {string} recipientId  - PSID of the recipient
 * @param {string} text         - Message text
 */
export async function sendFacebookMessage(recipientId, text) {
  const url = `${GRAPH_URL}/me/messages`

  const body = {
    recipient: { id: recipientId },
    message: { text },
    messaging_type: 'RESPONSE',
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
    console.error('[FACEBOOK SEND ERROR]', JSON.stringify(data))
  } else {
    console.log(`[FACEBOOK] Sent to ${recipientId}: "${text}"`)
  }

  return data
}
