import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { platform, external_id, message, userId } = await req.json()

    if (!platform || !external_id || !message || !userId) {
      throw new Error('Missing required fields: platform, external_id, message, userId')
    }

    // ============================================================
    // STEP 1: Load Agent & Business Knowledge
    // ============================================================
    const [{ data: agent }, { data: business }] = await Promise.all([
      supabase.from('agents').select('*').eq('user_id', userId).single(),
      supabase.from('businesses').select('*').eq('user_id', userId).single(),
    ])

    if (!agent) throw new Error('Agent not found for this user')
    if (!agent.is_active) {
      return new Response(
        JSON.stringify({ response: null, skipped: true, reason: 'Agent is inactive' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================================
    // STEP 2: Get or Create Conversation (Memory)
    // ============================================================
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .upsert(
        { user_id: userId, external_id, platform, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,external_id,platform' }
      )
      .select()
      .single()

    if (convError) throw convError

    // ============================================================
    // STEP 3: Load Recent Conversation History (Context Window)
    // ============================================================
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Reverse to get chronological order (oldest first)
    const previousMessages = (history || []).reverse()

    // ============================================================
    // STEP 4: Save the incoming user message
    // ============================================================
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
    })

    // ============================================================
    // STEP 5: Build System Prompt (The Agent's Soul)
    // ============================================================
    const servicesList = Array.isArray(business?.services)
      ? business.services.map((s: any) =>
          typeof s === 'object'
            ? `• ${s.name} — ${s.price} ر.س (${s.duration})`
            : `• ${s}`
        ).join('\n')
      : 'لا توجد خدمات محددة حتى الآن'

    const systemPrompt = `أنتِ "${agent.name}"، موظفة استقبال رقمية محترفة ولبقة تعملين في صالون "${business?.name || 'الصالون'}".

معلومات الصالون:
- الموقع: ${business?.location || 'غير محدد'}
- ساعات العمل: ${business?.hours || 'غير محددة'}
- حساب انستقرام: ${business?.instagram || 'غير متوفر'}

الخدمات المتوفرة:
${servicesList}

تعليماتك الخاصة:
${agent.instructions || 'كوني ودودة ومحترفة في جميع الأوقات.'}

قواعد عامة:
- ردّي دائماً بالعربية الفصيحة الودودة.
- لا تخترعي خدمات أو أسعار غير موجودة في القائمة أعلاه.
- إذا طلبت العميلة حجزاً، اطلبي: الاسم الكامل، الخدمة المطلوبة، التاريخ والوقت المناسب.
- إذا اكتملت معلومات الحجز، أكّدي بوضوح: "تم تسجيل حجزك ✅".
- كوني موجزة وواضحة، تجنبي الردود الطويلة جداً.`

    // ============================================================
    // STEP 6: Call AI Model (OpenAI or Gemini)
    // ============================================================
    let aiResponse = ""
    if (agent.model_provider === 'gemini') {
      aiResponse = await callGemini(systemPrompt, previousMessages, message)
    } else {
      aiResponse = await callOpenAI(systemPrompt, previousMessages, message)
    }

    // ============================================================
    // STEP 7: Save AI Response to Memory
    // ============================================================
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: aiResponse,
    })

    // ============================================================
    // STEP 8: Update Agent Stats
    // ============================================================
    await supabase
      .from('agents')
      .update({
        messages_today: agent.messages_today + 1,
        total_messages: agent.total_messages + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agent.id)

    return new Response(
      JSON.stringify({ response: aiResponse, conversation_id: conversation.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Messenger error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================
// OpenAI GPT-4o — with full conversation history
// ============================================================
async function callOpenAI(system: string, history: any[], userMessage: string) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new Error('OPENAI_API_KEY not set in Supabase secrets')

  const messages = [
    { role: 'system', content: system },
    ...history.map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  })

  const data = await res.json()
  if (data.error) throw new Error(`OpenAI error: ${data.error.message}`)
  return data.choices[0].message.content
}

// ============================================================
// Google Gemini 1.5 Pro — with full conversation history
// ============================================================
async function callGemini(system: string, history: any[], userMessage: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in Supabase secrets')

  // Build Gemini contents array from history
  const contents = [
    // System prompt as first user turn
    { role: 'user', parts: [{ text: system }] },
    { role: 'model', parts: [{ text: 'مفهوم، سأتبع هذه التعليمات بدقة.' }] },
    // Previous conversation
    ...history.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    // New user message
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 500, temperature: 0.7 } }),
    }
  )

  const data = await res.json()
  if (data.error) throw new Error(`Gemini error: ${data.error.message}`)
  return data.candidates[0].content.parts[0].text
}
