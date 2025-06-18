import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    // Get referral link first (regardless of active status for better UX)
    const { data: referralData, error: referralError } = await supabase
      .from('referral_links')
      .select('id, title, description, platform, discord_invite_url, landing_page_enabled, is_active, expires_at, campaign_id, influencer_id, metadata')
      .eq('referral_code', code)
      .single()

    if (referralError || !referralData) {
      return NextResponse.json(
        { error: 'Referral link not found' },
        { status: 404 }
      )
    }

    // Check if link has expired
    if (referralData.expires_at && new Date(referralData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Referral link has expired' },
        { status: 410 }
      )
    }

    // Check if landing page is enabled
    if (!referralData.landing_page_enabled) {
      return NextResponse.json(
        { error: 'Landing page not enabled for this referral link' },
        { status: 403 }
      )
    }

    // Handle disabled referral links with better UX
    if (!referralData.is_active) {
      
      // Get campaign details for context even if link is disabled
      const { data: campaignData } = await supabase
        .from('discord_guild_campaigns')
        .select('id, campaign_name, campaign_type, is_active, is_deleted, paused_at, campaign_end_date, brand_color, brand_logo_url, metadata, client_id')
        .eq('id', referralData.campaign_id)
        .single()

      // Get client details for branding
      const { data: clientData } = await supabase
        .from('clients')
        .select('name, industry, logo')
        .eq('id', campaignData?.client_id)
        .single()

      // Get influencer details
      const { data: influencerData } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('id', referralData.influencer_id)
        .single()

      // Determine the reason and user-friendly message
      let statusReason = 'temporarily unavailable'
      let statusMessage = 'This referral link is currently inactive.'
      let canReactivate = false
      let estimatedReactivation = null

      // Check campaign status to determine the reason
      if (campaignData) {
        if (campaignData.is_deleted) {
          statusReason = 'campaign_deleted'
          statusMessage = 'This campaign has been discontinued.'
        } else if (campaignData.paused_at) {
          statusReason = 'campaign_paused'
          statusMessage = 'This campaign is temporarily paused and will resume soon.'
          canReactivate = true
        } else if (campaignData.campaign_end_date) {
          statusReason = 'campaign_archived'
          statusMessage = 'This campaign has concluded successfully.'
        } else if (!campaignData.is_active) {
          statusReason = 'campaign_inactive'
          statusMessage = 'This campaign is currently inactive.'
        }
      }

      // Check metadata for more specific information
      if (referralData.metadata?.last_campaign_status_change) {
        const lastChange = referralData.metadata.last_campaign_status_change
        if (lastChange.action === 'pause') {
          statusMessage = 'This campaign is temporarily paused. The referral link will be reactivated when the campaign resumes.'
          canReactivate = true
        } else if (lastChange.action === 'archive') {
          statusMessage = 'This campaign has been completed and archived. Thank you for your participation!'
        } else if (lastChange.action === 'delete') {
          statusMessage = 'This campaign is no longer available.'
        }
      }

      const disabledResponse = NextResponse.json({
        link_disabled: true,
        referral_link: {
          id: referralData.id,
          title: referralData.title,
          description: referralData.description,
          platform: referralData.platform,
          influencer_id: referralData.influencer_id
        },
        campaign: campaignData ? {
          id: campaignData.id,
          campaign_name: campaignData.campaign_name,
          campaign_type: campaignData.campaign_type,
          brand_color: campaignData.brand_color || '#6366f1',
          brand_logo_url: campaignData.brand_logo_url,
          clients: clientData || { name: 'Unknown Client', industry: 'Technology', logo: null }
        } : null,
        influencer: influencerData || { full_name: 'Unknown Influencer', avatar_url: null },
        status: {
          reason: statusReason,
          message: statusMessage,
          can_reactivate: canReactivate,
          estimated_reactivation: estimatedReactivation,
          last_change: referralData.metadata?.last_campaign_status_change || null
        }
      }, { status: 423 }) // 423 = Locked (temporarily unavailable)
      
      // Add no-cache headers
      disabledResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      disabledResponse.headers.set('Pragma', 'no-cache')
      disabledResponse.headers.set('Expires', '0')
      
      return disabledResponse
    }
    
    // Get campaign details (without landing page fields now)
    const { data: campaignData, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('id, campaign_name, campaign_type, guild_id, welcome_message, brand_color, brand_logo_url, metadata, client_id')
      .eq('id', referralData.campaign_id)
      .single()

    if (campaignError || !campaignData) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get landing page data separately
    const { data: landingPageData } = await supabase
      .from('campaign_landing_pages')
      .select('*')
      .eq('campaign_id', campaignData.id)
      .single()

    // Get client details
    const { data: clientData } = await supabase
      .from('clients')
      .select('name, industry, logo')
      .eq('id', campaignData.client_id)
      .single()

    // Get influencer details
    const { data: influencerData } = await supabase
      .from('user_profiles')
      .select('full_name, avatar_url')
      .eq('id', referralData.influencer_id)
      .single()

    // Combine all data
    const response = {
      referral_link: {
        id: referralData.id,
        title: referralData.title,
        description: referralData.description,
        platform: referralData.platform,
        discord_invite_url: referralData.discord_invite_url,
        influencer_id: referralData.influencer_id
      },
      campaign: {
        id: campaignData.id,
        campaign_name: campaignData.campaign_name,
        campaign_type: campaignData.campaign_type,
        guild_id: campaignData.guild_id,
        welcome_message: campaignData.welcome_message,
        brand_color: campaignData.brand_color,
        brand_logo_url: campaignData.brand_logo_url,
        metadata: campaignData.metadata,
        // Include landing page data if it exists
        ...(landingPageData || {}),
        clients: clientData || { name: 'Unknown Client', industry: 'Technology', logo: null }
      },
      influencer: influencerData || { full_name: 'Unknown Influencer', avatar_url: null }
    }

    const activeResponse = NextResponse.json(response)
    
    // Add no-cache headers
    activeResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    activeResponse.headers.set('Pragma', 'no-cache')
    activeResponse.headers.set('Expires', '0')
    
    return activeResponse
  } catch (error) {
    console.error('Error fetching campaign data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 