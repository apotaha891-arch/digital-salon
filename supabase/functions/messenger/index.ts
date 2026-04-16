import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
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

    // 5. Build System Prompt
    const systemPrompt = `أنتِ "${agent.name}"، موظفة استقبال رقمية محترفة في صالون "${business.name}".
اليوم هو ${new Date().toLocaleDateString('ar-SA')}.

مهامك:
1. الرد على استفسارات العملاء بلباقة.
2. استخدام الأدوات (Tools) للتحقق من المواعيد المتاحة قبل تأكيد أي حجز.
3. إذا كان الموعد مشغولاً، اقترحي مواعيد أخرى بناءً على نتيجة get_day_bookings.
4. لا تؤكدي أي حجز إلا عبر أداة create_booking.

الخدمات: ${JSON.stringify(services)}`

    // 6. Call Gemini 3 with Tool Support
    const aiResponse = await callGemini3(systemPrompt, history || [], message, tools, userId, supabase)

    // 7. Save AI Response
    await supabase.from('messages').insert({ conversation_id: conversation.id, role: 'assistant', content: aiResponse })

    return new Response(JSON.stringify({ response: aiResponse }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Messenger Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})

async function callGemini3(system: string, history: any[], userMessage: string, tools: any, userId: string, supabase: any) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"
  
  let contents = [
    { role: 'user', parts: [{ text: system }] },
    { role: 'model', parts: [{ text: "مفهوم، أنا جاهزة للعمل كموظفة استقبال رقمية وسأستخدم الأدوات المتاحة لإدارة الحجوزات بدقة." }] },
    ...history.reverse().map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })),
    { role: 'user', parts: [{ text: userMessage }] }
  ]

  // First Call: Get Tool Calls or Response
  let res = await fetch(`${baseUrl}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, tools, tool_config: { function_calling_config: { mode: "AUTO" } } })
  })

  let data = await res.json()
  let message = data.candidates[0].content

  // Check for Tool Calls (The Agent Handler Loop)
  if (message.parts[0].functionCall) {
    const fn = message.parts[0].functionCall
    console.log('Gemini Tool Call:', fn.name, fn.args)

    let result = null
    if (fn.name === 'get_day_bookings') {
      const { data } = await supabase.rpc('get_day_bookings', { p_salon_id: userId, p_date: fn.args.date })
      result = data
    } else if (fn.name === 'check_availability') {
      const { data } = await supabase.rpc('check_availability', { 
        p_salon_id: userId, p_date: fn.args.date, p_time: fn.args.time 
      })
      result = { available: data }
    } else if (fn.name === 'create_booking') {
      const { data } = await supabase.rpc('create_booking', {
        p_salon_id: userId,
        p_client_name: fn.args.name,
        p_client_phone: fn.args.phone,
        p_service_name: fn.args.service,
        p_date: fn.args.date,
        p_time: fn.args.time,
        p_channel: 'telegram'
      })
      result = { booking_id: data, status: 'success' }
    }

    // Second Call: Send Tool Result back to Gemini
    contents.push(message)
    contents.push({
      role: 'function',
      parts: [{ functionResponse: { name: fn.name, response: { content: result } } }]
    })

    res = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, tools })
    })
    data = await res.json()
    return data.candidates[0].content.parts[0].text
  }

  return message.parts[0].text
}
