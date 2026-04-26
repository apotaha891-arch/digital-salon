// @ts-ignore
import { serve } from 'std/http/server'
// @ts-ignore
import { createClient } from 'supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const EXTRACT_PROMPT = `You are a business data extractor. Given the following text from a salon/beauty business website or document, extract the business information and return it as valid JSON only — no markdown, no explanation.

Extract these fields (use null if not found):
{
  "name": "business name",
  "phone": "phone number",
  "location": "address or city",
  "hours": "working hours as text",
  "instagram": "instagram handle without @",
  "services": [
    { "name": "service name", "price": 0, "duration": 60, "description": "" }
  ]
}

For services: extract name, price (number in local currency, 0 if not found), duration in minutes (60 default), short description.
Return only the JSON object, nothing else.

Text to extract from:
`

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceRoleKey)

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const contentType = req.headers.get('content-type') ?? ''
    let textContent = ''

    // ── URL extraction ──
    if (contentType.includes('application/json')) {
      const { url } = await req.json()
      if (!url) throw new Error('url is required')

      // Strip booking/query params — try the clean base path for better content
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
      const cleanUrl = `${parsed.origin}${parsed.pathname.replace(/\/booking.*/, '')}`
      console.log(`[EXTRACT] Fetching URL: ${cleanUrl}`)

      const fetchPage = async (target: string) => {
        const res = await fetch(target, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(12000),
        })
        const html = await res.text()
        return html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      }

      // Try clean URL first, fall back to original
      let html1 = await fetchPage(cleanUrl)
      if (html1.length < 200 && cleanUrl !== url) {
        html1 = await fetchPage(url)
      }

      // Also include URL slug as a hint for AI extraction
      const slugHint = `URL slug: ${parsed.pathname}\n\n`
      textContent = (slugHint + html1).substring(0, 8000)

    // ── File extraction ──
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) throw new Error('file is required')

      console.log(`[EXTRACT] Processing file: ${file.name} (${file.type})`)
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // For text-based files, decode directly
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        textContent = new TextDecoder().decode(bytes).substring(0, 8000)
      } else {
        // For PDF/Word: send as inline data to Gemini
        const base64 = btoa(String.fromCharCode(...bytes))
        const mimeType = file.type || 'application/pdf'

        const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { text: EXTRACT_PROMPT + '[See attached document]' },
                { inline_data: { mime_type: mimeType, data: base64 } }
              ]
            }]
          })
        })

        const geminiData = await geminiRes.json()
        if (geminiData.error) throw new Error(`Gemini error: ${geminiData.error.message}`)

        const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const cleaned = raw.replace(/```json|```/g, '').trim()
        const extracted = JSON.parse(cleaned)

        return new Response(JSON.stringify({ success: true, data: extracted }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      throw new Error('Unsupported content type')
    }

    // ── Call Gemini with text content ──
    console.log(`[EXTRACT] Sending ${textContent.length} chars to Gemini`)
    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: EXTRACT_PROMPT + textContent }]
        }]
      })
    })

    const geminiData = await geminiRes.json()
    if (geminiData.error) throw new Error(`Gemini error: ${geminiData.error.message}`)

    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const extracted = JSON.parse(cleaned)

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[EXTRACT] Error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
