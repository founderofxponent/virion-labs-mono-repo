"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'

export interface AvailableCampaign {
  id: string
  campaign_name: string
  campaign_type: string
  client_name: string
  client_industry: string
  client_logo: string | null
  description: string
  discord_server: string
  target_audience: string
  campaign_end_date: string | null
  requirements: string[]
  estimated_earnings: string
  commission_rate: string
  created_at: string
}

export interface CampaignReferralLink {
  id: string
  title: string
  description: string | null
  platform: string
  original_url: string
  referral_code: string
  referral_url: string
  thumbnail_url: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
  campaign_context: {
    campaign_id: string
    campaign_name: string
    client_name: string
  }
}

export function useAvailableCampaigns() {
  const [campaigns, setCampaigns] = useState<AvailableCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Fetch available campaigns
  const fetchCampaigns = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/campaigns/available')
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns')
      }
      
      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Create referral link for a specific campaign
  const createReferralLink = async (
    campaignId: string, 
    linkData: {
      title: string
      description?: string
      platform: string
      original_url: string
      thumbnail_url?: string
      expires_at?: string
    }
  ) => {
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    try {
      setError(null)
      
      const response = await fetch(`/api/campaigns/${campaignId}/referral-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...linkData,
          influencer_id: user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create referral link')
      }
      
      const data = await response.json()
      return { data: data.referral_link, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Filter campaigns by type
  const filterCampaignsByType = (type: string) => {
    if (type === 'all') return campaigns
    return campaigns.filter(campaign => campaign.campaign_type === type)
  }

  // Filter campaigns by client
  const filterCampaignsByClient = (clientName: string) => {
    if (clientName === 'all') return campaigns
    return campaigns.filter(campaign => campaign.client_name === clientName)
  }

  // Get unique campaign types
  const getCampaignTypes = () => {
    const types = campaigns.map(campaign => campaign.campaign_type)
    return [...new Set(types)]
  }

  // Get unique clients
  const getClients = () => {
    const clients = campaigns.map(campaign => campaign.client_name)
    return [...new Set(clients)]
  }

  // Get campaign by ID
  const getCampaignById = (id: string) => {
    return campaigns.find(campaign => campaign.id === id)
  }

  // Format campaign type for display
  const formatCampaignType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Check if campaign is ending soon (within 7 days)
  const isCampaignEndingSoon = (campaign: AvailableCampaign) => {
    if (!campaign.campaign_end_date) return false
    
    const endDate = new Date(campaign.campaign_end_date)
    const now = new Date()
    const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    return daysUntilEnd <= 7 && daysUntilEnd > 0
  }

  // Get campaign statistics
  const getCampaignStats = () => {
    const totalCampaigns = campaigns.length
    const campaignTypes = getCampaignTypes().length
    const clients = getClients().length
    const endingSoon = campaigns.filter(isCampaignEndingSoon).length

    return {
      totalCampaigns,
      campaignTypes,
      clients,
      endingSoon
    }
  }

  // Initialize data fetch
  useEffect(() => {
    fetchCampaigns()
  }, [user])

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    createReferralLink,
    filterCampaignsByType,
    filterCampaignsByClient,
    getCampaignTypes,
    getClients,
    getCampaignById,
    formatCampaignType,
    isCampaignEndingSoon,
    getCampaignStats
  }
} 