export const TOKEN_COSTS: Record<string, number> = {
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
  const cost = TOKEN_COSTS[platform] ?? 1
  if (cost === 0) return

  const { error } = await supabase.rpc('deduct_message_token', {
    p_user_id: userId,
    p_platform: platform,
    p_cost: cost,
  })

  if (error) console.error('[BILLING ERROR] Could not deduct tokens:', error.message)
  else console.log(`[BILLING] Deducted ${cost} tokens for ${platform} message.`)
}
