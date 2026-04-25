import supabase from './supabase.js'

const COMPLAINT_KEYWORDS = [
  // Arabic
  'مشكلة', 'شكوى', 'تضرر', 'ألم', 'حساسية', 'احمرار', 'حرقة',
  'خطأ', 'غير راضية', 'سيء', 'وجع', 'ضرر', 'تهيج',
  // English
  'problem', 'issue', 'complaint', 'hurt', 'pain',
  'redness', 'allergy', 'burn', 'bad', 'wrong',
  'damaged', 'unhappy', 'dissatisfied', 'irritation',
]

export const isComplaint = (text) => {
  const lower = text.toLowerCase()
  return COMPLAINT_KEYWORDS.some(kw => lower.includes(kw))
}

export const createTicketIfComplaint = async ({ userId, customerName, channel, message }) => {
  if (!isComplaint(message)) return
  if (!process.env.SUPABASE_URL) return

  const userId_ = userId || process.env.SALON_USER_ID
  if (!userId_) {
    console.warn('[TICKET] SALON_USER_ID not set — cannot create ticket.')
    return
  }

  const { error } = await supabase.from('tickets').insert({
    user_id:        userId_,
    customer_name:  customerName || 'عميلة',
    channel,
    message,
    status:         'open',
    priority:       'high',
    auto_generated: true,
    created_at:     new Date().toISOString(),
  })

  if (error) {
    console.error('[TICKET] Failed to create auto-ticket:', error.message)
  } else {
    console.log(`[TICKET] Auto-ticket created — ${channel} / ${customerName}: "${message.slice(0, 60)}"`)
  }
}
