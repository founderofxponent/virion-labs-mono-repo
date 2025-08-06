import { supabase } from './supabase'

/**
 * Calculate the number of unique influencers for a specific client
 * based on active referral links for their campaigns
 */
export async function calculateClientInfluencerCount(clientId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('referral_links')
      .select(`
        influencer_id,
        campaign:discord_guild_campaigns!referral_links_campaign_id_fkey(
          client_id,
          is_deleted
        )
      `)
      .eq('campaign.client_id', clientId)
      .eq('is_active', true)
      .neq('campaign.is_deleted', true)

    if (error) {
      console.error('Error calculating client influencer count:', error)
      throw error
    }
    
    // Count unique influencers
    const uniqueInfluencers = new Set(
      data?.map(link => link.influencer_id).filter(Boolean) || []
    )
    
    return uniqueInfluencers.size
  } catch (error) {
    console.error('Failed to calculate client influencer count:', error)
    throw error
  }
}

/**
 * Update the stored influencer count for a specific client
 */
export async function updateClientInfluencerCount(clientId: string): Promise<number> {
  try {
    const count = await calculateClientInfluencerCount(clientId)
    
    const { error } = await supabase
      .from('clients')
      .update({ 
        influencers: count,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)

    if (error) {
      console.error('Error updating client influencer count:', error)
      throw error
    }
    
    console.log(`Updated client ${clientId} influencer count to ${count}`)
    return count
  } catch (error) {
    console.error('Failed to update client influencer count:', error)
    throw error
  }
}

/**
 * Batch update influencer counts for multiple clients
 */
export async function batchUpdateClientInfluencerCounts(clientIds: string[]): Promise<Record<string, number>> {
  const results: Record<string, number> = {}
  
  for (const clientId of clientIds) {
    try {
      const count = await updateClientInfluencerCount(clientId)
      results[clientId] = count
    } catch (error) {
      console.error(`Failed to update influencer count for client ${clientId}:`, error)
      results[clientId] = 0
    }
  }
  
  return results
}

/**
 * Get all clients that need influencer count updates
 */
export async function getClientsNeedingCountUpdate(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .select('client_id')
      .neq('is_deleted', true)

    if (error) throw error
    
    // Get unique client IDs
    const uniqueClientIds = [...new Set(data?.map(campaign => campaign.client_id).filter(Boolean) || [])]
    return uniqueClientIds
  } catch (error) {
    console.error('Failed to get clients needing count update:', error)
    return []
  }
} 