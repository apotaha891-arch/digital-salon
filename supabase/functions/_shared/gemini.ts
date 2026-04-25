import type { ChatMessage, GeminiPart } from './types.ts'

const MODEL_PRIORITY = [
  'gemini-3-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

export const callGemini = async (
  systemPrompt: string,
  history: ChatMessage[],
  message: string,
  maxTokens = 350,
  temperature = 0.7,
): Promise<string> => {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY secret not configured')

  const systemTurn = [
    { role: 'user',  parts: [{ text: `SYSTEM: ${systemPrompt}` }] },
    { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] },
  ]

  const historyTurns = history.slice(-10).map((m: ChatMessage) => ({
    role: m.role === 'bot' || m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: (m.text ?? m.content ?? '').substring(0, 1500) }],
  }))

  const contents = [
    ...systemTurn,
    ...historyTurns,
    { role: 'user', parts: [{ text: message.trim() }] },
  ]

  const body = JSON.stringify({
    contents,
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  })

  let lastError = 'No models tried'

  for (const modelId of MODEL_PRIORITY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`
      const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      const data = await res.json()

      if (data.error) {
        lastError = `[${modelId}] ${data.error.message}`
        console.warn(`[GEMINI] Model ${modelId} error:`, lastError)
        continue
      }

      const reply = data.candidates?.[0]?.content?.parts
        ?.map((p: GeminiPart) => p.text ?? '')
        .join('\n')
        .trim()

      if (!reply) { lastError = `[${modelId}] Empty response`; continue }

      console.log(`[GEMINI] Replied via ${modelId}`)
      return reply
    } catch (err) {
      lastError = `[${modelId}] ${err instanceof Error ? err.message : String(err)}`
      console.error('[GEMINI] Fetch error:', lastError)
    }
  }

  throw new Error(`All Gemini models failed. Last: ${lastError}`)
}
