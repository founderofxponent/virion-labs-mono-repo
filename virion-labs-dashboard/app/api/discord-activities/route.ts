import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const client_id = searchParams.get('client_id')
    const guild_id = searchParams.get('guild_id')
    const activity_type = searchParams.get('activity_type')

    let query = supabase
      .from('discord_activities')
      .select(`
        *,
        client:clients(id, name, industry, logo)
      `)
      .eq('is_active', true)

    if (client_id) {
      query = query.eq('client_id', client_id)
    }

    if (guild_id) {
      query = query.eq('guild_id', guild_id)
    }

    if (activity_type) {
      query = query.eq('activity_type', activity_type)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching Discord activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch Discord activities' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      activities: data,
      total: data?.length || 0
    })

  } catch (error) {
    console.error('Error in Discord activities API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      client_id,
      activity_name,
      activity_type = 'embedded_app',
      activity_config = {},
      guild_id,
      channel_id,
      activity_url,
      custom_assets = {},
      client_branding = {},
      persistent_data = {},
      user_data = {}
    } = body

    // Validate required fields
    if (!client_id || !activity_name) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, activity_name' },
        { status: 400 }
      )
    }

    // Validate client exists and is active
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', client_id)
      .eq('status', 'Active')
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Invalid or inactive client' },
        { status: 400 }
      )
    }

    // Check for duplicate activity name for the same client
    const { data: existingActivity } = await supabase
      .from('discord_activities')
      .select('id')
      .eq('client_id', client_id)
      .eq('activity_name', activity_name)
      .eq('is_active', true)
      .single()

    if (existingActivity) {
      return NextResponse.json(
        { error: 'Activity with this name already exists for this client' },
        { status: 409 }
      )
    }

    // Create the Discord activity
    const { data: activityData, error: activityError } = await supabase
      .from('discord_activities')
      .insert({
        client_id,
        activity_name,
        activity_type,
        activity_config,
        guild_id,
        channel_id,
        activity_url,
        custom_assets,
        client_branding,
        persistent_data,
        user_data,
        usage_stats: {
          total_launches: 0,
          unique_users: 0,
          total_interactions: 0,
          avg_session_duration: 0
        }
      })
      .select(`
        *,
        client:clients(id, name, industry, logo)
      `)
      .single()

    if (activityError || !activityData) {
      console.error('Database error:', activityError)
      return NextResponse.json(
        { error: 'Failed to create Discord activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      activity: activityData,
      message: 'Discord activity created successfully'
    })

  } catch (error) {
    console.error('Error creating Discord activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 