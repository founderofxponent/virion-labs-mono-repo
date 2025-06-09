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
      .rpc('get_bot_config_for_guild', { guild_id_param: guildId })

    if (error || !config || config.length === 0) {
      return NextResponse.json({ 
        configured: false, 
        message: 'No bot configuration found for this guild' 
      })
    }

    const campaignConfig = config[0]

    // Check if this is a private channel campaign
    if (campaignConfig.channel_id && channelId) {
      // Verify the bot can only be used in the specified private channel
      if (campaignConfig.channel_id !== channelId) {
        return NextResponse.json({
          configured: false,
          access_denied: true,
          message: 'This bot is only available in specific private channels',
          private_channel_id: campaignConfig.channel_id
        })
      }

      // For private channels, require referral access by default
      if (userId) {
        const { data: accessCheck } = await supabase
          .from('discord_referral_channel_access')
          .select('id, onboarding_completed')
          .eq('campaign_id', campaignConfig.campaign_id)
          .eq('discord_user_id', userId)
          .eq('is_active', true)
          .single()

        if (!accessCheck) {
          return NextResponse.json({
            configured: false,
            access_denied: true,
            referral_required: true,
            message: 'Access to this private bot requires a valid referral link',
            campaign_name: campaignConfig.campaign_name
          })
        }
      }
    }

    // Get onboarding fields for this campaign
    const { data: onboardingFields } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', campaignConfig.campaign_id)
      .order('sort_order')

    return NextResponse.json({
      configured: true,
      is_private_channel: !!campaignConfig.channel_id,
      private_channel_id: campaignConfig.channel_id,
      campaign: {
        id: campaignConfig.campaign_id,
        name: campaignConfig.campaign_name,
        type: campaignConfig.campaign_type,
        client: {
          id: campaignConfig.client_id,
          name: campaignConfig.client_name
        },
        webhook_url: campaignConfig.webhook_url,
        referral: campaignConfig.referral_link_id ? {
          link_id: campaignConfig.referral_link_id,
          code: campaignConfig.referral_code,
          influencer: {
            id: campaignConfig.influencer_id,
            name: campaignConfig.influencer_name
          }
        } : null,
        bot_config: {
          ...campaignConfig.bot_config,
          private_channel_id: campaignConfig.channel_id
        },
        onboarding_flow: campaignConfig.onboarding_flow,
        onboarding_fields: onboardingFields || []
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