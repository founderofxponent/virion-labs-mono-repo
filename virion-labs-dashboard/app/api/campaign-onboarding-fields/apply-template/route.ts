import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaign_id, template_id } = body

    // Validate required fields
    if (!campaign_id) {
      return NextResponse.json(
        { error: 'Missing required field: campaign_id' },
        { status: 400 }
      )
    }

    let templateToUse = template_id

    // If no template_id provided, get it from the campaign's campaign_type
    if (!template_id) {
      const { data: campaign, error: campaignError } = await supabase
        .from('discord_guild_campaigns')
        .select('campaign_type')
        .eq('id', campaign_id)
        .single()

      if (campaignError || !campaign) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        )
      }

      templateToUse = campaign.campaign_type
    }

    // Get the campaign template from database
    const { data: template, error: templateError } = await supabase
      .from('campaign_templates')
      .select('*')
      .eq('campaign_type', templateToUse)
      .eq('is_default', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: `Template not found for type: ${templateToUse}. Please ensure the template exists in the database.` },
        { status: 404 }
      )
    }

    // Extract onboarding fields from template config
    const templateConfig = template.template_config
    const onboardingFields = templateConfig?.onboarding_fields || []

    if (!onboardingFields || onboardingFields.length === 0) {
      return NextResponse.json(
        { error: 'Template has no onboarding fields defined' },
        { status: 400 }
      )
    }

    // Delete existing onboarding fields for the campaign
    const { error: deleteError } = await supabase
      .from('campaign_onboarding_fields')
      .delete()
      .eq('campaign_id', campaign_id)

    if (deleteError) {
      throw deleteError
    }

    // Insert new onboarding fields from template
    const fieldsToInsert = onboardingFields.map((field: any, index: number) => ({
      campaign_id,
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
      throw insertError
    }

    // Update the campaign's onboarding flow
    const { error: updateCampaignError } = await supabase
      .from('discord_guild_campaigns')
      .update({ 
        onboarding_flow: templateConfig.bot_config?.features?.onboarding ? {
          enabled: true,
          template_applied: template.id,
          template_name: template.name
        } : { enabled: false }
      })
      .eq('id', campaign_id)

    if (updateCampaignError) {
      console.warn('Failed to update campaign onboarding flow:', updateCampaignError)
    }

    // Fetch the updated fields with proper ordering
    const { data: fields, error: fieldsError } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', campaign_id)
      .order('sort_order', { ascending: true })

    if (fieldsError) {
      throw fieldsError
    }

    return NextResponse.json({ 
      success: true, 
      fields,
      template_applied: template.name,
      template_id: template.id,
      template_type: template.campaign_type,
      message: `Successfully applied ${template.name} template with ${fields.length} onboarding fields`
    })
  } catch (error) {
    console.error('Error applying template to campaign:', error)
    return NextResponse.json(
      { error: 'Failed to apply template to campaign' },
      { status: 500 }
    )
  }
} 