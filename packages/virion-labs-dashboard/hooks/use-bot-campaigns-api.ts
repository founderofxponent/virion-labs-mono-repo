"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"
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
  end_date?: string | null
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
  // Bot configuration fields
  auto_role_assignment?: boolean
  target_role_ids?: string[]
  referral_tracking_enabled?: boolean
  moderation_enabled?: boolean
  bot_name?: string
  bot_personality?: string
  bot_response_style?: string
  brand_color?: string
  brand_logo_url?: string
  welcome_message?: string
  webhook_url?: string
  rate_limit_per_user?: number
  features?: Record<string, any>
  auto_responses?: Record<string, any>
  custom_commands?: any[]
  document_id?: string;
}

interface CreateBotCampaignData {
  client_id: string;
  guild_id: string;
  channel_id?: string;
  campaign_name: string;
  campaign_template: string;
  campaign_type?: string;
  prefix?: string;
  description?: string;
  bot_name?: string;
  bot_avatar_url?: string;
  bot_personality?: string;
  bot_response_style?: string;
  brand_color?: string;
  brand_logo_url?: string;
  features?: Record<string, any>;
  custom_commands?: any[];
  auto_responses?: Record<string, any>;
  response_templates?: Record<string, any>;
  embed_footer?: string;
  welcome_message?: string;
  webhook_url?: string;
  webhook_routes?: any[];
  api_endpoints?: Record<string, any>;
  external_integrations?: Record<string, any>;
  referral_link_id?: string;
  influencer_id?: string;
  referral_tracking_enabled?: boolean;
  auto_role_assignment?: boolean;
  target_role_ids?: string[];
  rate_limit_per_user?: number;
  allowed_channels?: string[];
  blocked_users?: string[];
  moderation_enabled?: boolean;
  content_filters?: string[];
  campaign_start_date?: string;
  end_date?: string;
  landing_page_data?: any;
  metadata?: Record<string, any>;
  onboarding_questions?: any[];
}

interface ApiListResponse {
  campaigns: BotCampaign[];
  total_count: number;
}

export type CampaignStatus = 'active' | 'archived' | 'deleted' | 'inactive'

// Helper function to determine campaign status
export function getCampaignStatus(campaign: BotCampaign): CampaignStatus {
  // Priority order: deleted > archived > active
  if (campaign.is_deleted) return 'deleted'
  if (!campaign.is_active && campaign.end_date) return 'archived'
  if (campaign.is_active) return 'active'
  return 'inactive' // fallback for edge cases
}

export function useBotCampaignsAPI(filters?: BotCampaignsFilters) {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<BotCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "http://localhost:8000/api/v1/operations"

  const getToken = () => localStorage.getItem('auth_token')


  const fetchCampaigns = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      setLoading(false)
      return
    }

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

      const response = await fetch(`${API_BASE_URL}/campaign/list?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch campaigns')
      }
      
      const data: ApiListResponse = await response.json()
      // console.log('🔍 API Response Debug:', { url: `${API_BASE_URL}/campaign/list?${searchParams}`, response: data })
      // The backend returns BotCampaign objects directly, not nested in attributes
      // So we can use them directly without transformation
      setCampaigns(data.campaigns as BotCampaign[])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const createCampaign = async (data: CreateBotCampaignData): Promise<BotCampaign> => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    const response = await fetch(`${API_BASE_URL}/campaign/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
          campaign_data: data,
          setup_options: {}
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to create campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return result.campaign;
  }

  const updateCampaign = async (id: string, data: Partial<CreateBotCampaignData>): Promise<BotCampaign> => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    const response = await fetch(`${API_BASE_URL}/campaign/update/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to update campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return result.campaign;
  }

  const deleteCampaign = async (id: string): Promise<void> => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    const response = await fetch(`${API_BASE_URL}/campaign/delete/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to delete campaign')
    }

    await fetchCampaigns() // Refresh the list
  }

  const unarchiveCampaign = async (id: string): Promise<BotCampaign> => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    const response = await fetch(`${API_BASE_URL}/campaign/unarchive/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to unarchive campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return result.campaign;
  }

  const archiveCampaign = async (id: string): Promise<BotCampaign> => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    const response = await fetch(`${API_BASE_URL}/campaign/archive/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to archive campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return result.campaign;
  }

  const fetchSingleCampaign = useCallback(async (campaignId: string): Promise<BotCampaign> => {
    const token = getToken()
    if (!token) {
      throw new Error("Authentication token not found.")
    }

    try {
      const response = await fetch(`${API_BASE_URL}/campaign/get/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch campaign')
      }
      
      const data = await response.json()
      // The backend returns the campaign object directly
      return data.campaign as BotCampaign

    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchCampaigns()
    }
  }, [user])

  return {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    unarchiveCampaign,
    archiveCampaign,
    refresh: fetchCampaigns,
    fetchSingleCampaign,
  }
}
