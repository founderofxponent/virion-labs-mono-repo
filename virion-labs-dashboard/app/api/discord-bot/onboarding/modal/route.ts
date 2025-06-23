import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Handle modal form submissions from Discord
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      campaign_id,
      discord_user_id,
      discord_username,
      responses,
      modal_part,
      referral_id,
      referral_link_id
    } = body

    if (!campaign_id || !discord_user_id || !responses) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, discord_user_id, responses' },
        { status: 400 }
      )
    }

    console.log(`📝 Processing modal submission for ${discord_username}: ${Object.keys(responses).length} responses`)

    // Get all onboarding fields for this campaign
    const { data: allFields, error: fieldsError } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })

    if (fieldsError) {
      throw fieldsError
    }

    if (!allFields || allFields.length === 0) {
      return NextResponse.json(
        { error: 'No onboarding fields configured for this campaign' },
        { status: 400 }
      )
    }

    // Validate and save each response
    const validationErrors = []
    const savedResponses = []

    for (const [fieldKey, fieldValue] of Object.entries(responses)) {
      const field = allFields.find(f => f.field_key === fieldKey)
      if (!field) {
        validationErrors.push(`Invalid field: ${fieldKey}`)
        continue
      }

      // Validate field value
      const validationResult = validateFieldValue(field, fieldValue)
      if (!validationResult.valid) {
        validationErrors.push(`${field.field_label}: ${validationResult.message}`)
        continue
      }

      // Save/update response
      const { data: response, error: responseError } = await supabase
        .from('campaign_onboarding_responses')
        .upsert({
          campaign_id,
          discord_user_id,
          discord_username,
          field_key: fieldKey,
          field_value: validationResult.value,
          referral_id: referral_id || null,
          referral_link_id: referral_link_id || null,
          is_completed: false
        }, {
          onConflict: 'campaign_id,discord_user_id,field_key'
        })
        .select()
        .single()

      if (responseError) {
        console.error(`Error saving response for ${fieldKey}:`, responseError)
        validationErrors.push(`Failed to save ${field.field_label}`)
        continue
      }

      savedResponses.push(response)
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Validation errors: ${validationErrors.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Check completion status
    const { data: allResponses, error: allResponsesError } = await supabase
      .from('campaign_onboarding_responses')
      .select('field_key, field_value')
      .eq('campaign_id', campaign_id)
      .eq('discord_user_id', discord_user_id)

    if (allResponsesError) {
      throw allResponsesError
    }

    // Determine what fields are still incomplete
    const allFieldKeys = allFields.map(f => f.field_key)
    const completedFieldKeys = new Set(
      allResponses?.filter(r => r.field_value && r.field_value.trim() !== '').map(r => r.field_key) || []
    )

    const incompleteFields = allFields.filter(f => !completedFieldKeys.has(f.field_key))
    const isCompleted = incompleteFields.length === 0

    // If completed, mark all responses as completed
    if (isCompleted) {
      await supabase
        .from('campaign_onboarding_responses')
        .update({ is_completed: true })
        .eq('campaign_id', campaign_id)
        .eq('discord_user_id', discord_user_id)

      console.log(`✅ Onboarding completed for ${discord_username}`)
    }

    // Determine if we need another modal (max 5 fields per modal)
    const FIELDS_PER_MODAL = 5
    const nextModalFields = incompleteFields.length > 0 
      ? incompleteFields.slice(0, FIELDS_PER_MODAL)
      : []

    const hasMoreFieldsAfterNext = incompleteFields.length > FIELDS_PER_MODAL

    return NextResponse.json({
      success: true,
      is_completed: isCompleted,
      saved_responses: savedResponses.length,
      total_fields: allFields.length,
      completed_fields: Array.from(completedFieldKeys),
      remaining_fields: incompleteFields.length,
      next_modal_fields: nextModalFields,
      has_more_modals: hasMoreFieldsAfterNext,
      progress: {
        completed: completedFieldKeys.size,
        total: allFields.length,
        percentage: Math.round((completedFieldKeys.size / allFields.length) * 100)
      }
    })

  } catch (error) {
    console.error('Error processing modal submission:', error)
    return NextResponse.json(
      { error: 'Internal server error while processing responses' },
      { status: 500 }
    )
  }
}

// Field validation helper (same as in the regular onboarding route)
function validateFieldValue(field: any, value: any) {
  // All fields are required
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

    case 'url':
      try {
        new URL(trimmedValue)
      } catch {
        return { valid: false, message: 'Please enter a valid URL' }
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