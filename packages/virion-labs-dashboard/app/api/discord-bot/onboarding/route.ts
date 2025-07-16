import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Start onboarding session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      campaign_id,
      discord_user_id,
      discord_username,
      referral_id,
      referral_link_id,
      interaction_id
    } = body

    if (!campaign_id || !discord_user_id || !discord_username) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, discord_user_id, discord_username' },
        { status: 400 }
      )
    }

    // Get onboarding fields for this campaign
    const { data: fields, error: fieldsError } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })

    if (fieldsError) {
      throw fieldsError
    }

    if (!fields || fields.length === 0) {
      return NextResponse.json({
        success: true,
        session_id: null,
        fields: [],
        message: 'No onboarding fields configured for this campaign'
      })
    }

    // Check if user already has an incomplete session
    const { data: existingSession, error: sessionError } = await supabase
      .from('campaign_onboarding_responses')
      .select('id, field_key, field_value, is_completed')
      .eq('campaign_id', campaign_id)
      .eq('discord_user_id', discord_user_id)

    if (sessionError) {
      throw sessionError
    }

    // Find the next field to ask
    const completedFieldKeys = new Set(
      existingSession
        ?.filter(response => response.field_value && response.field_value.trim() !== '')
        .map(response => response.field_key) || []
    )

    const nextField = fields.find(field => !completedFieldKeys.has(field.field_key))

    return NextResponse.json({
      success: true,
      fields: fields,
      completed_fields: Array.from(completedFieldKeys),
      next_field: nextField || null,
      is_completed: !nextField,
      existing_responses: existingSession || []
    })
  } catch (error) {
    console.error('Error starting onboarding session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Save onboarding response
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      campaign_id,
      discord_user_id,
      discord_username,
      field_key,
      field_value,
      referral_id,
      referral_link_id,
      interaction_id
    } = body

    if (!campaign_id || !discord_user_id || !field_key || field_value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, discord_user_id, field_key, field_value' },
        { status: 400 }
      )
    }

    // Validate that the field exists and is enabled for this campaign
    const { data: field, error: fieldError } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('field_key', field_key)
      .eq('is_enabled', true)
      .single()

    if (fieldError || !field) {
      return NextResponse.json(
        { error: 'Invalid field key for this campaign' },
        { status: 400 }
      )
    }

    // Validate field value based on field type
    const validationResult = validateFieldValue(field, field_value)
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.message },
        { status: 400 }
      )
    }

    // Upsert the response
    const { data: response, error: responseError } = await supabase
      .from('campaign_onboarding_responses')
      .upsert({
        campaign_id,
        discord_user_id,
        discord_username,
        field_key,
        field_value: validationResult.value,
        referral_id: referral_id || null,
        referral_link_id: referral_link_id || null,
        interaction_id: interaction_id || null,
        is_completed: false
      }, {
        onConflict: 'campaign_id,discord_user_id,field_key'
      })
      .select()
      .single()

    if (responseError) {
      throw responseError
    }

    // Check if all fields are now completed
    const { data: allFields, error: allFieldsError } = await supabase
      .from('campaign_onboarding_fields')
      .select('field_key')
      .eq('campaign_id', campaign_id)
      .eq('is_enabled', true)

    if (allFieldsError) {
      throw allFieldsError
    }

    const { data: allResponses, error: allResponsesError } = await supabase
      .from('campaign_onboarding_responses')
      .select('field_key, field_value')
      .eq('campaign_id', campaign_id)
      .eq('discord_user_id', discord_user_id)

    if (allResponsesError) {
      throw allResponsesError
    }

    // Check completion status - only complete when ALL fields are answered
    const allFieldKeys = allFields.map(f => f.field_key)
    const completedFields = allResponses
      .filter(r => r.field_value && r.field_value.trim() !== '')
      .map(r => r.field_key)

    // Onboarding is complete only when ALL fields are answered
    const isCompleted = allFieldKeys.every(field => completedFields.includes(field))
    const nextField = allFields.find(f => !completedFields.includes(f.field_key))

    // If completed, mark all responses as completed
    if (isCompleted) {
      await supabase
        .from('campaign_onboarding_responses')
        .update({ is_completed: true })
        .eq('campaign_id', campaign_id)
        .eq('discord_user_id', discord_user_id)
    }

    return NextResponse.json({
      success: true,
      response,
      is_completed: isCompleted,
      next_field: nextField || null,
      completed_fields: completedFields,
      total_fields: allFields.length
    })
  } catch (error) {
    console.error('Error saving onboarding response:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get onboarding session status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')
    const discordUserId = searchParams.get('discord_user_id')

    if (!campaignId || !discordUserId) {
      return NextResponse.json(
        { error: 'Missing required parameters: campaign_id, discord_user_id' },
        { status: 400 }
      )
    }

    // Get all responses for this user and campaign
    const { data: responses, error: responsesError } = await supabase
      .from('campaign_onboarding_responses')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('discord_user_id', discordUserId)

    if (responsesError) {
      throw responsesError
    }

    // Get all fields for this campaign
    const { data: fields, error: fieldsError } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })

    if (fieldsError) {
      throw fieldsError
    }

    const completedFieldKeys = new Set(
      responses?.filter(r => r.field_value && r.field_value.trim() !== '').map(r => r.field_key) || []
    )

    // Onboarding is complete only when ALL fields are answered
    const allFieldKeys = fields.map(f => f.field_key)
    const isCompleted = allFieldKeys.every(f => completedFieldKeys.has(f))
    const nextField = fields.find(f => !completedFieldKeys.has(f.field_key))

    return NextResponse.json({
      success: true,
      responses: responses || [],
      fields: fields || [],
      completed_fields: Array.from(completedFieldKeys),
      is_completed: isCompleted,
      next_field: nextField || null,
      progress: {
        completed: completedFieldKeys.size,
        total: fields.length
      }
    })
  } catch (error) {
    console.error('Error fetching onboarding session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Field validation helper
function validateFieldValue(field: any, value: any) {
  // All fields are now required
  if (!value || value.trim() === '') {
    return { valid: false, message: 'This field is required' }
  }

  const trimmedValue = value.trim()

  switch (field.field_type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedValue)) {
        return { valid: false, message: 'Please enter a valid email address' }
      }
      break

    case 'number':
      const num = parseFloat(trimmedValue)
      if (isNaN(num)) {
        return { valid: false, message: 'Please enter a valid number' }
      }
      return { valid: true, value: num.toString() }

    case 'select':
      const options = field.field_options || []
      if (options.length > 0) {
        // Check for case-insensitive match first
        const matchingOption = options.find((option: string) => 
          option.toLowerCase() === trimmedValue.toLowerCase()
        )
        
        if (matchingOption) {
          // Use the correctly cased option from the list
          return { valid: true, value: matchingOption }
        }
        
        // If no exact match found, allow any text input (user preference)
        // This maintains flexibility while preserving the validation structure
        console.log(`Field ${field.field_key}: User entered "${trimmedValue}", available options: ${options.join(', ')}. Allowing custom input.`)
      }
      break

    case 'checkbox':
      const validCheckboxValues = ['yes', 'no', 'true', 'false', '1', '0']
      if (!validCheckboxValues.includes(trimmedValue.toLowerCase())) {
        return { valid: false, message: 'Please answer with yes/no or true/false' }
      }
      break

    case 'date':
      const date = new Date(trimmedValue)
      if (isNaN(date.getTime())) {
        return { valid: false, message: 'Please enter a valid date (YYYY-MM-DD format)' }
      }
      break
  }

  // Apply custom validation rules if any
  if (field.validation_rules) {
    const rules = field.validation_rules
    
    if (rules.min_length && trimmedValue.length < rules.min_length) {
      return { valid: false, message: `Minimum length is ${rules.min_length} characters` }
    }
    
    if (rules.max_length && trimmedValue.length > rules.max_length) {
      return { valid: false, message: `Maximum length is ${rules.max_length} characters` }
    }
    
    if (rules.pattern) {
      const regex = new RegExp(rules.pattern)
      if (!regex.test(trimmedValue)) {
        return { valid: false, message: rules.pattern_message || 'Invalid format' }
      }
    }
  }

  return { valid: true, value: trimmedValue }
} 