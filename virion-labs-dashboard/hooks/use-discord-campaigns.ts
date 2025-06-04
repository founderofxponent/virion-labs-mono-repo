'use client'

import { useState, useEffect } from 'react'

export interface DiscordCampaign {
  id: string
  client_id: string
  guild_id: string
  channel_id?: string
  campaign_name: string
  campaign_type: 'referral_onboarding' | 'product_promotion' | 'community_engagement' | 'support'
  referral_link_id?: string
  influencer_id?: string
  webhook_url?: string
  welcome_message?: string
  onboarding_flow: Record<string, any>
  referral_tracking_enabled: boolean
  auto_role_assignment: boolean
  target_role_id?: string
  total_interactions: number
  successful_onboardings: number
  referral_conversions: number
  is_active: boolean
  campaign_start_date?: string
  campaign_end_date?: string
  metadata: Record<string, any>
  
  // Bot configuration fields (now part of campaign)
  bot_name: string
  bot_avatar_url?: string
  bot_personality: string
  bot_response_style: string
  brand_color: string
  brand_logo_url?: string
  custom_commands: Array<any>
  auto_responses: Record<string, any>
  rate_limit_per_user: number
  allowed_channels: Array<string>
  blocked_users: Array<string>
  moderation_enabled: boolean
  content_filters: Array<string>
  
  created_at: string
  updated_at: string
  
  // Joined data
  clients?: {
    name: string
    industry: string
  }
  referral_links?: {
    title: string
    referral_code: string
    platform: string
  }
  user_profiles?: {
    full_name: string
    email: string
  }
}

export interface CreateDiscordCampaignData {
  client_id: string
  guild_id: string
  channel_id?: string
  campaign_name: string
  campaign_type: 'referral_onboarding' | 'product_promotion' | 'community_engagement' | 'support'
  referral_link_id?: string
  influencer_id?: string
  webhook_url?: string
  welcome_message?: string
  onboarding_flow?: Record<string, any>
  referral_tracking_enabled?: boolean
  auto_role_assignment?: boolean
  target_role_id?: string
  campaign_start_date?: string
  campaign_end_date?: string
  metadata?: Record<string, any>
  
  // Bot configuration fields
  bot_name?: string
  bot_avatar_url?: string
  bot_personality?: string
  bot_response_style?: string
  brand_color?: string
  brand_logo_url?: string
  custom_commands?: Array<any>
  auto_responses?: Record<string, any>
  rate_limit_per_user?: number
  allowed_channels?: Array<string>
  blocked_users?: Array<string>
  moderation_enabled?: boolean
  content_filters?: Array<string>
  
  // Template-based creation
  template_id?: string
}

export interface UpdateDiscordCampaignData {
  campaign_name?: string
  campaign_type?: 'referral_onboarding' | 'product_promotion' | 'community_engagement' | 'support'
  referral_link_id?: string
  influencer_id?: string
  webhook_url?: string
  welcome_message?: string
  onboarding_flow?: Record<string, any>
  referral_tracking_enabled?: boolean
  auto_role_assignment?: boolean
  target_role_id?: string
  campaign_start_date?: string
  campaign_end_date?: string
  is_active?: boolean
  metadata?: Record<string, any>
  
  // Bot configuration fields
  bot_name?: string
  bot_avatar_url?: string
  bot_personality?: string
  bot_response_style?: string
  brand_color?: string
  brand_logo_url?: string
  custom_commands?: Array<any>
  auto_responses?: Record<string, any>
  rate_limit_per_user?: number
  allowed_channels?: Array<string>
  blocked_users?: Array<string>
  moderation_enabled?: boolean
  content_filters?: Array<string>
}

export interface CampaignTemplate {
  id: string
  name: string
  description?: string
  campaign_type: 'referral_onboarding' | 'product_promotion' | 'community_engagement' | 'support'
  template_config: Record<string, any>
  is_default: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export function useDiscordCampaigns() {
  const [campaigns, setCampaigns] = useState<DiscordCampaign[]>([])
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaigns = async (filters?: {
    client_id?: string
    guild_id?: string
    is_active?: boolean
    campaign_type?: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.client_id) params.set('client_id', filters.client_id)
      if (filters?.guild_id) params.set('guild_id', filters.guild_id)
      if (filters?.is_active !== undefined) params.set('is_active', filters.is_active.toString())
      if (filters?.campaign_type) params.set('campaign_type', filters.campaign_type)

      const response = await fetch(`/api/discord-campaigns?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.statusText}`)
      }

      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching Discord campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async (filters?: {
    campaign_type?: string
    is_default?: boolean
  }) => {
    try {
      const params = new URLSearchParams()
      if (filters?.campaign_type) params.set('campaign_type', filters.campaign_type)
      if (filters?.is_default !== undefined) params.set('is_default', filters.is_default.toString())

      const response = await fetch(`/api/campaign-templates?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`)
      }

      const data = await response.json()
      setTemplates(data.templates || [])
      return data.templates || []
    } catch (err) {
      console.error('Error fetching campaign templates:', err)
      return []
    }
  }

