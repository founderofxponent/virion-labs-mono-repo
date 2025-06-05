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

    if (!guildId) {
      return NextResponse.json(
        { error: 'guild_id parameter is required' },
        { status: 400 }
      )
    }

    // Use the helper function to get guild campaign configuration
    const { data, error } = await supabase.rpc('get_guild_campaign_config', {
      p_guild_id: guildId,
      p_channel_id: channelId
    })

    if (error) {
      console.error('Error fetching guild config:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        configured: false,
        message: 'No campaign configuration found for this guild/channel'
      })
    }

    const config = data[0]

    // Fetch onboarding fields for this campaign
    const { data: onboardingFields, error: fieldsError } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', config.campaign_id)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })

    if (fieldsError) {
      console.error('Error fetching onboarding fields:', fieldsError)
      // Continue without fields rather than failing completely
    }

    return NextResponse.json({
      configured: true,
      campaign: {
        id: config.campaign_id,
        name: config.campaign_name,
        type: config.campaign_type,
        client: {
          id: config.client_id,
          name: config.client_name
        },
        webhook_url: config.webhook_url,
        referral: config.referral_link_id ? {
          link_id: config.referral_link_id,
          code: config.referral_code,
          influencer: {
            id: config.influencer_id,
            name: config.influencer_name
          }
        } : null,
        bot_config: config.bot_config,
        onboarding_flow: config.onboarding_flow,
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