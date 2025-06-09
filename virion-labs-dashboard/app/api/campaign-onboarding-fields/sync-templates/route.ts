import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get all active campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('discord_guild_campaigns')
      .select('id, campaign_name, campaign_type')
      .eq('archived', false)

    if (campaignsError) {
      throw campaignsError
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No campaigns found to sync',
        synced_campaigns: []
      })
    }

    // Get all available templates from database
    const { data: availableTemplates, error: templatesError } = await supabase
      .from('campaign_templates')
      .select('id, name, campaign_type, template_config')
      .eq('is_default', true)

    if (templatesError) {
      throw templatesError
    }

    if (!availableTemplates || availableTemplates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No templates found in database. Please add templates first.'
      }, { status: 400 })
    }

    // Create a map of campaign_type to template for quick lookup
    const templateMap = new Map()
    availableTemplates.forEach(template => {
      templateMap.set(template.campaign_type, template)
    })

    const syncResults = []

    for (const campaign of campaigns) {
      try {
        // Get the template for this campaign type
        const template = templateMap.get(campaign.campaign_type)
        
        if (!template) {
          console.warn(`No template found for campaign ${campaign.campaign_name} with type ${campaign.campaign_type}`)
          syncResults.push({
            campaign_id: campaign.id,
            campaign_name: campaign.campaign_name,
            campaign_type: campaign.campaign_type,
            status: 'skipped',
            reason: `No template found for campaign type: ${campaign.campaign_type}`
          })
          continue
        }

        // Extract onboarding fields from template config
        const templateConfig = template.template_config
        const onboardingFields = templateConfig?.onboarding_fields || []

        if (!onboardingFields || onboardingFields.length === 0) {
          syncResults.push({
            campaign_id: campaign.id,
            campaign_name: campaign.campaign_name,
            campaign_type: campaign.campaign_type,
            status: 'skipped',
            reason: 'Template has no onboarding fields defined'
          })
          continue
        }

        // Delete existing onboarding fields for this campaign
        const { error: deleteError } = await supabase
          .from('campaign_onboarding_fields')
          .delete()
          .eq('campaign_id', campaign.id)

        if (deleteError) {
          console.error(`Error deleting fields for campaign ${campaign.id}:`, deleteError)
          syncResults.push({
            campaign_id: campaign.id,
            campaign_name: campaign.campaign_name,
            campaign_type: campaign.campaign_type,
            status: 'failed',
            reason: 'Failed to delete existing fields'
          })
          continue
        }

        // Insert new onboarding fields from template
        const fieldsToInsert = onboardingFields.map((field: any, index: number) => ({
          campaign_id: campaign.id,
          field_key: field.id,
          field_label: field.question,
          field_type: field.type,
          field_placeholder: field.placeholder || '',
          field_description: field.description || '',
          field_options: field.options || [],
          is_required: true, // All fields are now required
          is_enabled: true,
          sort_order: index,
          validation_rules: field.validation || {},
          discord_integration: field.discord_integration
        }))

        const { data: insertedFields, error: insertError } = await supabase
          .from('campaign_onboarding_fields')
          .insert(fieldsToInsert)
          .select()

        if (insertError) {
          console.error(`Error inserting fields for campaign ${campaign.id}:`, insertError)
          syncResults.push({
            campaign_id: campaign.id,
            campaign_name: campaign.campaign_name,
            campaign_type: campaign.campaign_type,
            status: 'failed',
            reason: 'Failed to insert new fields'
          })
          continue
        }

        // Update the campaign's onboarding flow
        const { error: updateCampaignError } = await supabase
          .from('discord_guild_campaigns')
          .update({ 
            onboarding_flow: templateConfig.bot_config?.features?.onboarding ? {
              enabled: true,
              template_applied: template.id,
              template_name: template.name,
              synced_at: new Date().toISOString()
            } : { enabled: false, synced_at: new Date().toISOString() }
          })
          .eq('id', campaign.id)

        if (updateCampaignError) {
          console.warn(`Failed to update onboarding flow for campaign ${campaign.id}:`, updateCampaignError)
        }

        syncResults.push({
          campaign_id: campaign.id,
          campaign_name: campaign.campaign_name,
          campaign_type: campaign.campaign_type,
          template_applied: template.name,
          template_id: template.id,
          fields_count: insertedFields?.length || 0,
          status: 'success'
        })

      } catch (error) {
        console.error(`Error syncing campaign ${campaign.id}:`, error)
        syncResults.push({
          campaign_id: campaign.id,
          campaign_name: campaign.campaign_name,
          campaign_type: campaign.campaign_type,
          status: 'failed',
          reason: 'Unexpected error during sync'
        })
      }
    }

    const successCount = syncResults.filter(r => r.status === 'success').length
    const failedCount = syncResults.filter(r => r.status === 'failed').length
    const skippedCount = syncResults.filter(r => r.status === 'skipped').length

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${successCount} successful, ${failedCount} failed, ${skippedCount} skipped`,
      summary: {
        total_campaigns: campaigns.length,
        successful: successCount,
        failed: failedCount,
        skipped: skippedCount,
        available_templates: availableTemplates.map(t => ({
          name: t.name,
          campaign_type: t.campaign_type
        }))
      },
      synced_campaigns: syncResults
    })

  } catch (error) {
    console.error('Error syncing campaign templates:', error)
    return NextResponse.json(
      { error: 'Failed to sync campaign templates' },
      { status: 500 }
    )
  }
} 