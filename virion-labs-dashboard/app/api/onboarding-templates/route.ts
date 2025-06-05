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
    const isDefault = searchParams.get('is_default')

    let query = supabase
      .from('onboarding_field_templates')
      .select('*')
      .order('template_name', { ascending: true })

    // Filter by default templates if specified
    if (isDefault !== null) {
      query = query.eq('is_default', isDefault === 'true')
    }

    const { data: templates, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching onboarding templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      template_name,
      template_description,
      field_config,
      is_default
    } = body

    // Validate required fields
    if (!template_name || !field_config) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert new template (for now, allow creating custom templates)
    const { data: template, error } = await supabase
      .from('onboarding_field_templates')
      .insert({
        template_name,
        template_description,
        field_config,
        is_default: is_default || false
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error creating onboarding template:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding template' },
      { status: 500 }
    )
  }
} 