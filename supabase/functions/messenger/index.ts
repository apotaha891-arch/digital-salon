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

    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey ?? ''
    )

  try {
    // 0. Receipt Log
    console.log('[BRAIN] Message request received.')

    // 1. Internal Security Check
    const authHeader = req.headers.get('Authorization')
    // serviceRoleKey was fetched above
    
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
    const todayGregorian = new Date().toISOString().split('T')[0]

    const systemPrompt = `أنتِ "${agent.name}"، موظفة استقبال رقمية محترفة في صالون "${business.name}". 
اليوم هو ${todayGregorian} (ميلادي).
مهمتك: مساعدة العملاء في معرفة الخدمات، الأسعار، وحجز المواعيد.

القواعد:
1. خاطبي العميلات دائمًا بلقب "يا مدام" أو "عزيزتي" لضمان الرقي والمهنية.
2. كوني ودودة ومختصرة.
3. التحقق من رقم الهاتف: يجب أن يتكون رقم الهاتف من (7 إلى 15 رقماً). إذا كان الرقم ناقصاً أو يبدو خاطئاً، اطلبي من العميلة بلباقة التأكد من صحته قبل المتابعة.
4. قبل تأكيد أي حجز، استخدمي أداة (check_availability) للتأكد من توفر الموعد.
4. إذا طلب العميل خدمة غير موجودة، اقترحي الخدمات المتاحة.
5. استخدمي التاريخ الميلادي دائمًا في ردودك وأدواتك.

الخدمات المتاحة بأسعارها ومدتها:
${servicesContext}

تعليمات إضافية خاصة بشخصيتك:
${agent.instructions || 'لا توجد تعليمات إضافية.'}`

    // 6. Call AI
    const aiResponse = await callGeminiDynamic(systemPrompt, history || [], message, tools, userId, supabase, platform)
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

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Messenger Error:', errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 400, headers: corsHeaders 
    })
  }
})

async function callGeminiDynamic(system: string, history: any[], userMessage: string, tools: any, userId: string, supabase: any, platform: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  console.log(`[DEBUG] Gemini API Key present: ${!!apiKey}`)
  
  let availableModelIds: string[] = []
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    const listData = await listRes.json()
    if (listData.error) {
      console.error('[DEBUG] Gemini List Models Error:', listData.error)
    }
    availableModelIds = (listData.models || []).map((m: any) => m.name)
    console.log(`[DEBUG] Found ${availableModelIds.length} models.`)
  } catch (e) {
    console.error('[DEBUG] Failed to fetch model list, using fallback.', e)
    availableModelIds = ["models/gemini-1.5-flash"]
  }

  const priorityKeywords = [
    'gemini-3.1-pro', 
    'gemini-3-flash', 
    'gemini-2.5-flash', 
    'gemini-2-flash', 
    'gemini-1.5-pro', 
    'gemini-1.5-flash'
  ]
  
  const sortedModels = availableModelIds
    .filter(id => priorityKeywords.some(kw => id.toLowerCase().includes(kw)))
    .sort((a, b) => {
      // Find the index of the matching keyword to determine priority
      const getPriority = (id: string) => {
        const index = priorityKeywords.findIndex(kw => id.toLowerCase().includes(kw));
        return index === -1 ? 999 : index;
      };
      return getPriority(a) - getPriority(b);
    });

  if (sortedModels.length === 0) {
    console.warn('[DEBUG] No priority models found in list, adding common defaults.')
    sortedModels.push("models/gemini-2.0-flash", "models/gemini-1.5-flash")
  }

  console.log(`[DEBUG] Final sorted models to try: ${sortedModels.join(', ')}`)

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
      if (data.error) {
        console.error(`[DEBUG] Gemini Generate Error (${modelId}):`, JSON.stringify(data.error))
        continue
      }
      if (!data.candidates || data.candidates.length === 0) {
        console.warn(`[DEBUG] Gemini No Candidates (${modelId}):`, JSON.stringify(data))
        continue
      }
      
      const messageBody = data.candidates[0].content
      const parts = messageBody.parts || []
      
      // Tool Handling Loop (Max 5 iterations to avoid infinite loops)
      let currentMessageBody = messageBody
      let loopCount = 0
      
      while (loopCount < 5) {
        const functionCallPart = currentMessageBody.parts?.find((p: any) => p.functionCall)
        if (!functionCallPart) break
        
        loopCount++
        const fn = functionCallPart.functionCall
        console.log(`[TOOL CALL #${loopCount}] AI requested: ${fn.name} with args:`, JSON.stringify(fn.args))
        
        let result = null
        try {
          if (fn.name === 'get_day_bookings') {
            const { data, error } = await supabase.rpc('get_day_bookings', { p_salon_id: userId, p_date: fn.args.date })
            if (error) throw error
            result = data
          } else if (fn.name === 'check_availability') {
            const { data, error } = await supabase.rpc('check_availability', { p_salon_id: userId, p_date: fn.args.date, p_time: fn.args.time })
            if (error) throw error
            result = { available: data }
          } else if (fn.name === 'create_booking') {
            console.log(`[BOOKING] Attempting creation for user ${userId} via ${platform}`)
            const { data, error } = await supabase.rpc('create_booking', {
              p_salon_id: userId, p_client_name: fn.args.name, p_client_phone: fn.args.phone,
              p_service_name: fn.args.service, p_date: fn.args.date, p_time: fn.args.time, 
              p_channel: platform || 'telegram',
              p_external_id: external_id
            })
            if (error) throw error
            console.log(`[BOOKING] Success: ID ${data}`)
            result = { booking_id: data, status: 'success' }
          }
        } catch (dbErr: any) {
          console.error(`[TOOL ERROR] DB Error during ${fn.name}:`, dbErr.message)
          result = { error: dbErr.message || "Database execution failed" }
        }

        console.log(`[TOOL RESULT] Sending back to AI:`, JSON.stringify(result))

        const nextRes = await fetch(`${baseUrl}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [
              ...contents, currentMessageBody, 
              { role: 'function', parts: [{ functionResponse: { name: fn.name, response: { content: result } } } as any] }
            ],
            tools, system_instruction 
          })
        })
        
        const nextData = await nextRes.json()
        if (nextData.error) {
           console.error('[DEBUG] Gemini Sequential Call Error:', JSON.stringify(nextData.error))
           break
        }
        
        currentMessageBody = nextData.candidates?.[0]?.content
        if (!currentMessageBody) break
        
        const textPart = currentMessageBody.parts?.map((p: any) => p.text || '').join('\n').trim()
        if (textPart) return textPart // AI finally returned text
      }
      
      const finalParts = currentMessageBody.parts || []
      const finalText = finalParts.map((p: any) => p.text || '').join('\n').trim()
      return finalText || "تمت معالجة طلبك بنجاح."

      const fullText = parts.map((p: any) => p.text || '').join('\n').trim()
      if (fullText) return fullText
      continue

    } catch (err: any) {
      continue 
    }
  }

  return "عذراً، أواجه صعوبة مؤقتة في معالجة طلبك حالياً."
}
