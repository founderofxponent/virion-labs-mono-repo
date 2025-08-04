"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"
import { Campaign, CampaignListItem, CreateCampaignData, UpdateCampaignData } from "@/schemas/campaign"

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

interface ApiListResponse {
  campaigns: CampaignListItem[];
  total_count: number;
}

export type CampaignStatus = 'active' | 'archived' | 'deleted' | 'inactive'

// Helper function to determine campaign status
export function getCampaignStatus(campaign: CampaignListItem): CampaignStatus {
  // Priority order: deleted > archived > active
  if ((campaign as any).is_deleted) return 'deleted'
  if (!campaign.is_active && campaign.end_date) return 'archived'
  if (campaign.is_active) return 'active'
  return 'inactive' // fallback for edge cases
}

export function useBotCampaignsAPI(filters?: BotCampaignsFilters) {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([])
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
      setCampaigns(data.campaigns)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const createCampaign = async (data: CreateCampaignData): Promise<Campaign> => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    const response = await fetch(`${API_BASE_URL}/campaign/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
          name: data.name,
          guild_id: data.guild_id,
          client: data.client,
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
    return result;
  }

  const updateCampaign = async (id: string, data: UpdateCampaignData): Promise<Campaign> => {
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
    return result;
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

  const unarchiveCampaign = async (id: string): Promise<Campaign> => {
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
    return result;
  }

  const archiveCampaign = async (id: string): Promise<Campaign> => {
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
    return result;
  }

  const fetchSingleCampaign = useCallback(async (campaignId: string): Promise<Campaign> => {
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
      return data as Campaign

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
