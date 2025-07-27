"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"
import { BotCampaign, BotCampaignsFilters, CreateBotCampaignData } from './use-bot-campaigns'

// This is the actual shape of the data from the API
interface ApiCampaign {
  id: string;
  documentId?: string;
  attributes: Omit<BotCampaign, 'id' | 'documentId'>;
}

interface ApiListResponse {
  campaigns: ApiCampaign[];
  total_count: number;
}

export type CampaignStatus = 'active' | 'paused' | 'archived' | 'deleted' | 'inactive'

// Helper function to determine campaign status
export function getCampaignStatus(campaign: BotCampaign): CampaignStatus {
  // Priority order: deleted > archived > paused > active
  if (campaign.is_deleted) return 'deleted'
  if (!campaign.is_active && campaign.campaign_end_date) return 'archived'
  if (!campaign.is_active && campaign.paused_at) return 'paused'
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

  const transformApiCampaign = (apiCampaign: ApiCampaign): BotCampaign => {
    return {
      id: apiCampaign.id,
      documentId: apiCampaign.documentId,
      ...apiCampaign.attributes,
    }
  }

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
    return transformApiCampaign(result.campaign)
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
    return transformApiCampaign(result.campaign)
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

  const pauseCampaign = async (id: string): Promise<BotCampaign> => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    const response = await fetch(`${API_BASE_URL}/campaign/pause/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to pause campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return transformApiCampaign(result.campaign)
  }

  const resumeCampaign = async (id: string): Promise<BotCampaign> => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    const response = await fetch(`${API_BASE_URL}/campaign/resume/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to resume campaign')
    }

    const result = await response.json()
    await fetchCampaigns() // Refresh the list
    return transformApiCampaign(result.campaign)
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
    return transformApiCampaign(result.campaign)
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
    pauseCampaign,
    resumeCampaign,
    archiveCampaign,
    refresh: fetchCampaigns,
    fetchSingleCampaign,
  }
}
