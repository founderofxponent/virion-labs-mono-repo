import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCampaignTemplate } from '@/lib/campaign-templates'

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

    // Get template configuration
    const template = getCampaignTemplate(campaign_template)
    if (!template) {
      return NextResponse.json(
        { error: 'Invalid campaign template' },
        { status: 400 }
      )
    }

    // Map new template IDs to database-compatible template values
    const templateMapping: Record<string, string> = {
      'referral_onboarding': 'referral_campaign',
      'product_promotion': 'standard',
      'community_engagement': 'advanced', 
      'vip_support': 'support_campaign',
      'custom': 'custom'
    }

    // Merge template defaults with provided overrides
    let campaignData = {
      client_id,
      guild_id,
      channel_id: channel_id || null,
      campaign_name,
      campaign_type: campaign_template, // Use new template ID as the type
      template: templateMapping[campaign_template] || 'custom', // Map to database-compatible value
      prefix: prefix || template.bot_config.prefix,
      description: description || template.bot_config.description,
      bot_name: bot_name || template.bot_config.bot_name,
      bot_avatar_url: bot_avatar_url || null,
      bot_personality: bot_personality || template.bot_config.bot_personality,
      bot_response_style: bot_response_style || template.bot_config.bot_response_style,
      brand_color: brand_color || template.bot_config.brand_color,
      brand_logo_url: brand_logo_url || null,
      features: {
        ...template.bot_config.features,
        ...features
      },
      custom_commands: [...template.bot_config.custom_commands, ...custom_commands],
      auto_responses: { ...template.bot_config.auto_responses, ...auto_responses },
      response_templates,
      embed_footer: embed_footer || null,
      welcome_message: welcome_message || template.bot_config.welcome_message,
      webhook_url: webhook_url || null,
      webhook_routes,
      api_endpoints,
      external_integrations,
      referral_link_id: referral_link_id || null,
      influencer_id: influencer_id || null,
      referral_tracking_enabled: referral_tracking_enabled !== undefined ? referral_tracking_enabled : template.bot_config.features.referral_tracking,
      auto_role_assignment: auto_role_assignment !== undefined ? auto_role_assignment : template.bot_config.features.auto_role,
      target_role_id: target_role_id || null,
      onboarding_flow,
      rate_limit_per_user: rate_limit_per_user || 5,
      allowed_channels,
      blocked_users,
      moderation_enabled: moderation_enabled !== undefined ? moderation_enabled : template.bot_config.features.moderation,
      content_filters,
      campaign_start_date: campaign_start_date || null,
      campaign_end_date: campaign_end_date || null,
      metadata,
      configuration_version: 1,
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

    return NextResponse.json({ campaign: data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 