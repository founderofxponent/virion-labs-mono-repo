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
    const campaignType = searchParams.get('campaign_type')
    const includeArchived = searchParams.get('include_archived') === 'true'
    const onlyArchived = searchParams.get('only_archived') === 'true'

    let query = supabase
      .from('discord_guild_campaigns')
      .select(`
        *,
        clients:client_id(name, industry),
        referral_links:referral_link_id(title, referral_code, platform)
      `)
      .order('created_at', { ascending: false })

    // Filter archived campaigns by default
    if (onlyArchived) {
      query = query.eq('archived', true)
    } else if (!includeArchived) {
      // Use OR condition to handle both false and null values for backward compatibility
      query = query.or('archived.is.null,archived.eq.false')
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

    if (campaignType) {
      query = query.eq('campaign_type', campaignType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching Discord campaigns:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch influencer information separately for campaigns that have influencer_id
    const campaignsWithInfluencers = await Promise.all(
      (data || []).map(async (campaign) => {
        if (campaign.influencer_id) {
          const { data: influencer } = await supabase
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', campaign.influencer_id)
            .single()
          
          return {
            ...campaign,
            user_profiles: influencer
          }
        }
        return campaign
      })
    )

    return NextResponse.json({ campaigns: campaignsWithInfluencers })
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
      referral_link_id,
      influencer_id,
      webhook_url,
      welcome_message,
      onboarding_flow,
      referral_tracking_enabled,
      auto_role_assignment,
      target_role_id,
      campaign_start_date,
      campaign_end_date,
      metadata,
      // Bot configuration fields
      bot_name,
      bot_avatar_url,
      bot_personality,
      bot_response_style,
      brand_color,
      brand_logo_url,
      custom_commands,
      auto_responses,
      rate_limit_per_user,
      allowed_channels,
      blocked_users,
      moderation_enabled,
      content_filters,
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

    let campaignData = {
      client_id,
      guild_id,
      channel_id: channel_id || null,
      campaign_name,
      campaign_type,
      referral_link_id: referral_link_id || null,
      influencer_id: influencer_id || null,
      webhook_url: webhook_url || null,
      welcome_message: welcome_message || null,
      onboarding_flow: onboarding_flow || {},
      referral_tracking_enabled: referral_tracking_enabled ?? true,
      auto_role_assignment: auto_role_assignment ?? false,
      target_role_id: target_role_id || null,
      campaign_start_date: campaign_start_date || null,
      campaign_end_date: campaign_end_date || null,
      metadata: metadata || {},
      // Bot configuration
      bot_name: bot_name || 'Virion Bot',
      bot_avatar_url: bot_avatar_url || null,
      bot_personality: bot_personality || 'helpful',
      bot_response_style: bot_response_style || 'friendly',
      brand_color: brand_color || '#6366f1',
      brand_logo_url: brand_logo_url || null,
      custom_commands: custom_commands || [],
      auto_responses: auto_responses || {},
      rate_limit_per_user: rate_limit_per_user || 5,
      allowed_channels: allowed_channels || [],
      blocked_users: blocked_users || [],
      moderation_enabled: moderation_enabled ?? true,
      content_filters: content_filters || []
    }

    // If template_id is provided, merge template configuration
    if (template_id) {
      const { data: template, error: templateError } = await supabase
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
      const templateConfig = template.template_config
      campaignData = {
        ...campaignData,
        bot_name: bot_name || templateConfig.bot_name || 'Virion Bot',
        bot_personality: bot_personality || templateConfig.bot_personality || 'helpful',
        bot_response_style: bot_response_style || templateConfig.bot_response_style || 'friendly',
        brand_color: brand_color || templateConfig.brand_color || '#6366f1',
        welcome_message: welcome_message || templateConfig.welcome_message,
        onboarding_flow: onboarding_flow || templateConfig.onboarding_flow || {},
        auto_responses: auto_responses || templateConfig.auto_responses || {},
        custom_commands: custom_commands || templateConfig.custom_commands || [],
        referral_tracking_enabled: referral_tracking_enabled ?? templateConfig.referral_tracking_enabled ?? true,
        auto_role_assignment: auto_role_assignment ?? templateConfig.auto_role_assignment ?? false,
        moderation_enabled: moderation_enabled ?? templateConfig.moderation_enabled ?? true,
        content_filters: content_filters || templateConfig.content_filters || []
      }
    }

    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .insert(campaignData)
      .select(`
        *,
        clients:client_id(name, industry),
        referral_links:referral_link_id(title, referral_code, platform)
      `)
      .single()

    if (error) {
      console.error('Error creating Discord campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch influencer information separately if influencer_id exists
    let campaignWithInfluencer = data
    if (data.influencer_id) {
      const { data: influencer } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', data.influencer_id)
        .single()
      
      campaignWithInfluencer = {
        ...data,
        user_profiles: influencer
      }
    }

    return NextResponse.json({ campaign: campaignWithInfluencer }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 