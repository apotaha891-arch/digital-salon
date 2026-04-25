import { Router } from 'express'
import crypto from 'crypto'
import { sendFacebookMessage } from './channels/facebook.js'
import { sendInstagramMessage } from './channels/instagram.js'
import { sendWhatsAppMessage } from './channels/whatsapp.js'
import { getAutoReply } from './autoReply.js'
import { createTicketIfComplaint } from './ticketUtils.js'

export const webhookRouter = Router()

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN
const APP_SECRET = process.env.META_APP_SECRET

// ── GET /webhook  (Meta verification handshake) ──────────────────────────────
webhookRouter.get('/', (req, res) => {
  const mode      = req.query['hub.mode']
  const token     = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WEBHOOK] Verified by Meta.')
    return res.status(200).send(challenge)
  }

  console.warn('[WEBHOOK] Verification failed — token mismatch.')
  return res.sendStatus(403)
})

// ── POST /webhook  (incoming messages) ───────────────────────────────────────
webhookRouter.post('/', async (req, res) => {
  // Immediately acknowledge receipt — Meta requires 200 within 20 s
  res.sendStatus(200)

  try {
    // HMAC signature check (only when APP_SECRET is configured)
    if (APP_SECRET) {
      const signature = req.headers['x-hub-signature-256']
      if (!signature || !verifySignature(req.body, signature)) {
        console.error('[WEBHOOK] Invalid HMAC signature — request ignored.')
        return
      }
    }

    const payload = JSON.parse(req.body.toString())
    console.log('[WEBHOOK] Payload received:', JSON.stringify(payload, null, 2))

    switch (payload.object) {
      case 'page':
        await handleFacebook(payload)
        break
      case 'instagram':
        await handleInstagram(payload)
        break
      case 'whatsapp_business_account':
        await handleWhatsApp(payload)
        break
      default:
        console.log('[WEBHOOK] Unknown object type:', payload.object)
    }
  } catch (err) {
    console.error('[WEBHOOK] Processing error:', err.message)
  }
})

// ── Channel handlers ──────────────────────────────────────────────────────────

async function handleFacebook(payload) {
  for (const entry of payload.entry || []) {
    for (const event of entry.messaging || []) {
      // Skip echo messages sent by the page itself
      if (event.message?.is_echo) continue

      const senderId = event.sender?.id
      const text = event.message?.text

      if (!senderId || !text) continue

      console.log(`[FACEBOOK] Message from ${senderId}: "${text}"`)

      await createTicketIfComplaint({ channel: 'facebook', customerName: senderId, message: text })
      const reply = getAutoReply('facebook', text)
      await sendFacebookMessage(senderId, reply)
    }
  }
}

async function handleInstagram(payload) {
  for (const entry of payload.entry || []) {
    for (const event of entry.messaging || []) {
      if (event.message?.is_echo) continue

      const senderId = event.sender?.id
      const text = event.message?.text

      if (!senderId || !text) continue

      console.log(`[INSTAGRAM] Message from ${senderId}: "${text}"`)

      await createTicketIfComplaint({ channel: 'instagram', customerName: senderId, message: text })
      const reply = getAutoReply('instagram', text)
      await sendInstagramMessage(senderId, reply)
    }
  }
}

async function handleWhatsApp(payload) {
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value

      for (const message of value?.messages || []) {
        if (message.type !== 'text') continue

        const phone = message.from
        const text  = message.text?.body

        if (!phone || !text) continue

        const name = value.contacts?.[0]?.profile?.name || ''
        console.log(`[WHATSAPP] Message from ${phone} (${name}): "${text}"`)

        await createTicketIfComplaint({ channel: 'whatsapp', customerName: name || phone, message: text })
        const reply = getAutoReply('whatsapp', text)
        await sendWhatsAppMessage(phone, reply)
      }
    }
  }
}

// ── HMAC verification ─────────────────────────────────────────────────────────

function verifySignature(rawBody, signature) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', APP_SECRET)
    .update(rawBody)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}