  const createCampaign = async (campaignData: CreateDiscordCampaignData) => {
    try {
      setError(null)

      const response = await fetch('/api/discord-campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create campaign: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Add the new campaign to the list
      setCampaigns(prev => [data.campaign, ...prev])
      
      return { data: data.campaign, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const createCampaignFromTemplate = async (templateId: string, campaignData: Partial<CreateDiscordCampaignData>) => {
    return createCampaign({
      ...campaignData,
      template_id: templateId
    } as CreateDiscordCampaignData)
  }

  const updateCampaign = async (id: string, updateData: UpdateDiscordCampaignData) => {
    try {
      setError(null)

      const response = await fetch(`/api/discord-campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update campaign: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Update the campaign in the list
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === id ? data.campaign : campaign
        )
      )
      
      return { data: data.campaign, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const deleteCampaign = async (id: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/discord-campaigns/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete campaign: ${response.statusText}`)
      }

      // Remove the campaign from the list
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id))
      
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  const pauseCampaign = async (id: string) => {
    return updateCampaign(id, { is_active: false })
  }

  const resumeCampaign = async (id: string) => {
    return updateCampaign(id, { is_active: true })
  }

  const getCampaignById = async (id: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/discord-campaigns/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch campaign: ${response.statusText}`)
      }

      const data = await response.json()
      return { data: data.campaign, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const getCampaignStats = () => {
    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter(c => c.is_active).length
    const totalInteractions = campaigns.reduce((sum, c) => sum + c.total_interactions, 0)
    const totalConversions = campaigns.reduce((sum, c) => sum + c.referral_conversions, 0)
    const totalOnboardings = campaigns.reduce((sum, c) => sum + c.successful_onboardings, 0)

    const campaignsByType = campaigns.reduce((acc, campaign) => {
      acc[campaign.campaign_type] = (acc[campaign.campaign_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const campaignsByClient = campaigns.reduce((acc, campaign) => {
      const clientName = campaign.clients?.name || 'Unknown'
      acc[clientName] = (acc[clientName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const activeCampaignsByType = campaigns
      .filter(c => c.is_active)
      .reduce((acc, campaign) => {
        acc[campaign.campaign_type] = (acc[campaign.campaign_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    return {
      totalCampaigns,
      activeCampaigns,
      inactiveCampaigns: totalCampaigns - activeCampaigns,
      totalInteractions,
      totalConversions,
      totalOnboardings,
      conversionRate: totalInteractions > 0 ? (totalConversions / totalInteractions) * 100 : 0,
      onboardingRate: totalInteractions > 0 ? (totalOnboardings / totalInteractions) * 100 : 0,
      campaignsByType,
      campaignsByClient,
      activeCampaignsByType,
      avgInteractionsPerCampaign: totalCampaigns > 0 ? totalInteractions / totalCampaigns : 0,
      avgConversionsPerCampaign: totalCampaigns > 0 ? totalConversions / totalCampaigns : 0
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCampaignTypeLabel = (type: string) => {
    const labels = {
      'referral_onboarding': 'Referral Onboarding',
      'product_promotion': 'Product Promotion',
      'community_engagement': 'Community Engagement',
      'support': 'Support'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getCampaignTypeColor = (type: string) => {
    const colors = {
      'referral_onboarding': '#00ff88',
      'product_promotion': '#f59e0b',
      'community_engagement': '#8b5cf6',
      'support': '#3b82f6'
    }
    return colors[type as keyof typeof colors] || '#6366f1'
  }

  // Load campaigns and templates on mount
  useEffect(() => {
    fetchCampaigns()
    fetchTemplates()
  }, [])

  return {
    campaigns,
    templates,
    loading,
    error,
    fetchCampaigns,
    fetchTemplates,
    createCampaign,
    createCampaignFromTemplate,
    updateCampaign,
    deleteCampaign,
    pauseCampaign,
    resumeCampaign,
    getCampaignById,
    getCampaignStats,
    formatDate,
    getCampaignTypeLabel,
    getCampaignTypeColor,
    refreshCampaigns: fetchCampaigns
  }
} 