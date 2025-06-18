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
    const { searchParams } = new URL(request.url)
    const forceHard = searchParams.get('force') === 'true'

    if (forceHard) {
      // Hard delete: Handle foreign key constraints first
      console.log('Performing hard delete with cascade handling...')
      
      // Check for related records
      const { data: relatedRecords, error: checkError } = await supabase
        .from('referral_links')
        .select('id, title')
        .eq('campaign_id', id)
        .eq('is_active', true)

      if (checkError) {
        console.error('Error checking related records:', checkError)
        return NextResponse.json({ error: checkError.message }, { status: 500 })
      }

      if (relatedRecords && relatedRecords.length > 0) {
        return NextResponse.json({ 
          error: `Cannot delete campaign. ${relatedRecords.length} active referral links are still connected to this campaign.`,
          relatedRecords: relatedRecords.map(r => ({ id: r.id, title: r.title }))
        }, { status: 409 })
      }

      // Set referral_links.campaign_id to null for any remaining links
      const { error: unlinkError } = await supabase
        .from('referral_links')
        .update({ campaign_id: null })
        .eq('campaign_id', id)

      if (unlinkError) {
        console.error('Error unlinking referral links:', unlinkError)
        return NextResponse.json({ error: 'Failed to unlink related records' }, { status: 500 })
      }

      // Now perform hard delete
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

      return NextResponse.json({ message: 'Campaign permanently deleted successfully' })
    } else {
      // Soft delete (default behavior)
      const { data, error } = await supabase
        .from('discord_guild_campaigns')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('is_deleted', false) // Only soft delete if not already deleted
        .select()
        .single()

      if (error) {
        console.error('Error soft deleting bot campaign:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!data) {
        return NextResponse.json({ error: 'Campaign not found or already deleted' }, { status: 404 })
      }

      // Sync referral link statuses for campaign deletion
      try {
        const { data: syncResult, error: syncError } = await supabase.rpc(
          'sync_referral_links_with_campaign_status',
          {
            p_campaign_id: id,
            p_campaign_action: 'delete',
            p_campaign_is_active: false,
            p_campaign_is_deleted: true,
            p_campaign_paused_at: null,
            p_campaign_end_date: null
          }
        )

        if (syncError) {
          console.warn(`Warning: Failed to sync referral links for deleted campaign ${id}:`, syncError)
        } else if (syncResult && syncResult.length > 0) {
          const { updated_links_count, affected_link_ids } = syncResult[0]
          console.log(`Disabled ${updated_links_count} referral links for deleted campaign ${id}`)
          
          return NextResponse.json({ 
            campaign: transformCampaignFields(data),
            message: 'Campaign deleted successfully',
            referral_links_updated: {
              count: updated_links_count,
              link_ids: affected_link_ids,
              action: 'delete'
            }
          })
        }
      } catch (syncErr) {
        console.warn(`Warning: Exception during referral link sync for deleted campaign ${id}:`, syncErr)
      }

      return NextResponse.json({ 
        campaign: transformCampaignFields(data),
        message: 'Campaign deleted successfully' 
      })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle campaign status actions: pause, resume, archive, restore
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    const validActions = ['pause', 'resume', 'archive', 'restore', 'activate']
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'pause':
        updateData = {
          is_active: false,
          paused_at: new Date().toISOString(),
          campaign_end_date: null // Clear end date if set
        }
        break

      case 'resume':
        updateData = {
          is_active: true,
          paused_at: null,
          campaign_end_date: null
        }
        break

      case 'archive':
        updateData = {
          is_active: false,
          campaign_end_date: new Date().toISOString(),
          paused_at: null // Clear pause date if set
        }
        break

      case 'restore':
      case 'activate': // Keep backward compatibility
        updateData = {
          is_active: true,
          campaign_end_date: null,
          paused_at: null,
          is_deleted: false,
          deleted_at: null
        }
        break

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .update(updateData)
      .eq('id', id)
      .eq('is_deleted', false) // Only update non-deleted campaigns
      .select()
      .single()

    if (error) {
      console.error(`Error ${action}ing bot campaign:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found or has been deleted' }, { status: 404 })
    }

    // Sync referral link statuses with campaign status change
    try {
      const { data: syncResult, error: syncError } = await supabase.rpc(
        'sync_referral_links_with_campaign_status',
        {
          p_campaign_id: id,
          p_campaign_action: action,
          p_campaign_is_active: updateData.is_active,
          p_campaign_is_deleted: updateData.is_deleted || false,
          p_campaign_paused_at: updateData.paused_at,
          p_campaign_end_date: updateData.campaign_end_date
        }
      )

      if (syncError) {
        console.warn(`Warning: Failed to sync referral links for campaign ${id}:`, syncError)
        // Don't fail the request, just log the warning
      } else if (syncResult && syncResult.length > 0) {
        const { updated_links_count, affected_link_ids } = syncResult[0]
        console.log(`Synced ${updated_links_count} referral links for campaign ${id} (action: ${action})`)
        
        // Add referral link sync info to response
        return NextResponse.json({ 
          campaign: transformCampaignFields(data),
          message: `Campaign ${action}d successfully`,
          referral_links_updated: {
            count: updated_links_count,
            link_ids: affected_link_ids,
            action: action
          }
        })
      }
    } catch (syncErr) {
      console.warn(`Warning: Exception during referral link sync for campaign ${id}:`, syncErr)
      // Continue with successful campaign update response
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