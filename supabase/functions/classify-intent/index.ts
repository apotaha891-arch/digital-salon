import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_INTENTS = ['POSITIVE', 'QUESTION', 'NEGATIVE', 'AMBIGUOUS'];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { replyText } = await req.json();

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');

    const prompt = `You are an intent classifier for a sales CRM.
Classify the incoming reply from a salon owner into exactly one of these categories:
POSITIVE   — interested, wants to know more, agrees to a demo, or says yes
QUESTION   — asks a specific question that needs a human or detailed answer
NEGATIVE   — not interested, asks to stop, or declines
AMBIGUOUS  — unclear, short reply, or could go either way

Respond with ONLY the single word category. Nothing else.

Reply to classify:
${replyText}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 10, temperature: 0 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const json = await res.json();
    const raw  = (json.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim().toUpperCase();
    const intent = VALID_INTENTS.includes(raw) ? raw : 'AMBIGUOUS';

    return new Response(JSON.stringify({ intent }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
