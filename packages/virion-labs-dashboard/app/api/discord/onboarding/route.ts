import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch onboarding fields for a campaign (for Discord bot)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')
    const guildId = searchParams.get('guild_id')
    
    if (!campaignId && !guildId) {
      return NextResponse.json({ 
        error: 'Either campaign_id or guild_id is required' 
      }, { status: 400 })
    }

    // Get campaign and fields
    const { data: fields, error } = await supabase
      .from('campaign_onboarding_fields')
      .select('*')
      .eq('campaign_id', campaignId || guildId)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ fields })
  } catch (error) {
    console.error('Error fetching onboarding fields:', error)
    return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 })
  }
}

// POST - Submit onboarding data (from Discord bot)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaign_id, discord_user_id, onboarding_data } = body

    if (!campaign_id || !discord_user_id || !onboarding_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('campaign_user_onboarding')
      .insert({
        campaign_id,
        discord_user_id,
        onboarding_data,
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error saving onboarding data:', error)
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}

// PUT - Update onboarding completion status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      campaign_id, 
      discord_user_id, 
      is_completed,
      completion_notes 
    } = body

    if (!campaign_id || !discord_user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, discord_user_id' },
        { status: 400 }
      )
    }

    const updateData: any = {
      is_completed,
      updated_at: new Date().toISOString()
    }

    if (is_completed) {
      updateData.completed_at = new Date().toISOString()
    }

    if (completion_notes) {
      updateData.completion_notes = completion_notes
    }

    const { data, error } = await supabase
      .from('campaign_user_onboarding')
      .update(updateData)
      .eq('campaign_id', campaign_id)
      .eq('discord_user_id', discord_user_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true,
      onboarding_record: data,
      message: 'Onboarding status updated successfully'
    })
  } catch (error) {
    console.error('Error updating onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to update onboarding status' },
      { status: 500 }
    )
  }
} 