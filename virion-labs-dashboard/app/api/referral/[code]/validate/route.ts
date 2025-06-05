import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { guild_id, user_id } = await request.json()

    if (!guild_id) {
      return NextResponse.json(
        { valid: false, error: 'guild_id is required' },
        { status: 400 }
      )
    }

    // Find referral link first
    const { data: referralData, error: referralError } = await supabase
      .from('referral_links')
      .select('id, title, influencer_id, campaign_id, discord_guild_id, is_active, expires_at')
      .eq('referral_code', code)
      .eq('is_active', true)
      .single()

    if (referralError || !referralData) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid referral code' 
      })
    }

    // Check expiration
    if (referralData.expires_at && new Date(referralData.expires_at) < new Date()) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Referral code has expired' 
      })
    }

    // Get campaign details
    const { data: campaignData, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('id, campaign_name, campaign_type, guild_id, welcome_message, auto_role_assignment, target_role_id, metadata')
      .eq('id', referralData.campaign_id)
      .single()

    if (campaignError || !campaignData) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Campaign not found' 
      })
    }

    // Check guild match
    if (campaignData.guild_id !== guild_id) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Referral code not valid for this server' 
      })
    }

    // Get influencer details
    const { data: influencerData } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', referralData.influencer_id)
      .single()

    // Track the validation if user_id is provided
    if (user_id) {
      console.log(`Referral code ${code} validated for user ${user_id} in guild ${guild_id}`)
    }

    return NextResponse.json({
      valid: true,
      referral_link: {
        id: referralData.id,
        title: referralData.title,
        campaign_id: referralData.campaign_id
      },
      campaign: {
        id: campaignData.id,
        name: campaignData.campaign_name,
        type: campaignData.campaign_type,
        welcome_message: campaignData.welcome_message,
        auto_role_assignment: campaignData.auto_role_assignment,
        target_role_id: campaignData.target_role_id,
        description: campaignData.metadata?.description
      },
      influencer: {
        id: referralData.influencer_id,
        name: influencerData?.full_name
      }
    })

  } catch (error) {
    console.error('Error validating referral code:', error)
    return NextResponse.json({ 
      valid: false, 
      error: 'Validation failed' 
    })
  }
} 