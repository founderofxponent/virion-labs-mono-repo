'use client'

import { useState, useEffect, useCallback } from 'react'

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
  archived: boolean
  archived_at?: string
  metadata: Record<string, any>
  
  // Landing page configuration fields
  landing_page_template_id?: string
  offer_title?: string
  offer_description?: string
  offer_highlights?: string[]
  offer_value?: string
  offer_expiry_date?: string
  hero_image_url?: string
  product_images?: string[]
  video_url?: string
  what_you_get?: string
  how_it_works?: string
  requirements?: string
  support_info?: string
  
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
  
  // Landing page configuration fields
  landing_page_template_id?: string
  offer_title?: string
  offer_description?: string
  offer_highlights?: string[]
  offer_value?: string
  offer_expiry_date?: string
  hero_image_url?: string
  product_images?: string[]
  video_url?: string
  what_you_get?: string
  how_it_works?: string
  requirements?: string
  support_info?: string
  
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
  client_id?: string
  guild_id?: string
  channel_id?: string
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
  
  // Landing page configuration fields
  landing_page_template_id?: string
  offer_title?: string
  offer_description?: string
  offer_highlights?: string[]
  offer_value?: string
  offer_expiry_date?: string
  hero_image_url?: string
  product_images?: string[]
  video_url?: string
  what_you_get?: string
  how_it_works?: string
  requirements?: string
  support_info?: string
  
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
    include_archived?: boolean
    only_archived?: boolean
  }) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.client_id) params.set('client_id', filters.client_id)
      if (filters?.guild_id) params.set('guild_id', filters.guild_id)
      if (filters?.is_active !== undefined) params.set('is_active', filters.is_active.toString())
      if (filters?.campaign_type) params.set('campaign_type', filters.campaign_type)
      if (filters?.include_archived) params.set('include_archived', filters.include_archived.toString())
      if (filters?.only_archived) params.set('only_archived', filters.only_archived.toString())

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

  const archiveCampaign = async (id: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/discord-campaigns/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'archive' }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to archive campaign: ${response.statusText}`)
      }

      const data = await response.json()

      // Update the campaign in the list to mark as archived
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === id ? data.campaign : campaign
        )
      )
      
      return { error: null, data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  const restoreCampaign = async (id: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/discord-campaigns/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'restore' }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to restore campaign: ${response.statusText}`)
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

  // Keep deleteCampaign for backward compatibility, but rename it
  const deleteCampaign = archiveCampaign

  const pauseCampaign = async (id: string) => {
    const result = await updateCampaign(id, { is_active: false })
    
    // Invalidate Discord bot cache for immediate effect
    if (!result.error) {
      try {
        const campaign = campaigns.find(c => c.id === id)
        if (campaign?.guild_id) {
          await fetch('/api/discord-bot/cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'invalidate',
              guild_id: campaign.guild_id
            })
          })
        }
      } catch (error) {
        console.warn('Failed to invalidate bot cache:', error)
      }
    }
    
    return result
  }

  const resumeCampaign = async (id: string) => {
    const result = await updateCampaign(id, { is_active: true })
    
    // Invalidate Discord bot cache for immediate effect
    if (!result.error) {
      try {
        const campaign = campaigns.find(c => c.id === id)
        if (campaign?.guild_id) {
          await fetch('/api/discord-bot/cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'invalidate',
              guild_id: campaign.guild_id
            })
          })
        }
      } catch (error) {
        console.warn('Failed to invalidate bot cache:', error)
      }
    }
    
    return result
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

  const getCampaignStats = useCallback(() => {
    if (!campaigns || campaigns.length === 0) {
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalInteractions: 0,
        totalConversions: 0,
        totalOnboardings: 0,
        conversionRate: 0,
        onboardingRate: 0
      }
    }

    // Calculate statistics from real database data - NO HARDCODED VALUES
    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter(c => c.is_active).length
    
    // Sum up all campaign statistics - ensure we use actual database values
    const totalInteractions = campaigns.reduce((sum, c) => sum + (c.total_interactions || 0), 0)
    const totalConversions = campaigns.reduce((sum, c) => sum + (c.referral_conversions || 0), 0)
    const totalOnboardings = campaigns.reduce((sum, c) => sum + (c.successful_onboardings || 0), 0)
    
    // Calculate rates based on actual data
    const conversionRate = totalInteractions > 0 ? (totalConversions / totalInteractions) * 100 : 0
    const onboardingRate = totalInteractions > 0 ? (totalOnboardings / totalInteractions) * 100 : 0

    // Debug logging to verify calculations
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Campaign Statistics Debug:', {
        campaigns: campaigns.map(c => ({
          name: c.campaign_name,
          interactions: c.total_interactions || 0,
          conversions: c.referral_conversions || 0,
          onboardings: c.successful_onboardings || 0
        })),
        totals: {
          totalInteractions,
          totalConversions, 
          totalOnboardings
        },
        rates: {
          conversionRate: `${conversionRate.toFixed(2)}%`,
          onboardingRate: `${onboardingRate.toFixed(2)}%`
        }
      })
    }

    return {
      totalCampaigns,
      activeCampaigns,
      totalInteractions,
      totalConversions,
      totalOnboardings,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      onboardingRate: parseFloat(onboardingRate.toFixed(2))
    }
  }, [campaigns])

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
    fetchCampaigns({ include_archived: false }) // Only fetch active campaigns by default
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
    archiveCampaign,
    restoreCampaign,
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