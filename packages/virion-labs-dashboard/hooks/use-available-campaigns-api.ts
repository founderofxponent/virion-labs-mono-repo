"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"

// TODO: Define the new API-based types for available campaigns
export interface AvailableCampaign {
  id: string;
  campaign_name: string;
  client_name: string;
  description: string;
  status: string;
}

export function useAvailableCampaignsApi() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<AvailableCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "http://localhost:8000"
  const getToken = () => localStorage.getItem('auth_token')

  const fetchCampaigns = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const token = getToken()

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/operations/campaign/available`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch available campaigns')
      }
      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const createReferralLink = useCallback(async (campaignId: string, linkData: any) => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/influencer/campaigns/${campaignId}/referral-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(linkData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create referral link')
      }

      // No need to refetch campaigns, as this doesn't change the list of available campaigns.
      // The component that uses this function will handle the success case.

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }, [])

  return {
    campaigns,
    createReferralLink,
    loading,
    error,
    refetch: fetchCampaigns,
  }
}