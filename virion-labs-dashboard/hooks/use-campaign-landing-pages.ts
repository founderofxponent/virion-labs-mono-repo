import { useState, useEffect } from 'react'
import { CampaignLandingPage, CampaignLandingPageInsert, CampaignLandingPageUpdate } from '@/lib/supabase'

export function useCampaignLandingPage(campaignId: string | null) {
  const [landingPage, setLandingPage] = useState<CampaignLandingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLandingPage = async () => {
    if (!campaignId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/campaign-landing-pages?campaign_id=${campaignId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setLandingPage(data.landing_page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch landing page')
      console.error('Error fetching campaign landing page:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (campaignId) {
      fetchLandingPage()
    } else {
      // For create mode (no campaignId), set loading to false immediately
      setLoading(false)
    }
  }, [campaignId])

  const createOrUpdateLandingPage = async (data: Omit<CampaignLandingPageInsert, 'campaign_id'> & { campaign_id?: string }): Promise<CampaignLandingPage> => {
    const actualCampaignId = data.campaign_id || campaignId
    if (!actualCampaignId) {
      throw new Error('Campaign ID is required to save landing page')
    }

    const method = landingPage ? 'PUT' : 'POST'
    const response = await fetch('/api/campaign-landing-pages', {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign_id: actualCampaignId,
        ...data,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to save landing page')
    }

    const result = await response.json()
    setLandingPage(result.landing_page)
    return result.landing_page
  }

  const updateLandingPage = async (data: Partial<CampaignLandingPageUpdate>): Promise<CampaignLandingPage> => {
    if (!campaignId) {
      throw new Error('Campaign ID is required to update landing page')
    }
    
    if (!landingPage) {
      throw new Error('No landing page to update')
    }

    const response = await fetch('/api/campaign-landing-pages', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        ...data,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update landing page')
    }

    const result = await response.json()
    setLandingPage(result.landing_page)
    return result.landing_page
  }

  const deleteLandingPage = async (): Promise<void> => {
    if (!campaignId) {
      throw new Error('Campaign ID is required to delete landing page')
    }

    const response = await fetch(`/api/campaign-landing-pages?campaign_id=${campaignId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete landing page')
    }

    setLandingPage(null)
  }

  const refresh = () => {
    if (campaignId) {
      fetchLandingPage()
    }
  }

  return {
    landingPage,
    loading,
    error,
    createOrUpdateLandingPage,
    updateLandingPage,
    deleteLandingPage,
    refresh,
  }
} 