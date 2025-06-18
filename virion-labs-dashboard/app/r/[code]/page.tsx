"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Clock, CheckCircle, XCircle, Pause, Archive, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { CampaignReferralLandingPage } from '@/components/campaign-referral-landing-page'

interface ReferralLinkData {
  link_disabled?: boolean
  referral_link: {
    id: string
    title: string
    description?: string
    platform: string
    influencer_id: string
  }
  campaign?: {
    id: string
    campaign_name: string
    campaign_type: string
    brand_color: string
    brand_logo_url?: string
    clients: {
      name: string
      industry: string
      logo?: string
    }
  }
  influencer: {
    full_name: string
    avatar_url?: string
  }
  status?: {
    reason: string
    message: string
    can_reactivate: boolean
    estimated_reactivation?: string
    last_change?: {
      action: string
      timestamp: string
      reason?: string
    }
  }
}

export default function ReferralLinkPage() {
  const params = useParams()
  const [linkData, setLinkData] = useState<ReferralLinkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLinkData = async () => {
      try {
        // Add timestamp to bust cache
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/referral/${params.code}/campaign?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setLinkData(data)
        } else if (response.status === 423) {
          // Handle disabled link (HTTP 423 = Locked)
          const data = await response.json()
          setLinkData(data)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Referral link not found')
        }
      } catch (err) {
        setError('Failed to load referral link')
      } finally {
        setLoading(false)
      }
    }

    if (params.code) {
      fetchLinkData()
    }
  }, [params.code])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-muted-foreground">Loading referral link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h1 className="text-xl font-semibold text-red-900">Link Not Found</h1>
              <p className="text-red-700">{error}</p>
              <Button onClick={() => window.location.href = '/'} variant="outline">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!linkData) {
    return null
  }

  // Handle disabled link with branded experience
  if (linkData.link_disabled) {
    const getStatusIcon = () => {
      switch (linkData.status?.reason) {
        case 'campaign_paused':
          return <Pause className="h-12 w-12 text-yellow-500" />
        case 'campaign_archived':
          return <Archive className="h-12 w-12 text-orange-500" />
        case 'campaign_deleted':
          return <Trash2 className="h-12 w-12 text-red-500" />
        default:
          return <AlertCircle className="h-12 w-12 text-gray-500" />
      }
    }

    const getStatusColor = () => {
      switch (linkData.status?.reason) {
        case 'campaign_paused':
          return 'from-yellow-50 to-yellow-100'
        case 'campaign_archived':
          return 'from-orange-50 to-orange-100'
        case 'campaign_deleted':
          return 'from-red-50 to-red-100'
        default:
          return 'from-gray-50 to-gray-100'
      }
    }

    const getStatusBadge = () => {
      switch (linkData.status?.reason) {
        case 'campaign_paused':
          return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Temporarily Paused</Badge>
        case 'campaign_archived':
          return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Campaign Completed</Badge>
        case 'campaign_deleted':
          return <Badge variant="destructive">No Longer Available</Badge>
        default:
          return <Badge variant="secondary">Inactive</Badge>
      }
    }

    return (
      <div className={`min-h-screen bg-gradient-to-br ${getStatusColor()} flex items-center justify-center p-4`}>
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center pb-6">
            {linkData.campaign?.brand_logo_url ? (
              <img
                src={linkData.campaign.brand_logo_url}
                alt={linkData.campaign.clients.name}
                className="h-16 mx-auto mb-4"
              />
            ) : (
              <div 
                className="h-16 w-16 rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: linkData.campaign?.brand_color || '#6366f1' }}
              >
                {linkData.campaign?.clients.name?.charAt(0) || 'C'}
              </div>
            )}
            <div className="space-y-2">
              {getStatusIcon()}
              <CardTitle className="text-2xl">
                {linkData.referral_link.title}
              </CardTitle>
              {getStatusBadge()}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                {linkData.campaign?.campaign_name}
              </h2>
              <p className="text-muted-foreground text-lg">
                {linkData.status?.message}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Campaign by</p>
                <p className="text-lg">{linkData.campaign?.clients.name}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Shared by</p>
                <p className="text-lg">{linkData.influencer.full_name}</p>
              </div>
              {linkData.referral_link.platform && (
                <div>
                  <p className="font-medium text-muted-foreground">Platform</p>
                  <p className="text-lg">{linkData.referral_link.platform}</p>
                </div>
              )}
              {linkData.status?.last_change && (
                <div>
                  <p className="font-medium text-muted-foreground">Status changed</p>
                  <p className="text-lg">{format(new Date(linkData.status.last_change.timestamp), 'PPP')}</p>
                </div>
              )}
            </div>

            {linkData.status?.can_reactivate && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <p className="text-yellow-800 font-medium">Good news!</p>
                </div>
                <p className="text-yellow-700 mt-1">
                  This campaign is only temporarily paused. Check back soon or contact the influencer for updates.
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <Button onClick={() => window.location.href = '/'} variant="outline">
                Visit Virion Labs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle active campaign with original landing page component
  return <CampaignReferralLandingPage referralCode={params.code as string} />
} 