import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[SUPABASE] Missing env vars — ticket creation will be disabled.')
}

const supabase = createClient(
  process.env.SUPABASE_URL     || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default supabase
