import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { campaign_id, discord_user_id } = await request.json()

    if (!campaign_id || !discord_user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, discord_user_id' },
        { status: 400 }
      )
    }

    // Get campaign configuration
    const { data: campaign, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get campaign template from database to check completion requirements
    const { data: templateData, error: templateError } = await supabase
      .from('campaign_templates')
      .select('*')
      .eq('campaign_type', campaign.campaign_type)
      .eq('is_default', true)
      .single()

    if (templateError || !templateData) {
      return NextResponse.json(
        { error: 'Invalid campaign template' },
        { status: 400 }
      )
    }

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

    // Get user's onboarding responses
    const { data: responses, error: responsesError } = await supabase
      .from('campaign_onboarding_responses')
      .select('field_id, field_value')
      .eq('campaign_id', campaign_id)
      .eq('discord_user_id', discord_user_id)

    if (responsesError) {
      return NextResponse.json(
        { error: 'Error fetching onboarding responses' },
        { status: 500 }
      )
    }

    // Check completion requirements from campaign config or template default
    const completionRequirements = campaign.onboarding_completion_requirements || 
      template.bot_config.onboarding_completion_requirements || 
      { required_fields: [] }

    const requiredFields = completionRequirements.required_fields || []
    const completedFields = responses?.map(r => r.field_id) || []
    
    // Check if all required fields are completed
    const isComplete = requiredFields.every(fieldId => completedFields.includes(fieldId))

    if (!isComplete) {
      const missingFields = requiredFields.filter(fieldId => !completedFields.includes(fieldId))
      return NextResponse.json({
        completed: false,
        missing_fields: missingFields,
        completion_percentage: Math.round((completedFields.length / requiredFields.length) * 100)
      })
    }

    // Mark onboarding as complete
    const { error: updateError } = await supabase
      .from('campaign_onboarding_responses')
      .update({ 
        onboarding_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('campaign_id', campaign_id)
      .eq('discord_user_id', discord_user_id)

    if (updateError) {
      console.error('Error updating completion status:', updateError)
    }

    // Return completion details
    const completionMessage = completionRequirements.completion_message || 
      template.bot_config.onboarding_completion_requirements?.completion_message ||
      'Congratulations! Your onboarding is complete.'

    return NextResponse.json({
      completed: true,
      completion_message: completionMessage,
      auto_role_on_completion: completionRequirements.auto_role_on_completion,
      completion_webhook: completionRequirements.completion_webhook,
      template_id: template.id,
      template_name: template.name
    })

  } catch (error) {
    console.error('Error checking onboarding completion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 