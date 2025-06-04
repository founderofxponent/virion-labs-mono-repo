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
    const campaignType = searchParams.get('campaign_type')
    const isDefault = searchParams.get('is_default')

    let query = supabase
      .from('campaign_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (campaignType) {
      query = query.eq('campaign_type', campaignType)
    }

    if (isDefault !== null) {
      query = query.eq('is_default', isDefault === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching campaign templates:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ templates: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      name,
      description,
      campaign_type,
      template_config,
      is_default,
      created_by
    } = body

    // Validate required fields
    if (!name || !campaign_type || !template_config) {
      return NextResponse.json(
        { error: 'Missing required fields: name, campaign_type, template_config' },
        { status: 400 }
      )
    }

    // Validate campaign_type
    const validCampaignTypes = ['referral_onboarding', 'product_promotion', 'community_engagement', 'support']
    if (!validCampaignTypes.includes(campaign_type)) {
      return NextResponse.json(
        { error: `Invalid campaign_type. Must be one of: ${validCampaignTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('campaign_templates')
      .insert({
        name,
        description,
        campaign_type,
        template_config,
        is_default: is_default || false,
        created_by
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ template: data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 