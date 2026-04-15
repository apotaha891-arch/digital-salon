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

    // 1. Fetch Agent & Business Knowledge
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .single()

    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 2. Build the "Spirit" (System Prompt)
    const systemPrompt = `
      أنتِ "${agent.name}"، موظفة استقبال رقمية محترفة ولبقة تعملين في صالون "${business.name}".
      
      معلومات الصالون:
      - الموقع: ${business.location}
      - ساعات العمل: ${business.hours}
      - الخدمات المتوفرة: ${JSON.stringify(business.services)}
      
      تعليماتك الخاصة:
      ${agent.instructions}
      
      قواعد عامة:
      - كوني ودودة جداً ولبقة.
      - لا تخترعي خدمات غير موجودة في القائمة.
      - إذا سألت العميلة عن حجز، اطلبي منها الاسم والخدمة المطلوبة.
    `

    // 3. Choice of Mastermind (OpenAI vs Gemini)
    let aiResponse = "";
    if (agent.model_provider === 'openai') {
      aiResponse = await callOpenAI(systemPrompt, message)
    } else {
      aiResponse = await callGemini(systemPrompt, message)
    }

    // 4. Save to Memory (Database)
    // Here we would create/get conversation and save message...

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function callOpenAI(system: string, user: string) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  })
  const data = await res.json()
  return data.choices[0].message.content
}

async function callGemini(system: string, user: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${system}\n\nالعميلة تقول: ${user}` }]
      }]
    })
  })
  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}
