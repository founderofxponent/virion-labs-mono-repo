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

    // Find and validate referral link
    const { data, error } = await supabase
      .from('referral_links')
      .select(`
        id,
        title,
        influencer_id,
        campaign_id,
        discord_guild_id,
        is_active,
        expires_at,
        discord_guild_campaigns (
          id,
          campaign_name,
          campaign_type,
          guild_id,
          welcome_message,
          auto_role_assignment,
          target_role_id,
          metadata,
          user_profiles (
            full_name
          )
        )
      `)
      .eq('referral_code', code)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid referral code' 
      })
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Referral code has expired' 
      })
    }

    // Get the campaign (handle array/object conversion)
    const campaign = Array.isArray(data.discord_guild_campaigns) 
      ? data.discord_guild_campaigns[0] 
      : data.discord_guild_campaigns

    // Check guild match
    if (campaign?.guild_id !== guild_id) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Referral code not valid for this server' 
      })
    }

    // Track the validation if user_id is provided
    if (user_id) {
      // This could be used for analytics - tracking when someone validates a referral code
      // For now we'll just log it
      console.log(`Referral code ${code} validated for user ${user_id} in guild ${guild_id}`)
    }

    // Get the influencer (handle array/object conversion)
    const influencer = Array.isArray(campaign?.user_profiles) 
      ? campaign.user_profiles[0] 
      : campaign?.user_profiles

    return NextResponse.json({
      valid: true,
      referral_link: {
        id: data.id,
        title: data.title,
        campaign_id: data.campaign_id
      },
      campaign: {
        id: campaign?.id,
        name: campaign?.campaign_name,
        type: campaign?.campaign_type,
        welcome_message: campaign?.welcome_message,
        auto_role_assignment: campaign?.auto_role_assignment,
        target_role_id: campaign?.target_role_id,
        description: campaign?.metadata?.description
      },
      influencer: {
        id: data.influencer_id,
        name: influencer?.full_name
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