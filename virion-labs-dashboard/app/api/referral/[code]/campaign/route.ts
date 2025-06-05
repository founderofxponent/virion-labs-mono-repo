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

    // Get campaign details
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

    return NextResponse.json({
      referral_link: referralData,
      campaign: {
        ...campaignData,
        client: clientData
      },
      influencer: influencerData
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 