import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCampaignTemplate } from '@/lib/campaign-templates'

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
    if (!campaign_id || !template_id) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, template_id' },
        { status: 400 }
      )
    }

    // Get the campaign template
    const template = getCampaignTemplate(template_id)
    if (!template) {
      return NextResponse.json(
        { error: 'Invalid template_id' },
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
    const fieldsToInsert = template.onboarding_fields.map((field, index) => ({
      campaign_id,
      field_key: field.id,
      field_label: field.question,
      field_type: field.type,
      field_placeholder: field.placeholder || '',
      field_description: field.description || '',
      field_options: field.options || [],
      is_required: true,
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

    // Update the campaign's template reference
    const { error: updateCampaignError } = await supabase
      .from('discord_guild_campaigns')
      .update({ 
        campaign_template: template_id,
        onboarding_enabled: template.bot_config.features.onboarding 
      })
      .eq('id', campaign_id)

    if (updateCampaignError) {
      console.warn('Failed to update campaign template reference:', updateCampaignError)
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