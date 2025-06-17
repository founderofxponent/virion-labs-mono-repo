import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaign_id parameter is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('campaign_landing_pages')
      .select('*')
      .eq('campaign_id', campaignId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching campaign landing page:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ landing_page: data || null })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaign_id, ...landingPageData } = body

    if (!campaign_id) {
      return NextResponse.json(
        { error: 'campaign_id is required' },
        { status: 400 }
      )
    }

    // Check if campaign exists
    const { data: campaignExists, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('id')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaignExists) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Insert or update landing page data
    const { data, error } = await supabase
      .from('campaign_landing_pages')
      .upsert({
        campaign_id,
        ...landingPageData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'campaign_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating campaign landing page:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ landing_page: data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaign_id, ...landingPageData } = body

    if (!campaign_id) {
      return NextResponse.json(
        { error: 'campaign_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('campaign_landing_pages')
      .update({
        ...landingPageData,
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaign_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign landing page:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ landing_page: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaign_id parameter is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('campaign_landing_pages')
      .delete()
      .eq('campaign_id', campaignId)

    if (error) {
      console.error('Error deleting campaign landing page:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Landing page deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 