"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, MessageSquare, Building2 } from "lucide-react"
import { CreateReferralLinkDialog } from "@/components/create-referral-link-dialog"

interface AvailableCampaign {
  campaign_id: string
  campaign_name: string
  campaign_type: string
  client_name: string
  client_industry: string
  guild_id: string
  discord_server_name: string
  campaign_description: string
  campaign_start_date: string
  campaign_end_date: string | null
  total_interactions: number
  referral_conversions: number
  has_access: boolean
  request_status: string
  can_request_access: boolean
}

export function AvailableCampaignsPage() {
  const { profile } = useAuth()
  const [campaigns, setCampaigns] = useState<AvailableCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<AvailableCampaign | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    if (profile?.id) {
      fetchAvailableCampaigns()
    }
  }, [profile?.id])

  const fetchAvailableCampaigns = async () => {
    try {
      const response = await fetch(`/api/campaigns/available?influencer_id=${profile?.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setCampaigns(data.campaigns || [])
      } else {
        console.error('Failed to fetch campaigns:', data.error)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = (campaign: AvailableCampaign) => {
    if (!campaign.has_access) {
      handleRequestAccess(campaign)
      return
    }
    setSelectedCampaign(campaign)
    setShowCreateDialog(true)
  }

  const handleRequestAccess = async (campaign: AvailableCampaign) => {
    if (!profile?.id) return

    try {
      const response = await fetch(`/api/campaigns/${campaign.campaign_id}/request-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          influencer_id: profile.id,
          message: `I would like to request access to the "${campaign.campaign_name}" campaign to create referral links.`
        })
      })

      const data = await response.json()

      if (response.ok) {
        fetchAvailableCampaigns()
        console.log('Access request submitted successfully')
      } else {
        console.error('Failed to request access:', data.error)
      }
    } catch (error) {
      console.error('Error requesting access:', error)
    }
  }

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'referral_onboarding': return 'bg-blue-500'
      case 'product_promotion': return 'bg-green-500'
      case 'community_engagement': return 'bg-purple-500'
      case 'support': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const formatCampaignType = (type: string) => {
    return type.replace('_', ' ').toUpperCase()
  }

  const getAccessStatusInfo = (campaign: AvailableCampaign) => {
    if (campaign.has_access) {
      return {
        icon: CheckCircle,
        text: 'Ready to Go',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    } else if (campaign.request_status === 'pending') {
      return {
        icon: Clock,
        text: 'Request Pending',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      }
    } else if (campaign.request_status === 'denied') {
      return {
        icon: XCircle,
        text: 'Access Denied',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    } else {
      return {
        icon: XCircle,
        text: 'Request Access',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    }
  }

  const getButtonText = (campaign: AvailableCampaign) => {
    if (campaign.has_access) return 'Create Link'
    if (campaign.request_status === 'pending') return 'Pending...'
    if (campaign.request_status === 'denied') return 'Request Again'
    return 'Request Access'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-muted-foreground">Loading campaigns...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Available Campaigns</h1>
        <p className="text-muted-foreground">
          Browse campaigns and create referral links
        </p>
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              No campaigns available at the moment
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later or contact support for access to campaigns!
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const statusInfo = getAccessStatusInfo(campaign)
          const StatusIcon = statusInfo.icon

          return (
            <div key={campaign.campaign_id} className="bg-white border rounded-lg p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-8">
                {/* Left side - Campaign info - Better distributed */}
                <div className="flex-1 min-w-0">
                  {/* Header row with campaign name and type */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {campaign.campaign_name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{campaign.client_name}</span>
                        <span>•</span>
                        <span>{campaign.client_industry}</span>
                      </div>
                    </div>
                    <Badge 
                      className={`${getCampaignTypeColor(campaign.campaign_type)} text-white text-xs px-3 py-1 shrink-0`}
                    >
                      {formatCampaignType(campaign.campaign_type)}
                    </Badge>
                  </div>

                  {/* Description - full width */}
                  {campaign.campaign_description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      {campaign.campaign_description.length > 150 
                        ? campaign.campaign_description.substring(0, 150) + '...' 
                        : campaign.campaign_description}
                    </p>
                  )}

                  {/* Discord info */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MessageSquare className="h-4 w-4" />
                    <span>{campaign.discord_server_name || 'Discord Community'}</span>
                  </div>
                </div>

                {/* Right side - Status & action - Compact but prominent */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                    <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                    <span className={`text-sm font-medium ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>

                  <Button 
                    onClick={() => handleCreateLink(campaign)}
                    disabled={!campaign.has_access && !campaign.can_request_access}
                    size="sm"
                    variant={campaign.has_access ? "default" : "outline"}
                    className="min-w-[120px] px-4"
                  >
                    {getButtonText(campaign)}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <CreateReferralLinkDialog
        campaign={selectedCampaign}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false)
          console.log('Referral link created successfully!')
        }}
      />
    </div>
  )
} 