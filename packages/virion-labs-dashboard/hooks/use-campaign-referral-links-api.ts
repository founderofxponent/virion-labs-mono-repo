"use client"

import { useState, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"
import { CampaignReferralLinkRequest, CampaignReferralLinkResponse } from '@/schemas/referral'

export function useCampaignReferralLinksApi() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "http://localhost:8000"
  const getToken = () => localStorage.getItem('auth_token')

  const createCampaignReferralLink = useCallback(async (
    campaignId: number,
    linkData: Omit<CampaignReferralLinkRequest, 'campaign'>
  ): Promise<{ data: CampaignReferralLinkResponse | null; error: string | null }> => {
    if (!user) {
      const error = "User not authenticated."
      setError(error)
      return { data: null, error }
    }

    const token = getToken()
    if (!token) {
      const error = "Authentication token not found."
      setError(error)
      return { data: null, error }
    }

    setLoading(true)
    setError(null)

    try {
      // Use the correct endpoint and include campaign ID in request body
      const requestBody: CampaignReferralLinkRequest = {
        ...linkData,
        campaign: campaignId
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/influencer/referral-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to create campaign referral link')
      }

      return { data: result, error: null }

    } catch (err) {
      const error = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    createCampaignReferralLink,
    loading,
    error,
  }
}