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
    const includeInactive = searchParams.get('include_inactive') === 'true'

    if (!guildId) {
      return NextResponse.json({ error: 'guild_id is required' }, { status: 400 })
    }

    // Get campaign configuration with channel and access control support
    // Modify query to include inactive campaigns if requested
    let query = supabase
      .from('discord_guild_campaigns')
      .select(`
        *,
        clients:client_id(name, industry),
        referral_links:referral_link_id(title, referral_code, platform)
      `)
      .eq('guild_id', guildId)
      .eq('is_deleted', false) // Always exclude hard-deleted campaigns

    // Filter by channel_id if provided (each campaign can have its own channel)
    if (channelId) {
      query = query.eq('channel_id', channelId)
    }

    // Only filter by active status if NOT including inactive campaigns
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: campaigns, error } = await query

    if (error) {
      console.error('Error fetching campaign configurations:', error)
      return NextResponse.json({ 
        configured: false, 
        message: 'Error fetching campaign configuration',
        error: error.message 
      }, { status: 500 })
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ 
        configured: false, 
        message: 'No campaign found for this guild' 
      })
    }

    // Smart campaign selection logic
    let selectedCampaign = campaigns[0]
    if (campaigns.length > 1) {
      // Priority order: active > paused > archived > deleted
      const activeCampaign = campaigns.find(c => c.is_active && !c.is_deleted)
      const pausedCampaign = campaigns.find(c => !c.is_active && c.paused_at && !c.is_deleted)
      const archivedCampaign = campaigns.find(c => !c.is_active && c.campaign_end_date && !c.is_deleted)
      
      if (activeCampaign) {
        selectedCampaign = activeCampaign
      } else if (pausedCampaign) {
        selectedCampaign = pausedCampaign
      } else if (archivedCampaign) {
        selectedCampaign = archivedCampaign
      } else {
        // If no specific status found, select the most recently created campaign
        selectedCampaign = campaigns.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
      }
    }

    // Determine campaign status
    function getCampaignStatus(campaign: any) {
      if (campaign.is_deleted) return 'deleted'
      if (!campaign.is_active && campaign.campaign_end_date) return 'archived'
      if (!campaign.is_active && campaign.paused_at) return 'paused'
      if (campaign.is_active) return 'active'
      return 'inactive'
    }

    const campaignStatus = getCampaignStatus(selectedCampaign)

    // Get onboarding fields for this campaign
    const { data: onboardingFields } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', selectedCampaign.id)
      .order('sort_order')

    return NextResponse.json({
      configured: true,
      campaign: {
        id: selectedCampaign.id,
        name: selectedCampaign.campaign_name,
        type: selectedCampaign.campaign_type,
        status: campaignStatus,
        is_active: selectedCampaign.is_active,
        client: {
          id: selectedCampaign.client_id,
          name: selectedCampaign.clients?.name || 'Unknown Client'
        },
        bot_config: selectedCampaign.bot_config || {},
        onboarding_flow: selectedCampaign.onboarding_flow || {},
        onboarding_fields: onboardingFields || [],
        // Include status metadata
        paused_at: selectedCampaign.paused_at,
        campaign_end_date: selectedCampaign.campaign_end_date,
        deleted_at: selectedCampaign.deleted_at
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