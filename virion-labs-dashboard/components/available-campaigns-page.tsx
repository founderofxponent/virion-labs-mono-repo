"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Users, MessageSquare, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"
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
      // TODO: Show access request dialog or message
      console.log('Access required for campaign:', campaign.campaign_name)
      return
    }
    setSelectedCampaign(campaign)
    setShowCreateDialog(true)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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
          Browse and create referral links for campaigns you have access to
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.campaign_id} className="relative hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg leading-6">{campaign.campaign_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {campaign.client_name} • {campaign.client_industry}
                  </p>
                </div>
                <Badge 
                  className={`${getCampaignTypeColor(campaign.campaign_type)} text-white text-xs`}
                >
                  {formatCampaignType(campaign.campaign_type)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Campaign Description */}
              {campaign.campaign_description && (
                <p className="text-sm text-muted-foreground">
                  {campaign.campaign_description}
                </p>
              )}

              {/* Discord Server Info */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Discord Server</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.discord_server_name || 'Discord Community'}
                  </p>
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{campaign.total_interactions}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Interactions</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{campaign.referral_conversions}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Conversions</p>
                </div>
              </div>

              {/* Campaign Dates */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Started: {formatDate(campaign.campaign_start_date)}</span>
                </div>
                {campaign.campaign_end_date && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Ends: {formatDate(campaign.campaign_end_date)}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Access Status & Action */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {campaign.has_access ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">Access Granted</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600 font-medium">Access Required</span>
                    </>
                  )}
                </div>

                <Button 
                  onClick={() => handleCreateLink(campaign)}
                  disabled={!campaign.has_access}
                  className="w-full"
                  variant={campaign.has_access ? "default" : "outline"}
                >
                  {campaign.has_access ? 'Create Referral Link' : 'Request Access'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateReferralLinkDialog
        campaign={selectedCampaign}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false)
          // Optionally redirect to links page or show success message
          console.log('Referral link created successfully!')
        }}
      />
    </div>
  )
} 