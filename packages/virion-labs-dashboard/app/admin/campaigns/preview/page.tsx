"use client"

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CampaignReferralLandingPage } from '@/components/campaign-referral-landing-page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface CampaignData {
  referral_link: {
    id: string
    title: string
    description: string
    platform: string
    discord_invite_url?: string
    influencer_id: string
  }
  campaign: {
    id: string
    campaign_name: string
    campaign_type: string
    guild_id: string
    welcome_message: string
    brand_color: string
    brand_logo_url: string
    metadata: any
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
    clients: {
      name: string
      industry: string
      logo: string
    }
  }
  influencer: {
    full_name: string
    avatar_url: string
  }
}

function CampaignPreviewContent() {
  const searchParams = useSearchParams()
  const campaignId = searchParams.get('campaignId')
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!campaignId) {
      setError('No campaign ID provided')
      setLoading(false)
      return
    }

    const fetchCampaignPreview = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const token = localStorage.getItem('auth_token')
        
        if (!token) {
          throw new Error('Authentication token not found')
        }
        
        const response = await fetch(`${apiUrl}/api/v1/operations/campaign/preview/${campaignId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch campaign preview')
        }
        
        const data = await response.json()
        setCampaignData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaign preview')
      } finally {
        setLoading(false)
      }
    }

    fetchCampaignPreview()
  }, [campaignId])

  if (loading) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!campaignData) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested campaign could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaign Preview</h1>
          <p className="text-gray-600">This is how your campaign will appear to users</p>
        </div>
        
        <CampaignReferralLandingPage campaign={campaignData} />
      </div>
    </div>
  )
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