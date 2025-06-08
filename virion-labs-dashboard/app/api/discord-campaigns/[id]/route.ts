import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
      console.error('Error fetching Discord campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
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

    return NextResponse.json({ campaign: campaignWithInfluencer })
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
      is_active,
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
      // Landing page fields
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
      landing_page_template_id
    } = body

    // Prepare update data, converting empty strings to null for optional fields
    const updateData: any = {}
    
    if (client_id !== undefined) updateData.client_id = client_id
    if (guild_id !== undefined) updateData.guild_id = guild_id
    if (channel_id !== undefined) updateData.channel_id = channel_id || null
    if (campaign_name !== undefined) updateData.campaign_name = campaign_name
    if (campaign_type !== undefined) updateData.campaign_type = campaign_type
    if (referral_link_id !== undefined) updateData.referral_link_id = referral_link_id || null
    if (influencer_id !== undefined) updateData.influencer_id = influencer_id || null
    if (webhook_url !== undefined) updateData.webhook_url = webhook_url || null
    if (welcome_message !== undefined) updateData.welcome_message = welcome_message || null
    if (onboarding_flow !== undefined) updateData.onboarding_flow = onboarding_flow || {}
    if (referral_tracking_enabled !== undefined) updateData.referral_tracking_enabled = referral_tracking_enabled
    if (auto_role_assignment !== undefined) updateData.auto_role_assignment = auto_role_assignment
    if (target_role_id !== undefined) updateData.target_role_id = target_role_id || null
    if (campaign_start_date !== undefined) updateData.campaign_start_date = campaign_start_date || null
    if (campaign_end_date !== undefined) updateData.campaign_end_date = campaign_end_date || null
    if (is_active !== undefined) updateData.is_active = is_active
    if (metadata !== undefined) updateData.metadata = metadata || {}
    
    // Bot configuration
    if (bot_name !== undefined) updateData.bot_name = bot_name || 'Virion Bot'
    if (bot_avatar_url !== undefined) updateData.bot_avatar_url = bot_avatar_url || null
    if (bot_personality !== undefined) updateData.bot_personality = bot_personality || 'helpful'
    if (bot_response_style !== undefined) updateData.bot_response_style = bot_response_style || 'friendly'
    if (brand_color !== undefined) updateData.brand_color = brand_color || '#6366f1'
    if (brand_logo_url !== undefined) updateData.brand_logo_url = brand_logo_url || null
    if (custom_commands !== undefined) updateData.custom_commands = custom_commands || []
    if (auto_responses !== undefined) updateData.auto_responses = auto_responses || {}
    if (rate_limit_per_user !== undefined) updateData.rate_limit_per_user = rate_limit_per_user || 5
    if (allowed_channels !== undefined) updateData.allowed_channels = allowed_channels || []
    if (blocked_users !== undefined) updateData.blocked_users = blocked_users || []
    if (moderation_enabled !== undefined) updateData.moderation_enabled = moderation_enabled
    if (content_filters !== undefined) updateData.content_filters = content_filters || []
    
    // Landing page fields
    if (offer_title !== undefined) updateData.offer_title = offer_title || null
    if (offer_description !== undefined) updateData.offer_description = offer_description || null
    if (offer_highlights !== undefined) updateData.offer_highlights = offer_highlights || null
    if (offer_value !== undefined) updateData.offer_value = offer_value || null
    if (offer_expiry_date !== undefined) updateData.offer_expiry_date = offer_expiry_date || null
    if (hero_image_url !== undefined) updateData.hero_image_url = hero_image_url || null
    if (product_images !== undefined) updateData.product_images = product_images || null
    if (video_url !== undefined) updateData.video_url = video_url || null
    if (what_you_get !== undefined) updateData.what_you_get = what_you_get || null
    if (how_it_works !== undefined) updateData.how_it_works = how_it_works || null
    if (requirements !== undefined) updateData.requirements = requirements || null
    if (support_info !== undefined) updateData.support_info = support_info || null
    if (landing_page_template_id !== undefined) updateData.landing_page_template_id = landing_page_template_id || null

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        clients:client_id(name, industry),
        referral_links:referral_link_id(title, referral_code, platform)
      `)
      .single()

    if (error) {
      console.error('Error updating Discord campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
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

    return NextResponse.json({ campaign: campaignWithInfluencer })
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
    const { error } = await supabase
      .from('discord_guild_campaigns')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting Discord campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Campaign deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH method for partial updates (like pause/resume)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, ...updateData } = body

    let finalUpdateData = { ...updateData }

    // Handle specific actions
    if (action === 'pause') {
      finalUpdateData.is_active = false
    } else if (action === 'resume') {
      finalUpdateData.is_active = true
    } else if (action === 'archive') {
      finalUpdateData.archived = true
      finalUpdateData.archived_at = new Date().toISOString()
      finalUpdateData.is_active = false
    } else if (action === 'restore') {
      finalUpdateData.archived = false
      finalUpdateData.archived_at = null
      finalUpdateData.is_active = true
    }

    // Add updated_at timestamp
    finalUpdateData.updated_at = new Date().toISOString()

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
      console.error('Error updating Discord campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ campaign: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 