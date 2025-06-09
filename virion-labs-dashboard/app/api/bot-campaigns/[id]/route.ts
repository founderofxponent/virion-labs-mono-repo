import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('bot_campaign_configs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching bot campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ campaign: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Remove read-only fields
    const {
      id,
      created_at,
      updated_at,
      client_name,
      client_industry,
      client_logo,
      referral_link_title,
      referral_code,
      referral_platform,
      influencer_name,
      influencer_email,
      commands_used,
      users_served,
      last_activity_at,
      total_interactions,
      successful_onboardings,
      referral_conversions,
      ...updateData
    } = body

    // Update configuration_version to track changes
    updateData.configuration_version = (updateData.configuration_version || 1) + 1

    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        clients:client_id(name, industry),
        referral_links:referral_link_id(title, referral_code, platform),
        user_profiles:influencer_id(full_name, email)
      `)
      .single()

    if (error) {
      console.error('Error updating bot campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ campaign: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .delete()
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error deleting bot campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Campaign deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Archive/activate a campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action } = body

    if (!action || !['archive', 'activate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "archive" or "activate"' },
        { status: 400 }
      )
    }

    const updateData = {
      is_active: action === 'activate',
      ...(action === 'archive' && { campaign_end_date: new Date().toISOString() })
    }

    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error(`Error ${action}ing bot campaign:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      campaign: data,
      message: `Campaign ${action}d successfully`
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 