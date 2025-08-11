"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useBotCampaignsAPI } from "@/hooks/use-bot-campaigns-api"
import { Campaign } from "@/schemas/campaign"
import { CampaignReferralLandingPage } from "@/components/campaign-referral-landing-page"
import { Skeleton } from "@/components/ui/skeleton"

// This page should not be prerendered
export const dynamic = 'force-dynamic';

// This is a mock structure for the CampaignData expected by the landing page
// We build this from the actual campaign data fetched from the API
const createMockCampaignData = (campaign: Campaign) => ({
  referral_link: {
    id: "mock-referral-id",
    title: "Mock Referral Link",
    description: "This is a preview of the referral landing page.",
    platform: "discord",
    discord_invite_url: "https://discord.gg/mock-invite",
    influencer_id: "mock-influencer-id",
  },
  campaign: {
    id: campaign.documentId || campaign.id,
    campaign_name: campaign.name,
    campaign_type: campaign.campaign_type || 'referral_onboarding',
    guild_id: campaign.guild_id,
    welcome_message: campaign.welcome_message || "Welcome to the campaign!",
    brand_color: campaign.brand_color || '#3B82F6',
    brand_logo_url: campaign.brand_logo_url || '',
    metadata: campaign.metadata || {},
    offer_title: campaign.name,
    offer_description: campaign.description,
    offer_highlights: campaign.features || [],
    offer_value: `$${campaign.value_per_conversion || '5'} Value`,
    offer_expiry_date: campaign.end_date,
    hero_image_url: campaign.brand_logo_url || '',
    product_images: [],
    video_url: '',
    what_you_get: 'Full access to our exclusive community and special rewards.',
    how_it_works: '1. Join the server.\n2. Complete the onboarding.\n3. Get rewards!',
    requirements: 'A Discord account is required.',
    support_info: 'For support, contact us at support@example.com.',
    clients: {
      name: campaign.client?.name || 'Client Name',
      industry: campaign.client?.industry || 'Tech',
      logo: campaign.client?.website || '',
    },
  },
  influencer: {
    full_name: "Preview Influencer",
    avatar_url: "",
  },
})

function CampaignPreviewContent() {
  const searchParams = useSearchParams()
  const campaignId = searchParams.get('campaignId')
  const { fetchSingleCampaign } = useBotCampaignsAPI()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (campaignId) {
      fetchSingleCampaign(campaignId)
        .then(data => {
          setCampaign(data)
          setLoading(false)
        })
        .catch(err => {
          setError(err.message)
          setLoading(false)
        })
    } else {
      setError("No campaign ID provided.")
      setLoading(false)
    }
  }, [campaignId, fetchSingleCampaign])

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>
  }

  if (!campaign) {
    return <div className="p-8">Campaign not found.</div>
  }

  const mockData = createMockCampaignData(campaign)

  return <CampaignReferralLandingPage campaign={mockData} />
}

export default function CampaignPreviewPage() {
  return (
    <Suspense fallback={
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    }>
      <CampaignPreviewContent />
    </Suspense>
  )
}