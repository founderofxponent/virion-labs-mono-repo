import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      referral_code, 
      discord_user_id, 
      discord_username, 
      guild_id,
      invite_code 
    } = body

    if (!referral_code || !discord_user_id || !guild_id) {
      return NextResponse.json(
        { error: 'referral_code, discord_user_id, and guild_id are required' },
        { status: 400 }
      )
    }

    // Find the referral link and associated campaign
    const { data: referralData, error: referralError } = await supabase
      .from('referral_links')
      .select(`
        id,
        referral_code,
        campaign_id,
        private_channel_id,
        access_role_id,
        influencer_id,
        discord_guild_campaigns!inner(
          id,
          campaign_name,
          private_channel_id,
          access_control_enabled,
          referral_only_access,
          auto_role_on_join
        )
      `)
      .eq('referral_code', referral_code)
      .eq('is_active', true)
      .single()

    if (referralError || !referralData) {
      return NextResponse.json(
        { error: 'Invalid or inactive referral code' },
        { status: 404 }
      )
    }

    // Access the campaign data (Supabase returns joined table as array)
    const campaignArray = referralData.discord_guild_campaigns as any[]
    if (!campaignArray || campaignArray.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found for this referral code' },
        { status: 404 }
      )
    }
    
    const campaign = campaignArray[0]

    // Check if this campaign requires referral access
    if (!campaign.access_control_enabled) {
      return NextResponse.json({
        success: true,
        message: 'This campaign does not require special access',
        access_granted: false
      })
    }

    // Check if user already has access
    const { data: existingAccess } = await supabase
      .from('discord_referral_channel_access')
      .select('id, is_active')
      .eq('campaign_id', campaign.id)
      .eq('discord_user_id', discord_user_id)
      .single()

    if (existingAccess && existingAccess.is_active) {
      return NextResponse.json({
        success: true,
        message: 'User already has access to this campaign',
        access_granted: true,
        existing: true
      })
    }

    // Grant access to the private channel campaign
    const accessRecord = {
      campaign_id: campaign.id,
      referral_link_id: referralData.id,
      discord_user_id,
      discord_username,
      guild_id,
      private_channel_id: campaign.private_channel_id,
      invite_code,
      role_assigned: campaign.auto_role_on_join,
      is_active: true
    }

    const { data: accessData, error: accessError } = await supabase
      .from('discord_referral_channel_access')
      .insert(accessRecord)
      .select()
      .single()

    if (accessError) {
      console.error('Error granting channel access:', accessError)
      return NextResponse.json(
        { error: 'Failed to grant channel access' },
        { status: 500 }
      )
    }

    // Also create the referral record for tracking
    const { error: referralCreationError } = await supabase
      .from('referrals')
      .insert({
        influencer_id: referralData.influencer_id,
        referral_link_id: referralData.id,
        name: discord_username,
        discord_id: discord_user_id,
        status: 'active',
        source_platform: 'Discord',
        metadata: {
          access_granted_via: 'private_channel',
          campaign_id: campaign.id,
          guild_id: guild_id,
          private_channel_id: campaign.private_channel_id
        }
      })

    if (referralCreationError) {
      console.warn('Warning: Failed to create referral record:', referralCreationError)
      // Don't fail the request for this
    }

    return NextResponse.json({
      success: true,
      message: 'Channel access granted successfully',
      access_granted: true,
      campaign: {
        id: campaign.id,
        name: campaign.campaign_name,
        private_channel_id: campaign.private_channel_id,
        role_to_assign: campaign.auto_role_on_join
      },
      access_record: accessData
    })

  } catch (error) {
    console.error('Unexpected error granting referral access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 