import 'dotenv/config'
import express from 'express'
import { webhookRouter } from './webhook.js'

const app = express()
const PORT = process.env.PORT || 3000

// Raw body needed for HMAC signature verification — must come before json()
app.use('/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())

app.use('/webhook', webhookRouter)

app.get('/', (_req, res) => {
  res.json({ status: 'Meta Webhook Server running' })
})

app.listen(PORT, () => {
  console.log(`[SERVER] Listening on http://localhost:${PORT}`)
  console.log(`[SERVER] Webhook URL: http://localhost:${PORT}/webhook`)
})
