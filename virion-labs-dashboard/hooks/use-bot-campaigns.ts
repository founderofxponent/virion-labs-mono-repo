import { useState, useEffect } from 'react'

interface Client {
  name: string
  industry: string
}

interface ReferralLink {
  title: string
  referral_code: string
  platform: string
}

interface UserProfile {
  full_name: string
  email: string
}

export type CampaignStatus = 'active' | 'paused' | 'archived' | 'deleted' | 'inactive'

export interface BotCampaign {
  id: string
  name: string
  type: string
  guild_id: string
  channel_id?: string
  client_id: string
  client_name: string
  client_industry: string
  display_name: string
  template: string
  description?: string
  is_active: boolean
  paused_at?: string | null
  campaign_end_date?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  campaign_start_date: string
  created_at: string
  updated_at: string
  total_interactions: number
  successful_onboardings: number
  referral_conversions: number
  last_activity_at?: string | null
  configuration_version?: number
  referral_link_id?: string | null
  referral_link_title?: string
  referral_code?: string
  referral_platform?: string
}

interface BotCampaignsFilters {
  client_id?: string
  guild_id?: string
  is_active?: boolean
  template?: string
  include_archived?: boolean
  only_archived?: boolean
  only_paused?: boolean
  include_deleted?: boolean
  only_deleted?: boolean
}

interface CreateBotCampaignData {
  client_id: string
  guild_id: string
  channel_id?: string
  campaign_name: string
  campaign_template: string
  prefix?: string
  description?: string
  bot_name?: string
  bot_avatar_url?: string
  bot_personality?: string
  bot_response_style?: string
  brand_color?: string
  brand_logo_url?: string
  features?: Record<string, any>
  custom_commands?: any[]
  auto_responses?: Record<string, any>
  response_templates?: Record<string, any>
  embed_footer?: string
  welcome_message?: string
  webhook_url?: string
  webhook_routes?: any[]
  api_endpoints?: Record<string, any>
  external_integrations?: Record<string, any>
  referral_link_id?: string
  influencer_id?: string
  referral_tracking_enabled?: boolean
  auto_role_assignment?: boolean
  target_role_ids?: string[]
  onboarding_flow?: Record<string, any>
  rate_limit_per_user?: number
  allowed_channels?: string[]
  blocked_users?: string[]
  moderation_enabled?: boolean
  content_filters?: string[]
  campaign_start_date?: string
  campaign_end_date?: string
  metadata?: Record<string, any>
}

interface UpdateBotCampaignData extends Partial<CreateBotCampaignData> {
  id: string
}

export function useBotCampaigns(filters?: BotCampaignsFilters) {
  const [campaigns, setCampaigns] = useState<BotCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const searchParams = new URLSearchParams()
      if (filters?.client_id) searchParams.append('client_id', filters.client_id)
      if (filters?.guild_id) searchParams.append('guild_id', filters.guild_id)
      if (filters?.is_active !== undefined) searchParams.append('is_active', filters.is_active.toString())
      if (filters?.template) searchParams.append('template', filters.template)
      
      // Add all the new filtering parameters
      if (filters?.include_archived) searchParams.append('include_archived', 'true')
      if (filters?.only_archived) searchParams.append('only_archived', 'true')
      if (filters?.only_paused) searchParams.append('only_paused', 'true')
      if (filters?.include_deleted) searchParams.append('include_deleted', 'true')
      if (filters?.only_deleted) searchParams.append('only_deleted', 'true')

      const response = await fetch(`/api/bot-campaigns?${searchParams}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns')
      console.error('Error fetching bot campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [
    filters?.client_id, 
    filters?.guild_id, 
    filters?.is_active, 
    filters?.template,
    filters?.include_archived,
    filters?.only_archived,
    filters?.only_paused,
    filters?.include_deleted,
    filters?.only_deleted
  ])

  const createCampaign = async (data: CreateBotCampaignData): Promise<BotCampaign> => {
    const response = await fetch('/api/bot-campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return result.campaign
  }

  const updateCampaign = async (id: string, data: Partial<CreateBotCampaignData>): Promise<BotCampaign> => {
    const response = await fetch(`/api/bot-campaigns/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return result.campaign
  }

  const deleteCampaign = async (id: string): Promise<void> => {
    const response = await fetch(`/api/bot-campaigns/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete campaign')
    }

    await fetchCampaigns() // Refresh the list
  }

  const pauseCampaign = async (id: string): Promise<BotCampaign> => {
    const response = await fetch(`/api/bot-campaigns/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'pause' }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to pause campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return result.campaign
  }

  const resumeCampaign = async (id: string): Promise<BotCampaign> => {
    const response = await fetch(`/api/bot-campaigns/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'resume' }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to resume campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return result.campaign
  }

  const archiveCampaign = async (id: string): Promise<BotCampaign> => {
    const response = await fetch(`/api/bot-campaigns/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'archive' }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to archive campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return result.campaign
  }

  const restoreCampaign = async (id: string): Promise<BotCampaign> => {
    const response = await fetch(`/api/bot-campaigns/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'restore' }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to restore campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return result.campaign
  }

  const activateCampaign = async (id: string): Promise<BotCampaign> => {
    const response = await fetch(`/api/bot-campaigns/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'activate' }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to activate campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return result.campaign
  }

  const softDeleteCampaign = async (id: string): Promise<BotCampaign> => {
    const response = await fetch(`/api/bot-campaigns/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return result.campaign
  }

  const hardDeleteCampaign = async (id: string): Promise<void> => {
    const response = await fetch(`/api/bot-campaigns/${id}?force=true`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to permanently delete campaign')
    }

    await fetchCampaigns() // Refresh the list
  }

  const refresh = () => {
    fetchCampaigns()
  }

  return {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign: softDeleteCampaign, // Keep backward compatibility
    softDeleteCampaign,
    hardDeleteCampaign,
    pauseCampaign,
    resumeCampaign,
    archiveCampaign,
    restoreCampaign,
    activateCampaign,
    refresh,
  }
}

export function useBotCampaign(id: string) {
  const [campaign, setCampaign] = useState<BotCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaign = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/bot-campaigns/${id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setCampaign(data.campaign)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaign')
      console.error('Error fetching bot campaign:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchCampaign()
    }
  }, [id])

  const updateCampaign = async (data: Partial<CreateBotCampaignData>): Promise<BotCampaign> => {
    const response = await fetch(`/api/bot-campaigns/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update campaign')
    }

    const result = await response.json()
    setCampaign(result.campaign)
    return result.campaign
  }

  const refresh = () => {
    if (id) {
      fetchCampaign()
    }
  }

  return {
    campaign,
    loading,
    error,
    updateCampaign,
    refresh,
  }
}

// Helper function to determine campaign status
export function getCampaignStatus(campaign: BotCampaign): CampaignStatus {
  // Priority order: deleted > archived > paused > active
  if (campaign.is_deleted) return 'deleted'
  if (!campaign.is_active && campaign.campaign_end_date) return 'archived'
  if (!campaign.is_active && campaign.paused_at) return 'paused'
  if (campaign.is_active) return 'active'
  return 'inactive' // fallback for edge cases
} 