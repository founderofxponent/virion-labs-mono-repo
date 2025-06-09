import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')
    
    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    // Fetch onboarding fields for the campaign
    const { data: fields, error } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('sort_order', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ fields })
  } catch (error) {
    console.error('Error fetching onboarding fields:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding fields' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      campaign_id,
      field_key,
      field_label,
      field_type,
      field_placeholder,
      field_description,
      field_options,
      is_required,
      is_enabled,
      sort_order,
      validation_rules
    } = body

    // Validate required fields
    if (!campaign_id || !field_key || !field_label || !field_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert new field
    const { data: field, error } = await supabase
      .from('campaign_onboarding_fields')
      .insert({
        campaign_id,
        field_key,
        field_label,
        field_type,
        field_placeholder,
        field_description,
        field_options: field_options || [],
        is_required: is_required || false,
        is_enabled: is_enabled !== false,
        sort_order: sort_order || 0,
        validation_rules: validation_rules || {},
        discord_integration: body.discord_integration || {
          collect_in_dm: true,
          show_in_embed: true
        }
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ field })
  } catch (error) {
    console.error('Error creating onboarding field:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding field' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 })
    }

    // Update field
    const { data: field, error } = await supabase
      .from('campaign_onboarding_fields')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ field })
  } catch (error) {
    console.error('Error updating onboarding field:', error)
    return NextResponse.json(
      { error: 'Failed to update onboarding field' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fieldId = searchParams.get('id')
    
    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 })
    }

    // Delete field
    const { error } = await supabase
      .from('campaign_onboarding_fields')
      .delete()
      .eq('id', fieldId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting onboarding field:', error)
    return NextResponse.json(
      { error: 'Failed to delete onboarding field' },
      { status: 500 }
    )
  }
} 