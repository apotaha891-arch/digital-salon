import { supabase } from './supabase';

// ─── Lead context builder ─────────────────────────────────────────────────────
export function buildLeadContext(lead) {
  const openTasks  = (lead.tasks     || []).filter(t => !t.is_completed);
  const activities = (lead.activities || []).slice(-5);

  const activityLines = activities.length
    ? activities.map(a => `  - [${a.type}] ${a.content}`).join('\n')
    : '  - No activities logged yet';

  const taskLines = openTasks.length
    ? openTasks.map(t => `  - ${t.description}${t.due_date ? ` (due ${t.due_date})` : ''}`).join('\n')
    : '  - No open tasks';

  return [
    `Salon name:    ${lead.salon_name || 'Unknown'}`,
    `Owner name:    ${lead.contact_name || 'Unknown'}`,
    `Instagram:     ${lead.instagram_handle ? '@' + lead.instagram_handle : 'Not provided'}`,
    `City:          ${lead.city || 'Unknown'}`,
    `Source:        ${lead.source || 'Unknown'}`,
    `Current stage: ${lead.status}`,
    `Days in stage: ${daysInStage(lead)}`,
    `Assigned to:   ${lead.assignee?.full_name || 'Unassigned'}`,
    `Notes:         ${lead.notes || 'None'}`,
    '',
    'Recent activities:',
    activityLines,
    '',
    'Open tasks:',
    taskLines,
  ].join('\n');
}

function daysInStage(lead) {
  const ref = lead.status_changed_at || lead.updated_at;
  if (!ref) return 0;
  return Math.floor((Date.now() - new Date(ref).getTime()) / 86_400_000);
}

// ─── Stage instruction helpers ────────────────────────────────────────────────
export async function getStageInstruction(stage) {
  const { data, error } = await supabase
    .from('agent_stage_instructions')
    .select('instruction')
    .eq('stage', stage)
    .single();
  if (error) throw error;
  return data.instruction;
}

export async function getAllStageInstructions() {
  const { data, error } = await supabase
    .from('agent_stage_instructions')
    .select('*')
    .order('stage');
  if (error) throw error;
  return data || [];
}

export async function updateStageInstruction(stage, instruction) {
  const { data, error } = await supabase
    .from('agent_stage_instructions')
    .update({ instruction, updated_at: new Date().toISOString() })
    .eq('stage', stage)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Message generator (calls Edge Function → Gemini) ────────────────────────
export async function generateOutreachMessage(lead) {
  const stageInstruction = await getStageInstruction(lead.status);
  const leadContext      = buildLeadContext(lead);

  const { data, error } = await supabase.functions.invoke('generate-outreach', {
    body: { leadContext, stageInstruction },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data.message;
}

// ─── Intent classifier (calls Edge Function → Gemini) ────────────────────────
export async function classifyIntent(replyText) {
  const { data, error } = await supabase.functions.invoke('classify-intent', {
    body: { replyText },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data.intent ?? 'AMBIGUOUS';
}

// ─── Message queue helpers ────────────────────────────────────────────────────
export async function saveDraftMessage(leadId, content) {
  const { data, error } = await supabase
    .from('agent_messages')
    .insert({ lead_id: leadId, direction: 'outbound', content, status: 'draft', generated_by: 'agent' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markMessageSent(messageId, userId) {
  const { data, error } = await supabase
    .from('agent_messages')
    .update({ status: 'sent', sent_at: new Date().toISOString(), sent_by: userId })
    .eq('id', messageId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function skipMessage(messageId) {
  const { data, error } = await supabase
    .from('agent_messages')
    .update({ status: 'skipped' })
    .eq('id', messageId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function recordInboundReply(leadId, content, userId) {
  const intent = await classifyIntent(content);
  const shouldEscalate = ['QUESTION', 'AMBIGUOUS', 'NEGATIVE'].includes(intent);

  const { data, error } = await supabase
    .from('agent_messages')
    .insert({
      lead_id:      leadId,
      direction:    'inbound',
      content,
      status:       'sent',
      intent,
      escalated:    shouldEscalate,
      escalated_to: shouldEscalate ? userId : null,
      escalated_at: shouldEscalate ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getLeadMessages(leadId) {
  const { data, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at');
  if (error) throw error;
  return data || [];
}
