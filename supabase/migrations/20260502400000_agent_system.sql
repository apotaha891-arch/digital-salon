-- ─── Agent stage instructions ─────────────────────────────────────────────────
-- Stores per-stage prompt instructions that the AI agent uses when generating
-- outreach messages. Admin-editable without code deployment.
CREATE TABLE IF NOT EXISTS agent_stage_instructions (
  stage        TEXT        PRIMARY KEY,
  instruction  TEXT        NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   uuid        REFERENCES auth.users(id)
);

ALTER TABLE agent_stage_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_agent_instructions"
  ON agent_stage_instructions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed default instructions
INSERT INTO agent_stage_instructions (stage, instruction) VALUES
  ('prospect',      'You are reaching out cold to a salon owner in Saudi Arabia. Your goal is a warm, curiosity-sparking first message. Mention Digital Salon by name, reference something specific about their salon if visible from Instagram, and ask one clear question to open a conversation. Keep it under 3 sentences. Do NOT pitch pricing yet.'),
  ('contacted',     'The salon owner has received your first message but has not replied. Send a light follow-up. Reference your previous outreach briefly, add a small piece of value (a stat, a question, an observation about their booking process), and keep it warm and not pushy. One paragraph maximum.'),
  ('replied',       'The salon owner has replied and is engaged. Your goal is to book a demo call. Acknowledge their reply specifically, offer two concrete time slots this week, and link to the booking page. Make it as easy as possible to say yes.'),
  ('demo_booked',   'A demo has been scheduled. Send a short confirmation message: restate the date and time, tell them what to expect in the demo (15 minutes, see the booking flow, live Q&A), and share any prep they should do (nothing required, but viewing their current booking process helps). Friendly and professional.'),
  ('proposal_sent', 'A proposal has been sent. Follow up to check if they have questions. Reference the specific plan they received. Offer to jump on a quick call to walk through it. Create mild urgency if appropriate (e.g., onboarding slots filling up this month) but do not fabricate deadlines.'),
  ('closed',        'This lead is closed. Do not generate outreach for closed leads.')
ON CONFLICT (stage) DO NOTHING;

-- ─── Agent message queue ───────────────────────────────────────────────────────
-- Tracks every AI-generated message: generated text, send status, and the
-- intent classification of any incoming reply.
CREATE TABLE IF NOT EXISTS agent_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid        NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  direction       TEXT        NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  content         TEXT        NOT NULL,
  -- outbound fields
  status          TEXT        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'sent', 'skipped')),
  generated_by    TEXT        DEFAULT 'agent',   -- 'agent' | 'human'
  sent_at         timestamptz,
  sent_by         uuid        REFERENCES auth.users(id),
  -- inbound / intent fields
  intent          TEXT        CHECK (intent IN ('POSITIVE','QUESTION','NEGATIVE','AMBIGUOUS')),
  escalated       boolean     NOT NULL DEFAULT false,
  escalated_to    uuid        REFERENCES auth.users(id),
  escalated_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_lead_id  ON agent_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_status   ON agent_messages(status);

ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_agent_messages"
  ON agent_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
