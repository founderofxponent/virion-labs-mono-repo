import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guildId = searchParams.get('guild_id')
    const channelId = searchParams.get('channel_id')
    const userId = searchParams.get('user_id')

    if (!guildId) {
      return NextResponse.json({ error: 'guild_id is required' }, { status: 400 })
    }

    // Get campaign configuration with channel and access control support
    const { data: config, error } = await supabase
      .rpc('get_enriched_bot_config_for_guild', { 
        p_guild_id: guildId,
        p_channel_id: channelId 
      })

    if (error || !config || config.length === 0) {
      return NextResponse.json({ 
        configured: false, 
        message: 'No bot configuration found for this guild' 
      })
    }

    const campaignConfig = config[0]
    
    // If not configured, return early
    if (!campaignConfig.configured) {
      return NextResponse.json({ 
        configured: false, 
        message: 'No bot configuration found for this guild' 
      })
    }

    // For private channel access control (if needed in the future)
    // Currently the new function handles channel matching automatically

    // Get onboarding fields for this campaign
    const { data: onboardingFields } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', campaignConfig.campaign_id)
      .order('sort_order')

    return NextResponse.json({
      configured: true,
      campaign: {
        id: campaignConfig.campaign_id,
        name: campaignConfig.campaign_name,
        type: campaignConfig.campaign_type,
        client: {
          id: campaignConfig.client_id,
          name: campaignConfig.client_name
        },
        bot_config: campaignConfig.bot_config || {},
        onboarding_flow: campaignConfig.template_config,
        onboarding_fields: onboardingFields || [],
        template_config: campaignConfig.template_config
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      guild_id,
      channel_id,
      discord_user_id,
      discord_username,
      message_id,
      interaction_type,
      message_content,
      bot_response,
      referral_code
    } = body

    if (!guild_id || !discord_user_id || !discord_username || !message_id || !interaction_type) {
      return NextResponse.json(
        { error: 'Missing required fields: guild_id, discord_user_id, discord_username, message_id, interaction_type' },
        { status: 400 }
      )
    }

    // Track the Discord interaction
    const { data, error } = await supabase.rpc('track_discord_interaction', {
      p_guild_id: guild_id,
      p_channel_id: channel_id,
      p_discord_user_id: discord_user_id,
      p_discord_username: discord_username,
      p_message_id: message_id,
      p_interaction_type: interaction_type,
      p_message_content: message_content,
      p_bot_response: bot_response,
      p_referral_code: referral_code
    })

    if (error) {
      console.error('Error tracking interaction:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      interaction_id: data,
      message: 'Interaction tracked successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 