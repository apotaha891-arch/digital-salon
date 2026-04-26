// Fallback costs if DB read fails
const FALLBACK_COSTS: Record<string, number> = {
  whatsapp: 3,
  instagram: 2,
  facebook: 2,
  telegram: 1,
  widget: 2,
  concierge: 0,
}

export const deductTokens = async (
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  platform: string,
): Promise<void> => {
  // Fetch cost from DB (admin-configurable); fall back to hardcoded defaults
  let cost = FALLBACK_COSTS[platform] ?? 1
  try {
    const { data } = await supabase
      .from('platform_settings')
      .select('token_cost')
      .eq('platform', platform)
      .single()
    if (data?.token_cost !== undefined) cost = data.token_cost
  } catch {
    // use fallback silently
  }

  if (cost === 0) return

  const { error } = await supabase.rpc('deduct_message_token', {
    p_user_id: userId,
    p_platform: platform,
    p_cost: cost,
  })

  if (error) console.error('[BILLING ERROR] Could not deduct tokens:', error.message)
  else console.log(`[BILLING] Deducted ${cost} tokens for ${platform} message.`)
}
