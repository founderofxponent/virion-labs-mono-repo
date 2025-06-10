import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
// Database-driven template fetching

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
      campaign_template = 'custom',
      // Optional overrides for template defaults
      prefix,
      description,
      bot_name,
      bot_avatar_url,
      bot_personality,
      bot_response_style,
      brand_color,
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
      referral_tracking_enabled,
      auto_role_assignment,
      target_role_id,
      onboarding_flow = {},
      rate_limit_per_user,
      allowed_channels = [],
      blocked_users = [],
      moderation_enabled,
      content_filters = [],
      campaign_start_date,
      campaign_end_date,
      metadata = {}
    } = body

    // Validate required fields
    if (!client_id || !guild_id || !campaign_name || !campaign_template) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, guild_id, campaign_name, campaign_template' },
        { status: 400 }
      )
    }

    // Validate campaign_template
    const validCampaignTemplates = ['referral_onboarding', 'product_promotion', 'community_engagement', 'vip_support', 'custom']
    if (!validCampaignTemplates.includes(campaign_template)) {
      return NextResponse.json(
        { error: `Invalid campaign_template. Must be one of: ${validCampaignTemplates.join(', ')}` },
        { status: 400 }
      )
    }

    // Get template configuration from database
    const { data: templateData, error: templateError } = await supabase
      .from('campaign_templates')
      .select('*')
      .eq('campaign_type', campaign_template)
      .eq('is_default', true)
      .single()

    if (templateError || !templateData) {
      return NextResponse.json(
        { error: 'Invalid campaign template' },
        { status: 400 }
      )
    }

    const template = {
      id: templateData.campaign_type,
      name: templateData.name,
      description: templateData.description,
      category: templateData.category,
      bot_config: templateData.template_config.bot_config,
      onboarding_fields: templateData.template_config.onboarding_fields || [],
      analytics_config: templateData.template_config.analytics_config,
      landing_page_config: templateData.template_config.landing_page_config
    }

    // Merge template bot configuration with provided overrides
    const templateBotConfig = template.bot_config
    
    let campaignData = {
      client_id,
      guild_id,
      channel_id: channel_id || null,
      campaign_name,
      campaign_type: campaign_template, // Use template ID as the type
      template: templateBotConfig.template, // Use template's bot configuration template
      prefix: prefix || templateBotConfig.prefix,
      description: description || templateBotConfig.description,
      bot_name: bot_name || templateBotConfig.bot_name,
      bot_avatar_url: bot_avatar_url || templateBotConfig.avatar_url || null,
      bot_personality: bot_personality || templateBotConfig.bot_personality,
      bot_response_style: bot_response_style || templateBotConfig.bot_response_style,
      brand_color: brand_color || templateBotConfig.brand_color,
      brand_logo_url: brand_logo_url || null,
      embed_footer: embed_footer || templateBotConfig.embed_footer || null,
      welcome_message: welcome_message || templateBotConfig.welcome_message,
      
      // Merge features from template with overrides
      features: {
        ...templateBotConfig.features,
        ...features
      },
      
      // Merge commands and responses from template with overrides
      custom_commands: [...templateBotConfig.custom_commands, ...custom_commands],
      auto_responses: { ...templateBotConfig.auto_responses, ...auto_responses },
      response_templates: { ...templateBotConfig.response_templates, ...response_templates },
      
      // Integration settings from template with overrides
      webhook_url: webhook_url || templateBotConfig.webhook_url || null,
      webhook_routes: webhook_routes.length > 0 ? webhook_routes : (templateBotConfig.webhook_routes || []),
      api_endpoints: Object.keys(api_endpoints).length > 0 ? api_endpoints : (templateBotConfig.api_endpoints || {}),
      external_integrations: Object.keys(external_integrations).length > 0 ? external_integrations : (templateBotConfig.external_integrations || {}),
      
      // Behavior controls from template with overrides
      rate_limit_per_user: rate_limit_per_user || templateBotConfig.rate_limit_per_user || 5,
      allowed_channels: allowed_channels.length > 0 ? allowed_channels : (templateBotConfig.allowed_channels || []),
      blocked_users: blocked_users.length > 0 ? blocked_users : (templateBotConfig.blocked_users || []),
      content_filters: content_filters.length > 0 ? content_filters : (templateBotConfig.content_filters || []),
      
      // Campaign-specific settings from template with overrides
      referral_link_id: referral_link_id || null,
      influencer_id: influencer_id || null,
      referral_tracking_enabled: referral_tracking_enabled !== undefined ? 
        referral_tracking_enabled : (templateBotConfig.referral_tracking_enabled || templateBotConfig.features.referral_tracking),
      auto_role_assignment: auto_role_assignment !== undefined ? 
        auto_role_assignment : (templateBotConfig.auto_role_assignment || templateBotConfig.features.auto_role),
      target_role_id: target_role_id || templateBotConfig.target_role_id || null,
      moderation_enabled: moderation_enabled !== undefined ? 
        moderation_enabled : (templateBotConfig.moderation_enabled || templateBotConfig.features.moderation),
      
      // Access control from template
      access_control_enabled: templateBotConfig.access_control_enabled || false,
      referral_only_access: templateBotConfig.referral_only_access || false,
      auto_role_on_join: templateBotConfig.auto_role_on_join || null,
      onboarding_channel_type: templateBotConfig.onboarding_channel_type || 'dm',
      
      // Private channel setup from template
      private_channel_setup: templateBotConfig.private_channel_setup || {},
      
      // Onboarding completion requirements from template
      onboarding_completion_requirements: templateBotConfig.onboarding_completion_requirements || {},
      
      // Legacy onboarding_flow for backwards compatibility
      onboarding_flow,
      
      // Campaign dates and metadata
      campaign_start_date: campaign_start_date || null,
      campaign_end_date: campaign_end_date || null,
      metadata: {
        ...metadata,
        template_id: campaign_template,
        template_version: 1,
        applied_at: new Date().toISOString()
      },
      configuration_version: 2, // Increment version to indicate new template system
      is_active: true
    }

    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .insert([campaignData])
      .select(`
        *,
        clients:client_id(name, industry),
        referral_links:referral_link_id(title, referral_code, platform)
      `)
      .single()

    if (error) {
      console.error('Error creating bot campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      campaign: data,
      template: {
        id: template.id,
        name: template.name,
        onboarding_fields_count: template.onboarding_fields.length
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 