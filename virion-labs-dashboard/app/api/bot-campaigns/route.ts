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
    
    const clientId = searchParams.get('client_id')
    const guildId = searchParams.get('guild_id')
    const isActive = searchParams.get('is_active')
    const template = searchParams.get('template')
    const includeArchived = searchParams.get('include_archived') === 'true'
    const onlyArchived = searchParams.get('only_archived') === 'true'

    // Get campaigns from the unified view
    let query = supabase
      .from('bot_campaign_configs')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter archived campaigns by default
    if (onlyArchived) {
      query = query.eq('is_active', false)
    } else if (!includeArchived) {
      query = query.eq('is_active', true)
    }

    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    
    if (guildId) {
      query = query.eq('guild_id', guildId)
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (template) {
      query = query.eq('template', template)
    }

    const { data: campaigns, error } = await query

    if (error) {
      console.error('Error fetching bot campaigns:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate real-time metrics for each campaign
    const campaignsWithMetrics = await Promise.all(
      (campaigns || []).map(async (campaign) => {
        console.log(`🔍 Calculating metrics for campaign: ${campaign.id} (${campaign.name})`)

        try {
          // Calculate metrics using direct SQL queries instead of RPC
          const { data: metricsData, error: metricsError } = await supabase
            .from('campaign_onboarding_responses')
            .select('discord_user_id, referral_link_id')
            .eq('campaign_id', campaign.id)

          if (metricsError) {
            console.warn(`❌ Error fetching onboarding data for campaign ${campaign.id}:`, metricsError)
            return campaign
          }

          // Calculate metrics from the data
          const totalResponses = metricsData?.length || 0
          const uniqueUsers = new Set(metricsData?.map(r => r.discord_user_id) || []).size
          const referralConversions = new Set(
            metricsData?.filter(r => r.referral_link_id).map(r => r.discord_user_id) || []
          ).size

          // Use the higher of database total_interactions or actual response count
          const totalInteractions = Math.max(
            campaign.total_interactions || 0,
            totalResponses
          )

          const stats = {
            total_interactions: totalInteractions,
            successful_onboardings: uniqueUsers,
            referral_conversions: referralConversions,
            users_served: uniqueUsers
          }

          console.log(`📈 Calculated stats for ${campaign.name}:`, stats)

          // Update campaign with real-time metrics
          const updatedCampaign = {
            ...campaign,
            total_interactions: stats.total_interactions,
            successful_onboardings: stats.successful_onboardings,
            referral_conversions: stats.referral_conversions,
            users_served: stats.users_served
          }

          console.log(`✅ Updated metrics for ${campaign.name}:`, {
            name: campaign.name,
            original: {
              total_interactions: campaign.total_interactions,
              successful_onboardings: campaign.successful_onboardings,
              referral_conversions: campaign.referral_conversions
            },
            updated: {
              total_interactions: updatedCampaign.total_interactions,
              successful_onboardings: updatedCampaign.successful_onboardings,
              referral_conversions: updatedCampaign.referral_conversions
            }
          })

          return updatedCampaign

        } catch (error) {
          console.error(`❌ Exception calculating metrics for campaign ${campaign.id}:`, error)
          return campaign
        }
      })
    )

    return NextResponse.json({ 
      campaigns: campaignsWithMetrics,
      total: campaignsWithMetrics?.length || 0
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
      client_id,
      guild_id,
      channel_id,
      campaign_name,
      campaign_type,
      template = 'referral_campaign',
      // Bot configuration fields
      prefix = '!',
      description,
      bot_name,
      bot_avatar_url,
      bot_personality = 'helpful',
      bot_response_style = 'friendly',
      brand_color = '#6366f1',
      brand_logo_url,
      features = {},
      custom_commands = [],
      auto_responses = {},
      response_templates = {},
      embed_footer,
      welcome_message,
      webhook_url,
      webhook_routes = [],
      api_endpoints = {},
      external_integrations = {},
      // Campaign-specific fields
      referral_link_id,
      influencer_id,
      referral_tracking_enabled = true,
      auto_role_assignment = false,
      target_role_id,
      onboarding_flow = {},
      rate_limit_per_user = 5,
      allowed_channels = [],
      blocked_users = [],
      moderation_enabled = true,
      content_filters = [],
      campaign_start_date,
      campaign_end_date,
      metadata = {},

      // Template-based creation
      template_id
    } = body

    // Validate required fields
    if (!client_id || !guild_id || !campaign_name || !campaign_type) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, guild_id, campaign_name, campaign_type' },
        { status: 400 }
      )
    }

    // Validate campaign_type
    const validCampaignTypes = ['referral_onboarding', 'product_promotion', 'community_engagement', 'support']
    if (!validCampaignTypes.includes(campaign_type)) {
      return NextResponse.json(
        { error: `Invalid campaign_type. Must be one of: ${validCampaignTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate template
    const validTemplates = ['standard', 'advanced', 'custom', 'referral_campaign', 'support_campaign']
    if (!validTemplates.includes(template)) {
      return NextResponse.json(
        { error: `Invalid template. Must be one of: ${validTemplates.join(', ')}` },
        { status: 400 }
      )
    }

    let campaignData = {
      client_id,
      guild_id,
      channel_id: channel_id || null,
      campaign_name,
      campaign_type,
      template,
      prefix,
      description: description || `${campaign_name} - Discord bot campaign`,
      bot_name: bot_name || 'Virion Bot',
      bot_avatar_url: bot_avatar_url || null,
      bot_personality,
      bot_response_style,
      brand_color,
      brand_logo_url: brand_logo_url || null,
      features: {
        welcome_enabled: true,
        referral_tracking: referral_tracking_enabled,
        onboarding: true,
        auto_role: auto_role_assignment,
        moderation: moderation_enabled,
        ...features
      },
      custom_commands,
      auto_responses,
      response_templates,
      embed_footer: embed_footer || null,
      welcome_message: welcome_message || null,
      webhook_url: webhook_url || null,
      webhook_routes,
      api_endpoints,
      external_integrations,
      referral_link_id: referral_link_id || null,
      influencer_id: influencer_id || null,
      referral_tracking_enabled,
      auto_role_assignment,
      target_role_id: target_role_id || null,
      onboarding_flow,
      rate_limit_per_user,
      allowed_channels,
      blocked_users,
      moderation_enabled,
      content_filters,
      campaign_start_date: campaign_start_date || null,
      campaign_end_date: campaign_end_date || null,
      metadata,
      configuration_version: 1,
      is_active: true
    }

    // If template_id is provided, merge template configuration
    if (template_id) {
      const { data: templateData, error: templateError } = await supabase
        .from('campaign_templates')
        .select('template_config')
        .eq('id', template_id)
        .single()

      if (templateError) {
        return NextResponse.json(
          { error: 'Invalid template_id' },
          { status: 400 }
        )
      }

      // Merge template config with provided data (provided data takes precedence)
      const templateConfig = templateData.template_config
      campaignData = {
        ...campaignData,
        bot_name: bot_name || templateConfig.bot_name || 'Virion Bot',
        bot_personality: bot_personality || templateConfig.bot_personality || 'helpful',
        bot_response_style: bot_response_style || templateConfig.bot_response_style || 'friendly',
        brand_color: brand_color || templateConfig.brand_color || '#6366f1',
        welcome_message: welcome_message || templateConfig.welcome_message,
        onboarding_flow: onboarding_flow || templateConfig.onboarding_flow || {},
        custom_commands: [...(templateConfig.custom_commands || []), ...custom_commands],
        auto_responses: { ...templateConfig.auto_responses, ...auto_responses },
        features: { ...templateConfig.features, ...campaignData.features }
      }
    }

    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .insert([campaignData])
      .select(`
        *,
        clients:client_id(name, industry),
        referral_links:referral_link_id(title, referral_code, platform),
        user_profiles:influencer_id(full_name, email)
      `)
      .single()

    if (error) {
      console.error('Error creating bot campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ campaign: data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 