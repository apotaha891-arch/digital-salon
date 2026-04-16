import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    (Deno as any).env.get('SUPABASE_URL') ?? '',
    (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') || (Deno as any).env.get('SR_KEY') || ''
  )

  try {
    // Internal Security Check
    const authHeader = req.headers.get('Authorization')
    const srKey = (Deno as any).env.get('SR_KEY')
    if (authHeader !== `Bearer ${srKey}`) {
      console.error('Unauthorized internal call attempt')
      return new Response('Unauthorized', { status: 401 })
    }

    const { platform, external_id, message, userId } = await req.json()
    if (!platform || !external_id || !message || !userId) {
      throw new Error('Missing fields: platform, external_id, message, userId')
    }

    // 1. Get Agent & Business Context
    const { data: context, error: ctxError } = await supabase.rpc('get_agent_full_context', { p_user_id: userId })
    if (ctxError || !context) throw new Error('Could not load agent context')

    const agent = context.agent
    const business = context.business
    const services = context.services

    // 2. Load History
    const { data: history } = await supabase.rpc('get_conversation_history', {
      p_user_id: userId,
      p_external_id: external_id,
      p_platform: platform
    })

    // 3. Save User Message
    const { data: conversation } = await supabase
      .from('conversations')
      .upsert({ user_id: userId, external_id, platform }, { onConflict: 'user_id,external_id,platform' })
      .select().single()

    await supabase.from('messages').insert({ conversation_id: conversation.id, role: 'user', content: message })

    // 4. Define Tools (The Agent Handler)
    const tools = [
      {
        function_declarations: [
          {
            name: "get_day_bookings",
            description: "تحقق من جميع الحجوزات الموجودة في يوم معين لمعرفة الأوقات المزدحمة.",
            parameters: {
              type: "object",
              properties: {
                date: { type: "string", description: "التاريخ المطلوب (YYYY-MM-DD)" }
              },
              required: ["date"]
            }
          },
          {
            name: "check_availability",
            description: "تحقق مما إذا كان وقت محدد متاحاً للحجز.",
            parameters: {
              type: "object",
              properties: {
                date: { type: "string", description: "التاريخ (YYYY-MM-DD)" },
                time: { type: "string", description: "الوقت (HH:MM)" }
              },
              required: ["date", "time"]
            }
          },
          {
            name: "create_booking",
            description: "تسجيل حجز جديد في قاعدة البيانات بعد التأكد من توفر الموعد.",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "اسم العميلة" },
                phone: { type: "string", description: "رقم هاتف العميلة" },
                service: { type: "string", description: "اسم الخدمة المطلوبة" },
                date: { type: "string", description: "التاريخ (YYYY-MM-DD)" },
                time: { type: "string", description: "الوقت (HH:MM)" }
              },
              required: ["name", "phone", "service", "date", "time"]
            }
          }
        ]
      }
    ]

    // 5. Build optimized prompt (exclude heavy data like images)
    const { data: rawServices } = await supabase
      .from('services')
      .select('name, price, duration')
      .eq('user_id', userId)
    
    const optimizedServices = (rawServices || []).slice(0, 50) 
    const servicesContext = JSON.stringify(optimizedServices).substring(0, 5000)

    const systemPrompt = `أنتِ "${agent.name}"، موظفة استقبال رقمية محترفة في صالون "${business.name}".
اليوم هو ${new Date().toLocaleDateString('ar-SA')}.
مهمتك: مساعدة العملاء في معرفة الخدمات، الأسعار، وحجز المواعيد.
القواعد:
1. كوني ودودة ومختصرة.
2. قبل تأكيد أي حجز، استخدمي أداة (check_availability) للتأكد من توفر الموعد.
3. إذا طلب العميل خدمة غير موجودة، اقترحي الخدمات المتاحة.

الخدمات المتاحة: ${servicesContext}`

    // 6. Call Gemini 3 with Tool Support
    const aiResponse = await callGeminiDynamic(systemPrompt, history || [], message, tools, userId, supabase)
    console.log('Gemini 3.1 Pro Response:', aiResponse)

    // Save AI Response to history
    await supabase.from('messages').insert({ 
      conversation_id: conversation.id, 
      role: 'assistant', 
      content: aiResponse 
    })

    return new Response(JSON.stringify({ response: aiResponse }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('Messenger Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})

async function callGeminiDynamic(system: string, history: any[], userMessage: string, tools: any, userId: string, supabase: any) {
  const apiKey = (Deno as any).env.get('GEMINI_API_KEY')
  
  // 1. Get Available Models
  let availableModelIds: string[] = []
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    const listData = await listRes.json()
    availableModelIds = (listData.models || []).map((m: any) => m.name)
    console.log('[SCAN] Available Models in your account:', availableModelIds)
  } catch (e) {
    console.log('[SCAN ERROR] Failed to list models:', e)
    availableModelIds = ["models/gemini-1.5-flash"]
  }

  // 2. Prioritize Models (Based on your successful scan)
  const priorityKeywords = [
    'gemini-3.1-pro', 
    'gemini-3-flash', 
    'gemini-2.5-flash', 
    'gemini-2.0-flash', 
    'gemini-pro-latest', 
    'gemini-flash-latest',
    'gemini-1.5-flash'
  ]
  const sortedModels = availableModelIds
    .filter(id => priorityKeywords.some(kw => id.includes(kw)))
    .sort((a, b) => {
      const idxA = priorityKeywords.findIndex(kw => a.includes(kw))
      const idxB = priorityKeywords.findIndex(kw => b.includes(kw))
      return idxA - idxB
    })

  if (sortedModels.length === 0) {
    console.log('[SCAN] No priority models found, falling back to flash-latest')
    sortedModels.push("models/gemini-flash-latest")
  }

  // 3. RETRY LOOP
  for (const modelId of sortedModels) {
    console.log(`[ATTEMPT] Trying model: ${modelId}`)
    try {
      const baseUrl = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent`
      const system_instruction = { parts: [{ text: system }] }
      const chatHistory = history.slice(0, 10).reverse().map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
      const contents = [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }]

      // Check Payload Size
      const payloadSize = JSON.stringify({ contents, system_instruction }).length
      console.log(`[PAYLOAD] Sending ${payloadSize} characters to ${modelId}`)

      const res = await fetch(`${baseUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, tools, system_instruction, tool_config: { function_calling_config: { mode: "AUTO" } } })
      })

      const data = await res.json()
      
      if (data.error) {
        console.log(`[MODEL FAILURE] ${modelId}: ${data.error.status} - ${data.error.message}`)
        if (data.error.message.includes('quota') || data.error.message.includes('not found') || data.error.status === 'PERMISSION_DENIED') {
          continue 
        }
        throw new Error(data.error.message)
      }

      const candidates = data.candidates
      if (!candidates || candidates.length === 0) {
        console.log(`[MODEL FAILURE] ${modelId}: No candidates returned`)
        continue
      }
      
      let message = candidates[0].content
      console.log(`[SUCCESS] Model ${modelId} responded.`)

      // Tool Calling Loop
      if (message.parts[0].functionCall) {
        const fn = message.parts[0].functionCall
        console.log('[TOOL CALL]', fn.name)

        let result = null
        if (fn.name === 'get_day_bookings') {
          const { data } = await supabase.rpc('get_day_bookings', { p_salon_id: userId, p_date: fn.args.date })
          result = data
        } else if (fn.name === 'check_availability') {
          const { data } = await supabase.rpc('check_availability', { p_salon_id: userId, p_date: fn.args.date, p_time: fn.args.time })
          result = { available: data }
        } else if (fn.name === 'create_booking') {
          const { data } = await supabase.rpc('create_booking', {
            p_salon_id: userId, p_client_name: fn.args.name, p_client_phone: fn.args.phone,
            p_service_name: fn.args.service, p_date: fn.args.date, p_time: fn.args.time, p_channel: 'telegram'
          })
          result = { booking_id: data, status: 'success' }
        }

        const secondRes = await fetch(`${baseUrl}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [...contents, message, { role: 'function', parts: [{ function_response: { name: fn.name, response: { content: result } } } as any] }],
            tools, 
            system_instruction 
          })
        })
        const secondData = await secondRes.json()
        return secondData.candidates[0].content.parts[0].text
      }

      return message.parts[0].text
    } catch (err: any) {
      console.log(`[RUNTIME ERROR] ${modelId}:`, err.message)
      continue 
    }
  }

  // If we reach here, all models failed. Return a structured error report.
  return new Response(
    JSON.stringify({ 
      error: "All models failed or reached quota.",
      details: {
        attempted_models: sortedModels,
        last_error: "Check messenger logs for full scan results."
      }
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}
