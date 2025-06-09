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

    // Use the new unified view
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

    const { data, error } = await query

    if (error) {
      console.error('Error fetching bot campaigns:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      campaigns: data || [],
      total: data?.length || 0
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