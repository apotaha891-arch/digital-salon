// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    // @ts-ignore
    (Deno as any).env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') || (Deno as any).env.get('SR_KEY') || ''
  )

  try {
    // 0. Receipt Log
    console.log('[BRAIN] Message request received.')

    // 1. Internal Security Check
    const authHeader = req.headers.get('Authorization')
    // @ts-ignore
    const serviceRoleKey = (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (authHeader !== `Bearer ${serviceRoleKey}`) {
      console.error('Unauthorized internal call attempt (Key mismatch)')
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

    // 4. Define Tools
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

    // 5. Build optimized prompt
    const servicesContext = JSON.stringify(business.services || []).substring(0, 5000)
    const todayGregorian = new Date().toLocaleDateString('en-GB')

    const systemPrompt = `أنتِ "${agent.name}"، موظفة استقبال رقمية محترفة في صالون "${business.name}".
اليوم هو ${todayGregorian} (ميلادي).
مهمتك: مساعدة العملاء في معرفة الخدمات، الأسعار، وحجز المواعيد.
القواعد:
1. كوني ودودة ومختصرة.
2. قبل تأكيد أي حجز، استخدمي أداة (check_availability) للتأكد من توفر الموعد.
3. إذا طلب العميل خدمة غير موجودة، اقترحي الخدمات المتاحة.
4. استخدمي التاريخ الميلادي دائمًا في ردودك وأدواتك.

الخدمات المتاحة بأسعارها ومدتها:
${servicesContext}`

    // 6. Call AI
    const aiResponse = await callGeminiDynamic(systemPrompt, history || [], message, tools, userId, supabase)
    console.log(`[BRAIN V3.1] Final aiResponse (Type: ${typeof aiResponse}):`, aiResponse)
    
    // Save Response
    await supabase.from('messages').insert({ 
      conversation_id: conversation.id, 
      role: 'assistant', 
      content: aiResponse || '(Empty response)' 
    })

    return new Response(JSON.stringify({ response: aiResponse || '' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-System-Version': 'V3.1-DIAG' } 
    })

  } catch (error: any) {
    console.error('Messenger Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, headers: corsHeaders 
    })
  }
})

async function callGeminiDynamic(system: string, history: any[], userMessage: string, tools: any, userId: string, supabase: any) {
  // @ts-ignore
  const apiKey = (Deno as any).env.get('GEMINI_API_KEY')
  
  let availableModelIds: string[] = []
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    const listData = await listRes.json()
    availableModelIds = (listData.models || []).map((m: any) => m.name)
  } catch (e) {
    availableModelIds = ["models/gemini-1.5-flash"]
  }

  const priorityKeywords = ['gemini-1.5-pro', 'gemini-1.5-flash']
  const sortedModels = availableModelIds
    .filter(id => priorityKeywords.some(kw => id.includes(kw)))
    .sort((a, b) => a.includes('pro') ? -1 : 1)

  if (sortedModels.length === 0) sortedModels.push("models/gemini-1.5-flash")

  for (const modelId of sortedModels) {
    try {
      const baseUrl = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent`
      const system_instruction = { parts: [{ text: system }] }
      const chatHistory = history.slice(0, 10).reverse().map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: (m.content || "").substring(0, 2000) }]
      }))
      const contents = [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }]

      const res = await fetch(`${baseUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents, tools, system_instruction, 
          tool_config: { function_calling_config: { mode: "AUTO" } } 
        })
      })

      const data = await res.json()
      if (data.error) continue
      if (!data.candidates || data.candidates.length === 0) continue
      
      const messageBody = data.candidates[0].content
      const parts = messageBody.parts || []
      
      const functionCallPart = parts.find((p: any) => p.functionCall)
      if (functionCallPart) {
        const fn = functionCallPart.functionCall
        let result = null
        try {
          if (fn.name === 'get_day_bookings') {
            const { data } = await supabase.rpc('get_day_bookings', { p_salon_id: userId, p_date: fn.args.date })
            result = data
          } else if (fn.name === 'check_availability') {
            const { data } = await supabase.rpc('check_availability', { p_salon_id: userId, p_date: fn.args.date, p_time: fn.args.time })
            result = { available: data }
          } else if (fn.name === 'create_booking') {
            const { data } = await supabase.rpc('create_booking', {
              p_salon_id: userId, p_client_name: fn.args.name, p_client_phone: fn.args.phone,
              p_service_name: fn.args.service, p_date: fn.args.date, p_time: fn.args.time, p_channel: 'whatsapp'
            })
            result = { booking_id: data, status: 'success' }
          }
        } catch (dbErr: any) {
          result = { error: "Database error" }
        }

        const secondRes = await fetch(`${baseUrl}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [
              ...contents, messageBody, 
              { role: 'function', parts: [{ functionResponse: { name: fn.name, response: { content: result } } } as any] }
            ],
            tools, system_instruction 
          })
        })
        const secondData = await secondRes.json()
        const secondParts = secondData.candidates?.[0]?.content?.parts || []
        const secondText = secondParts.map((p: any) => p.text || '').join('\n').trim()
        return secondText || "تم تنفيذ طلبك بنجاح."
      }

      const fullText = parts.map((p: any) => p.text || '').join('\n').trim()
      if (fullText) return fullText
      continue

    } catch (err: any) {
      continue 
    }
  }

  return "عذراً، أواجه صعوبة مؤقتة في معالجة طلبك حالياً."
}
