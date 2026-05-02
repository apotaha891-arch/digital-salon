import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a professional sales representative for Digital Salon, a SaaS booking and business management platform built specifically for salons in Saudi Arabia.

Digital Salon helps salon owners:
- Replace manual WhatsApp booking with a clean online booking page
- Send automatic appointment reminders to reduce no-shows
- Track revenue, staff, and customer history in one place
- Accept deposits and manage walk-ins

Your target customers are Saudi salon owners who currently manage bookings by hand (WhatsApp, phone calls, paper). They are typically busy, skeptical of new software, and respond best to messages that are brief, specific, and respectful of their time.

Always write in a warm but professional tone. Use Arabic if the lead's name or salon name suggests an Arabic-speaking owner, otherwise use English. Never mention competitors. Never invent features that do not exist.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { leadContext, stageInstruction } = await req.json();

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');

    const prompt = [
      SYSTEM_PROMPT,
      '',
      'Lead context:',
      leadContext,
      '',
      'Stage instruction:',
      stageInstruction,
      '',
      'Generate the outreach message for this lead now. Write only the message itself — no subject line, no preamble, no explanation.',
    ].join('\n');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return new Response(JSON.stringify({ message: text.trim() }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
