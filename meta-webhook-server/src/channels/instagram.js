const GRAPH_URL = 'https://graph.facebook.com/v21.0'
const TOKEN = process.env.INSTAGRAM_PAGE_TOKEN

/**
 * Send a text message via Instagram Messaging.
 * The recipient ID is the Instagram-scoped user ID (IGSID).
 * @param {string} recipientId  - Instagram-scoped user ID
 * @param {string} text         - Message text
 */
export async function sendInstagramMessage(recipientId, text) {
  const url = `${GRAPH_URL}/me/messages`

  const body = {
    recipient: { id: recipientId },
    message: { text },
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
    console.error('[INSTAGRAM SEND ERROR]', JSON.stringify(data))
  } else {
    console.log(`[INSTAGRAM] Sent to ${recipientId}: "${text}"`)
  }

  return data
}
