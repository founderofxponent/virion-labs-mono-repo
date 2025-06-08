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
      content_filters
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
    
    // First, check if the campaign exists and is not already archived
    const { data: campaign, error: campaignCheckError } = await supabase
      .from('discord_guild_campaigns')
      .select('id, campaign_name, archived')
      .eq('id', id)
      .single()

    if (campaignCheckError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.archived) {
      return NextResponse.json({ error: 'Campaign is already archived' }, { status: 400 })
    }

    // Archive the campaign instead of deleting it
    const { data: archivedCampaign, error: archiveError } = await supabase
      .from('discord_guild_campaigns')
      .update({ 
        archived: true,
        archived_at: new Date().toISOString(),
        is_active: false, // Also deactivate the campaign
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, campaign_name, archived, archived_at')
      .single()

    if (archiveError) {
      console.error('Error archiving Discord campaign:', archiveError)
      return NextResponse.json({ error: archiveError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Campaign archived successfully',
      archived_campaign: campaign.campaign_name,
      archived_at: archivedCampaign.archived_at
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH method for partial updates (like pause/resume/restore)
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
    } else if (action === 'restore') {
      finalUpdateData.archived = false
      finalUpdateData.archived_at = null
      finalUpdateData.is_active = true // Reactivate when restoring
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

    return NextResponse.json({ 
      campaign: data,
      message: action === 'restore' ? 'Campaign restored successfully' : `Campaign ${action}d successfully`
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 