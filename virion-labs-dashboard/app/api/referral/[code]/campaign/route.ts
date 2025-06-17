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

    // Get referral link first
    const { data: referralData, error: referralError } = await supabase
      .from('referral_links')
      .select('id, title, description, platform, discord_invite_url, landing_page_enabled, is_active, expires_at, campaign_id, influencer_id')
      .eq('referral_code', code)
      .eq('is_active', true)
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

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching campaign data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 