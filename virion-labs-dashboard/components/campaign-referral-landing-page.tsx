"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ExternalLink, 
  Users, 
  MessageSquare, 
  Star, 
  Shield, 
  Zap,
  Clock,
  ChevronRight 
} from "lucide-react"

interface CampaignData {
  referral_link: {
    id: string
    title: string
    description: string
    platform: string
    discord_invite_url: string
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

interface Props {
  referralCode: string
}

export function CampaignReferralLandingPage({ referralCode }: Props) {
  const [data, setData] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    fetchCampaignData()
    // Track the click
    trackClick()
  }, [referralCode])

  const fetchCampaignData = async () => {
    try {
      const response = await fetch(`/api/referral/${referralCode}/campaign`)
      const result = await response.json()
      
      if (response.ok) {
        setData(result)
      } else {
        setError(result.error || 'Failed to load campaign')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const trackClick = async () => {
    try {
      // This will be handled by the existing referral tracking system
      await fetch(`/api/referral/${referralCode}`, { method: 'HEAD' })
    } catch (error) {
      console.error('Failed to track click:', error)
    }
  }

  const handleJoinDiscord = () => {
    if (data?.referral_link.discord_invite_url) {
      setJoining(true)
      // Open Discord invite in new tab
      window.open(data.referral_link.discord_invite_url, '_blank')
      
      // Reset joining state after a few seconds
      setTimeout(() => setJoining(false), 3000)
    }
  }

  const getCampaignTypeLabel = (type: string) => {
    return type.replace('_', ' ').toUpperCase()
  }

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'referral_onboarding': return <Users className="h-5 w-5" />
      case 'product_promotion': return <Star className="h-5 w-5" />
      case 'community_engagement': return <MessageSquare className="h-5 w-5" />
      case 'support': return <Shield className="h-5 w-5" />
      default: return <Zap className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <ExternalLink className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Link Not Found</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const { referral_link, campaign, influencer } = data
  const brandColor = campaign.brand_color || '#3B82F6'

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ 
        background: `linear-gradient(135deg, ${brandColor}15, ${brandColor}05, #f8fafc)` 
      }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          {campaign.brand_logo_url ? (
            <div className="flex justify-center">
              <img 
                src={campaign.brand_logo_url} 
                alt={campaign.clients.name}
                className="h-20 max-w-48 object-contain"
              />
            </div>
          ) : (
            <div 
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: brandColor }}
            >
              {campaign.clients.name.charAt(0)}
            </div>
          )}
          
          <div className="space-y-2">
            <Badge 
              className="text-white mb-4"
              style={{ backgroundColor: brandColor }}
            >
              {getCampaignTypeIcon(campaign.campaign_type)}
              <span className="ml-2">{getCampaignTypeLabel(campaign.campaign_type)}</span>
            </Badge>
            
            <h1 className="text-4xl font-bold text-gray-900">
              {campaign.campaign_name}
            </h1>
            <p className="text-xl text-gray-600">
              by {campaign.clients.name}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Main Campaign Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{referral_link.title}</CardTitle>
                {referral_link.description && (
                  <p className="text-muted-foreground text-lg">
                    {referral_link.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Campaign Welcome Message */}
                {campaign.welcome_message && (
                  <div 
                    className="p-6 rounded-lg text-white relative overflow-hidden"
                    style={{ backgroundColor: brandColor }}
                  >
                    <div className="relative z-10">
                      <h3 className="font-semibold mb-2">Welcome Message</h3>
                      <p className="leading-relaxed">{campaign.welcome_message}</p>
                    </div>
                    <div className="absolute top-0 right-0 opacity-10">
                      <MessageSquare className="h-32 w-32" />
                    </div>
                  </div>
                )}

                {/* Call to Action */}
                <div className="text-center space-y-4 p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-2xl font-semibold">Ready to Join?</h3>
                  <p className="text-muted-foreground text-lg">
                    Click below to join the Discord community and get started with exclusive access!
                  </p>

                  <Button 
                    onClick={handleJoinDiscord}
                    disabled={joining}
                    className="h-14 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    style={{ backgroundColor: brandColor }}
                  >
                    <MessageSquare className="mr-3 h-6 w-6" />
                    {joining ? "Opening Discord..." : "Join Discord Server"}
                    <ChevronRight className="ml-3 h-6 w-6" />
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    You'll be taken to Discord where our bot will welcome you with 
                    campaign-specific information and exclusive benefits.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Section */}
            <Card>
              <CardHeader>
                <CardTitle>What You'll Get</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Exclusive Community</h4>
                      <p className="text-sm text-muted-foreground">
                        Join a vibrant community of like-minded individuals with special access
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Star className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Premium Perks</h4>
                      <p className="text-sm text-muted-foreground">
                        Get exclusive content, early access, and special offers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Dedicated Support</h4>
                      <p className="text-sm text-muted-foreground">
                        Direct access to support team and priority assistance
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Instant Access</h4>
                      <p className="text-sm text-muted-foreground">
                        Immediate setup with automated onboarding process
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Influencer Attribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommended by</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {influencer.avatar_url ? (
                    <img 
                      src={influencer.avatar_url}
                      alt={influencer.full_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                      style={{ backgroundColor: brandColor }}
                    >
                      {influencer.full_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-lg">{influencer.full_name}</p>
                    <p className="text-sm text-muted-foreground">Trusted Referrer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Discord Server</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.metadata?.discord_server_name || 'Discord Community'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Industry</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.clients.industry}
                    </p>
                  </div>
                </div>

                <Separator />

                <Button 
                  onClick={handleJoinDiscord}
                  disabled={joining}
                  className="w-full"
                  style={{ backgroundColor: brandColor }}
                >
                  {joining ? "Joining..." : "Join Now"}
                </Button>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <Shield className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Secure & Trusted</p>
                    <p className="text-sm text-muted-foreground">
                      Powered by Virion Labs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground border-t pt-8">
          <p>
            Powered by <span className="font-semibold">Virion Labs</span> • 
            Campaign: {campaign.campaign_name} • 
            Referral Code: <code className="font-mono">{referralCode}</code>
          </p>
        </div>
      </div>
    </div>
  )
} 