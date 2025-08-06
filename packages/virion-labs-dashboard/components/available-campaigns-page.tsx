"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, MessageSquare, Building2, Terminal } from "lucide-react"
import { CreateReferralLinkDialog } from "@/components/create-referral-link-dialog"
import { useAvailableCampaignsApi } from "@/hooks/use-available-campaigns-api"
import { Campaign } from "@/schemas/campaign"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import api from "@/lib/api"

// Extended interface for available campaigns that includes access status
interface AvailableCampaign extends Campaign {
  has_access?: boolean
  request_status?: 'pending' | 'approved' | 'denied'
  discord_server_name?: string
}

export function AvailableCampaignsPage() {
  const { profile } = useAuth()
  const { campaigns, loading, error, refetch } = useAvailableCampaignsApi()
  const [selectedCampaign, setSelectedCampaign] = useState<AvailableCampaign | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

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

    console.log('🔍 DEBUG: Requesting access for campaign:', {
      campaignId: campaign.id,
      campaignName: campaign.name,
      userId: profile.id,
      apiClient: typeof api
    })

    try {
      const response = await api.post('/api/v1/operations/campaign/request-access', {
        campaign_id: campaign.id,
        user_id: profile.id,
        request_message: `I would like to request access to the "${campaign.name}" campaign to create referral links.`
      })

      console.log('🔍 DEBUG: API response:', {
        status: response.status,
        data: response.data
      })

      if (response.status === 201) {
        alert(`Access request for "${campaign.name}" has been submitted successfully. You will be notified when it's reviewed.`)
        refetch()
        console.log('✅ Access request submitted successfully')
      } else {
        console.error('❌ Failed to request access:', response.data)
        alert('Failed to submit access request. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error requesting access:', error)
      alert('An error occurred while requesting access. Please try again.')
    }
  }

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'referral_onboarding': return 'bg-blue-500'
      case 'product_promotion': return 'bg-green-500'
      case 'community_engagement': return 'bg-purple-500'
      case 'support': return 'bg-orange-500'
      case 'custom': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  const formatCampaignType = (type: string) => {
    return type?.replace('_', ' ').toUpperCase() || 'UNKNOWN'
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
        icon: Clock,
        text: 'Request Access',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
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

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message}
        </AlertDescription>
      </Alert>
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

      {campaigns && campaigns.length === 0 && (
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
        {campaigns && campaigns.map((campaign) => {
          const statusInfo = getAccessStatusInfo(campaign)
          const StatusIcon = statusInfo.icon

          return (
            <div key={campaign.id} className="bg-white border rounded-lg p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-8">
                {/* Left side - Campaign info - Better distributed */}
                <div className="flex-1 min-w-0">
                  {/* Header row with campaign name and type */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {campaign.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{campaign.client_name}</span>
                        <span>•</span>
                        <span>{campaign.client_industry}</span>
                      </div>
                    </div>
                    <Badge
                      className={`${getCampaignTypeColor(campaign.campaign_type || 'custom')} text-white text-xs px-3 py-1 shrink-0`}
                    >
                      {formatCampaignType(campaign.campaign_type || 'custom')}
                    </Badge>
                  </div>

                  {/* Description - full width */}
                  {campaign.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      {campaign.description.length > 150
                        ? campaign.description.substring(0, 150) + '...'
                        : campaign.description}
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
                    disabled={false}
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