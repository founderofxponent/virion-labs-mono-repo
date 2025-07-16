import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Get bot configuration for a Discord guild
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guildId = searchParams.get('guild_id')
    const channelId = searchParams.get('channel_id')
    const includeInactive = searchParams.get('include_inactive') === 'true'
    const preferCampaignType = searchParams.get('prefer_campaign_type')

    if (!guildId) {
      return NextResponse.json(
        { error: 'Missing required parameter: guild_id' },
        { status: 400 }
      )
    }

    console.log(`🔍 Bot config request for guild: ${guildId}, channel: ${channelId}, preferType: ${preferCampaignType}`)

    // Build query conditions
    let query = supabase
      .from('discord_guild_campaigns')
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .eq('guild_id', guildId)
      .eq('is_deleted', false)

    // Filter by channel if provided
    if (channelId) {
      query = query.or(`channel_id.eq.${channelId},channel_id.is.null`)
    }

    // Filter by active status unless including inactive
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    // Order by campaign type preference and other criteria
    let orderBy = 'created_at.desc'
    if (preferCampaignType) {
      // Use a custom ordering that prioritizes the preferred campaign type
      query = query.order('campaign_type', { ascending: false })
      // Then order by active status (active first)
      query = query.order('is_active', { ascending: false })
      // Then by creation date (newest first)
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('is_active', { ascending: false }).order('created_at', { ascending: false })
    }

    const { data: campaigns, error } = await query

    if (error) {
      throw error
    }

    if (!campaigns || campaigns.length === 0) {
      console.log(`❌ No campaigns found for guild: ${guildId}`)
      return NextResponse.json({
        configured: false,
        error: 'No campaigns configured for this guild'
      })
    }

    console.log(`📊 Found ${campaigns.length} campaigns for guild ${guildId}`)
    campaigns.forEach(c => {
      console.log(`  - ${c.campaign_name} (${c.campaign_type}): ${c.is_active ? 'active' : 'inactive'}`)
    })

    // Campaign selection logic with type preference
    let selectedCampaign = null

    if (preferCampaignType) {
      console.log(`🎯 Looking for preferred campaign type: ${preferCampaignType}`)
      
      // First try to find an active campaign of the preferred type
      selectedCampaign = campaigns.find(c => 
        c.campaign_type === preferCampaignType && c.is_active
      )
      
      if (!selectedCampaign && includeInactive) {
        // If no active campaign of preferred type, try inactive ones
        selectedCampaign = campaigns.find(c => 
          c.campaign_type === preferCampaignType
        )
      }
      
      if (selectedCampaign) {
        console.log(`✅ Selected preferred campaign: ${selectedCampaign.campaign_name} (${selectedCampaign.campaign_type})`)
      } else {
        console.log(`⚠️ No campaign found for preferred type: ${preferCampaignType}`)
      }
    }

    // Fallback to general selection logic if no preferred type match
    if (!selectedCampaign) {
      // Priority order: active campaigns first, then by creation date
      selectedCampaign = campaigns.find(c => c.is_active) || campaigns[0]
      console.log(`🔄 Fallback to campaign: ${selectedCampaign.campaign_name} (${selectedCampaign.campaign_type})`)
    }

    // Get onboarding fields for the selected campaign
    const { data: onboardingFields, error: fieldsError } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', selectedCampaign.id)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })

    if (fieldsError) {
      console.error('Error fetching onboarding fields:', fieldsError)
    }

    // Determine campaign status
    const getCampaignStatus = (campaign: any) => {
      if (campaign.is_active) return 'active'
      if (campaign.paused_at) return 'paused'
      if (campaign.campaign_end_date && new Date(campaign.campaign_end_date) < new Date()) return 'archived'
      return 'inactive'
    }

    const campaignStatus = getCampaignStatus(selectedCampaign)

    console.log(`✅ Returning config for: ${selectedCampaign.campaign_name} (${selectedCampaign.campaign_type}) - Status: ${campaignStatus}`)

    return NextResponse.json({
      configured: true,
      campaign: {
        id: selectedCampaign.id,
        name: selectedCampaign.campaign_name,
        campaign_type: selectedCampaign.campaign_type,
        client_name: selectedCampaign.clients?.name || 'Unknown Client',
        is_active: selectedCampaign.is_active,
        status: campaignStatus,
        
        // Bot configuration
        bot_name: selectedCampaign.bot_name || 'Virion Bot',
        brand_color: selectedCampaign.brand_color || '#6366f1',
        welcome_message: selectedCampaign.welcome_message,
        prefix: selectedCampaign.prefix || '/',
        template: selectedCampaign.template || 'standard',
        
        // Onboarding configuration
        onboarding_flow: selectedCampaign.onboarding_flow || {},
        onboarding_completion_requirements: selectedCampaign.onboarding_completion_requirements || {},
        onboarding_fields: onboardingFields || [],
        
        // Features
        referral_tracking_enabled: selectedCampaign.referral_tracking_enabled || false,
        auto_role_assignment: selectedCampaign.auto_role_assignment || false,
        target_role_ids: selectedCampaign.target_role_ids || [],
        
        // Response configuration
        auto_responses: selectedCampaign.auto_responses || {},
        custom_commands: selectedCampaign.custom_commands || [],
        response_templates: selectedCampaign.response_templates || {},
        
        // Access control
        private_channel_setup: selectedCampaign.private_channel_setup || {},
        access_control_enabled: selectedCampaign.access_control_enabled || false,
        referral_only_access: selectedCampaign.referral_only_access || false,
        
        // Moderation
        moderation_enabled: selectedCampaign.moderation_enabled !== false,
        rate_limit_per_user: selectedCampaign.rate_limit_per_user || 5,
        allowed_channels: selectedCampaign.allowed_channels || [],
        blocked_users: selectedCampaign.blocked_users || [],
        content_filters: selectedCampaign.content_filters || [],
        
        // Referral information
        referral_link_id: selectedCampaign.referral_link_id,
        influencer_id: selectedCampaign.influencer_id,
        referral_code: selectedCampaign.referral_code
      },
      campaign_options: campaigns.map(c => ({
        id: c.id,
        name: c.campaign_name,
        type: c.campaign_type,
        is_active: c.is_active,
        status: getCampaignStatus(c)
      }))
    })

  } catch (error) {
    console.error('Error fetching bot configuration:', error)
    return NextResponse.json(
      { 
        configured: false, 
        error: 'Internal server error while fetching configuration' 
      },
      { status: 500 }
    )
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