"use client"

import { useEffect, useState } from 'react'
import { CampaignResponsesPage } from "@/components/campaign-responses-page"
import { useBotCampaignsAPI } from "@/hooks/use-bot-campaigns-api"
import { Campaign } from "@/schemas/campaign"

interface CampaignResponsesPageWrapperProps {
  campaignId: string
}

export function CampaignResponsesPageWrapper({ campaignId }: CampaignResponsesPageWrapperProps) {
  const { fetchSingleCampaign } = useBotCampaignsAPI()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        setLoading(true)
        const campaignData = await fetchSingleCampaign(campaignId)
        setCampaign(campaignData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaign')
      } finally {
        setLoading(false)
      }
    }
    
    loadCampaign()
  }, [campaignId, fetchSingleCampaign])
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading campaign...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <CampaignResponsesPage 
      campaignId={campaignId}
      campaignName={campaign?.name}
    />
  )
}