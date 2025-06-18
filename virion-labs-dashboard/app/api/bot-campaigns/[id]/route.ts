import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
// Database-driven template fetching

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to transform database field names to frontend-expected field names
function transformCampaignFields(campaign: any) {
  return {
    ...campaign,
    // Transform database field names to match frontend interface
    name: campaign.campaign_name || '',
    type: campaign.campaign_type || '',
    display_name: campaign.bot_name || 'Virion Bot',
    client_name: campaign.clients?.name || '',
    client_industry: campaign.clients?.industry || '',
    client_logo: campaign.clients?.logo || '',
    referral_link_title: campaign.referral_links?.title || '',
    referral_code: campaign.referral_links?.referral_code || '',
    referral_platform: campaign.referral_links?.platform || '',
    // Ensure arrays are never undefined
    target_role_ids: campaign.target_role_ids || [],
    allowed_channels: campaign.allowed_channels || [],
    blocked_users: campaign.blocked_users || [],
    content_filters: campaign.content_filters || [],
    custom_commands: campaign.custom_commands || [],
    webhook_routes: campaign.webhook_routes || [],
    // Ensure objects are never undefined
    features: campaign.features || {},
    auto_responses: campaign.auto_responses || {},
    response_templates: campaign.response_templates || {},
    api_endpoints: campaign.api_endpoints || {},
    external_integrations: campaign.external_integrations || {},
    onboarding_flow: campaign.onboarding_flow || {},
    metadata: campaign.metadata || {}
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .select(`
        *,
        clients:client_id(name, industry),
        referral_links:referral_link_id(title, referral_code, platform)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching bot campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ campaign: transformCampaignFields(data) })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Remove read-only fields and deprecated fields
    const {
      id: _id,
      created_at,
      updated_at,
      client_name,
      client_industry,
      client_logo,
      referral_link_title,
      referral_code,
      referral_platform,
      influencer_name,
      influencer_email,
      commands_used,
      users_served,
      last_activity_at,
      total_interactions,
      successful_onboardings,
      referral_conversions,
      campaign_template,
      // Landing page data (handled separately)
      landing_page_data,
      // Deprecated fields that were removed from schema
      target_role_id,
      auto_role_on_join,
      archived,
      archived_at,
      offer_title,
      offer_description,
      offer_highlights,
      offer_value,
      offer_expiry_date,
      hero_image_url,
      product_images,
      video_url,
      what_you_get,
      how_it_works,
      requirements,
      support_info,
      landing_page_template_id,
      ...updateData
    } = body

    // Handle campaign template changes
    let finalUpdateData = updateData
    if (campaign_template) {
      const { data: templateData, error: templateError } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('campaign_type', campaign_template)
        .eq('is_default', true)
        .single()

      if (!templateError && templateData) {
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
        // Map new template IDs to database-compatible template values
        const templateMapping: Record<string, string> = {
          'referral_onboarding': 'referral_campaign',
          'product_promotion': 'standard',
          'community_engagement': 'advanced', 
          'vip_support': 'support_campaign',
          'custom': 'custom'
        }

        // Merge template defaults with provided overrides
        finalUpdateData = {
          campaign_type: campaign_template,
          template: templateMapping[campaign_template] || 'custom',
          prefix: updateData.prefix || template.bot_config.prefix,
          description: updateData.description || template.bot_config.description,
          bot_name: updateData.bot_name || template.bot_config.bot_name,
          bot_personality: updateData.bot_personality || template.bot_config.bot_personality,
          bot_response_style: updateData.bot_response_style || template.bot_config.bot_response_style,
          brand_color: updateData.brand_color || template.bot_config.brand_color,
          welcome_message: updateData.welcome_message || template.bot_config.welcome_message,
          referral_tracking_enabled: updateData.referral_tracking_enabled !== undefined ? updateData.referral_tracking_enabled : template.bot_config.features.referral_tracking,
          auto_role_assignment: updateData.auto_role_assignment !== undefined ? updateData.auto_role_assignment : template.bot_config.features.auto_role,
          target_role_ids: updateData.target_role_ids && updateData.target_role_ids.length > 0
            ? updateData.target_role_ids
            : (template.bot_config.target_role_ids || []),
          moderation_enabled: updateData.moderation_enabled !== undefined ? updateData.moderation_enabled : template.bot_config.features.moderation,
          features: {
            ...template.bot_config.features,
            ...(updateData.features || {})
          },
          custom_commands: updateData.custom_commands || template.bot_config.custom_commands,
          auto_responses: updateData.auto_responses || template.bot_config.auto_responses,
          ...updateData
        }
      }
    }

    // Clean up timestamp and UUID fields - convert empty strings to null
    Object.keys(finalUpdateData).forEach(key => {
      if (typeof finalUpdateData[key] === 'string' && finalUpdateData[key] === '') {
        // Check if it's a timestamp field based on common naming patterns
        if (key.includes('_at') || key.includes('_date') || key.includes('Date')) {
          finalUpdateData[key] = null
        }
        // Check if it's a UUID field based on common naming patterns
        else if (key.includes('_id') || key === 'id' || key.includes('Id') || 
                 key.includes('client') || key.includes('referral') || key.includes('influencer')) {
          finalUpdateData[key] = null
        }
      }
    })

    // Update configuration_version to track changes
    finalUpdateData.configuration_version = (finalUpdateData.configuration_version || 1) + 1

    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .update(finalUpdateData)
      .eq('id', id)
      .select(`
        *,
        clients:client_id(name, industry),
        referral_links:referral_link_id(title, referral_code, platform)
      `)
      .single()

    if (error) {
      console.error('Error updating bot campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ campaign: transformCampaignFields(data) })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error deleting bot campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Campaign deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Archive/activate a campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !['archive', 'activate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "archive" or "activate"' },
        { status: 400 }
      )
    }

    const updateData = {
      is_active: action === 'activate',
      ...(action === 'archive' && { campaign_end_date: new Date().toISOString() })
    }

    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`Error ${action}ing bot campaign:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      campaign: transformCampaignFields(data),
      message: `Campaign ${action}d successfully`
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 