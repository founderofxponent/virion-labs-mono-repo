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
import { VideoPlayer } from "@/components/ui/video-player"
import { toast } from "@/components/ui/use-toast"

interface CampaignData {
  referral_link: {
    id: string
    title: string
    description: string
    platform: string
    discord_invite_url: string
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
    // New landing page fields
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

interface Props {
  referralCode?: string
  campaign?: CampaignData
}

export function CampaignReferralLandingPage({ referralCode, campaign: mockCampaign }: Props) {
  const [data, setData] = useState<CampaignData | null>(mockCampaign || null)
  const [loading, setLoading] = useState(!mockCampaign)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (mockCampaign) return

    if (referralCode) {
      fetchCampaignData()
      // Track the click
      trackClick()
    } else {
      setError("No referral code provided.")
      setLoading(false)
    }
  }, [referralCode, mockCampaign])

  const fetchCampaignData = async () => {
    try {
      const businessLogicApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${businessLogicApiUrl}/api/v1/tracking/campaign/${referralCode}`)
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
      // Track click via business logic API
      const businessLogicApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      await fetch(`${businessLogicApiUrl}/api/v1/tracking/click/${referralCode}`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_agent: navigator.userAgent,
          referrer: document.referrer || '',
          device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
        })
      })
    } catch (error) {
      console.error('Failed to track click:', error)
    }
  }

  const handleJoinDiscord = async () => {
    setJoining(true);
    try {
      const businessLogicApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${businessLogicApiUrl}/api/v1/integrations/discord/create-managed-invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify({ referral_code: referralCode }),
      });

      const result = await response.json();

      if (response.ok && result.invite_url) {
        window.location.href = result.invite_url;
      } else {
        // Fallback to old URL if API fails, and alert the user.
        toast({
          title: "Could not create a tracked invite.",
          description: result.message || "Redirecting you to a general invite. You may need to enter the referral code manually.",
          variant: "destructive",
        })
        if (data?.referral_link.discord_invite_url) {
          window.location.href = data.referral_link.discord_invite_url;
        } else {
          setError("This campaign's Discord invite is not available.");
          setJoining(false);
        }
      }
    } catch (error) {
      console.error('Error creating managed invite:', error);
      setError('Failed to create a secure invite link. Please try again.');
      setJoining(false);
    }
  };

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
              {campaign.offer_title || campaign.campaign_name}
            </h1>
            <p className="text-xl text-gray-600">
              by {campaign.clients.name}
            </p>
            {campaign.offer_value && (
              <div className="mt-4">
                <Badge variant="outline" className="text-lg px-4 py-2 border-2" style={{ borderColor: brandColor, color: brandColor }}>
                  {campaign.offer_value}
                </Badge>
              </div>
            )}
            {campaign.offer_expiry_date && (
              <div className="mt-2">
                <Badge variant="outline" className="text-sm px-3 py-1 border-orange-200 text-orange-700">
                  <Clock className="h-4 w-4 mr-1" />
                  Expires: {new Date(campaign.offer_expiry_date).toLocaleDateString()}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Hero Image */}
        {campaign.hero_image_url && (
          <div className="relative rounded-xl overflow-hidden shadow-lg">
            <img 
              src={campaign.hero_image_url} 
              alt={campaign.offer_title || campaign.campaign_name}
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                  {campaign.offer_title || campaign.campaign_name}
                </h2>
                {campaign.offer_description && (
                  <p className="text-lg md:text-xl opacity-90">
                    {campaign.offer_description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Main Campaign Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {campaign.offer_title || referral_link.title}
                </CardTitle>
                {(campaign.offer_description || referral_link.description) && (
                  <p className="text-muted-foreground text-lg">
                    {campaign.offer_description || referral_link.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Offer Highlights */}
                {campaign.offer_highlights && campaign.offer_highlights.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-lg mb-4">What's Included:</h3>
                    <ul className="space-y-2">
                      {campaign.offer_highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5"
                            style={{ backgroundColor: brandColor }}
                          >
                            ✓
                          </div>
                          <span className="text-gray-700">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
                    {joining ? "Redirecting to Discord..." : "Join Discord Server"}
                    <ChevronRight className="ml-3 h-6 w-6" />
                  </Button>

                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      You'll be taken to Discord where our bot will automatically welcome you with 
                      campaign-specific information and exclusive benefits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What You Get Section */}
            {campaign.what_you_get && (
              <Card>
                <CardHeader>
                  <CardTitle>What You'll Get</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {campaign.what_you_get}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How It Works Section */}
            {campaign.how_it_works && (
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    {campaign.how_it_works.includes('\n') ? (
                      <div className="space-y-3">
                        {campaign.how_it_works.split('\n').filter(step => step.trim()).map((step, index) => {
                          const trimmedStep = step.trim()
                          
                          const isNumberedStep = /^\d+[.\)]/.test(trimmedStep)
                          
                          return (
                            <div key={index} className={`flex gap-3 ${isNumberedStep ? 'items-start' : ''}`}>
                              {isNumberedStep && (
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5"
                                  style={{ backgroundColor: brandColor }}
                                >
                                  {index + 1}
                                </div>
                              )}
                              <div className={`text-gray-700 leading-relaxed ${isNumberedStep ? 'flex-1' : ''}`}>
                                {isNumberedStep ? trimmedStep.replace(/^\d+[.\)]\s*/, '') : trimmedStep}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {campaign.how_it_works}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Images */}
            {campaign.product_images && campaign.product_images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {campaign.product_images.map((image, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden shadow-md">
                        <img 
                          src={image} 
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(image, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Section */}
            {campaign.video_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Watch Demo</CardTitle>
                </CardHeader>
                <CardContent>
                  <VideoPlayer
                    url={campaign.video_url}
                    title={`${campaign.offer_title || campaign.campaign_name} Demo`}
                    aspectRatio="16/9"
                    showProvider={true}
                    onError={(error) => console.error('Video error:', error)}
                  />
                </CardContent>
              </Card>
            )}
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
                      {influencer.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-lg">{influencer.full_name || 'Unknown Influencer'}</p>
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

            {/* Requirements */}
            {campaign.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {campaign.requirements}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Support Info */}
            {campaign.support_info && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {campaign.support_info}
                  </p>
                </CardContent>
              </Card>
            )}

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