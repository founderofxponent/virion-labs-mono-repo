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
    if (!campaign_id || !template_id) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, template_id' },
        { status: 400 }
      )
    }

    // Call the database function to apply template
    const { data, error } = await supabase
      .rpc('apply_onboarding_template_to_campaign', {
        p_campaign_id: campaign_id,
        p_template_id: template_id
      })

    if (error) {
      throw error
    }

    // Fetch the updated fields
    const { data: fields, error: fieldsError } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', campaign_id)
      .order('sort_order', { ascending: true })

    if (fieldsError) {
      throw fieldsError
    }

    return NextResponse.json({ success: true, fields })
  } catch (error) {
    console.error('Error applying template to campaign:', error)
    return NextResponse.json(
      { error: 'Failed to apply template to campaign' },
      { status: 500 }
    )
  }
} 