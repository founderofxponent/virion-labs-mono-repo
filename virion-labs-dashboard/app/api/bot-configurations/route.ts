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

    let query = supabase
      .from('bot_configurations')
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

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bot configurations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bot configurations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      configurations: data,
      total: data?.length || 0
    })

  } catch (error) {
    console.error('Error in bot configurations API:', error)
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
      guild_id,
      display_name,
      template = 'standard',
      prefix = '!',
      description,
      avatar_url,
      features = {},
      custom_commands = [],
      response_templates = {},
      brand_color = '#7289DA',
      embed_footer,
      welcome_message,
      webhook_url,
      api_endpoints = {},
      external_integrations = {}
    } = body

    // Validate required fields
    if (!client_id || !display_name) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, display_name' },
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

    // Check if configuration already exists for this guild
    if (guild_id) {
      const { data: existingConfig } = await supabase
        .from('bot_configurations')
        .select('id')
        .eq('client_id', client_id)
        .eq('guild_id', guild_id)
        .eq('is_active', true)
        .single()

      if (existingConfig) {
        return NextResponse.json(
          { error: 'Bot configuration already exists for this Discord server' },
          { status: 409 }
        )
      }
    }

    // Create the bot configuration
    const { data: configData, error: configError } = await supabase
      .from('bot_configurations')
      .insert({
        client_id,
        guild_id,
        display_name,
        template,
        prefix,
        description,
        avatar_url,
        features,
        custom_commands,
        response_templates,
        brand_color,
        embed_footer,
        welcome_message,
        webhook_url,
        api_endpoints,
        external_integrations
      })
      .select()
      .single()

    if (configError || !configData) {
      console.error('Database error:', configError)
      return NextResponse.json(
        { error: 'Failed to create bot configuration' },
        { status: 500 }
      )
    }

    // Update client's bot count
    const { error: updateError } = await supabase
      .rpc('increment', { 
        table_name: 'clients', 
        column_name: 'bots', 
        row_id: client_id 
      })

    if (updateError) {
      console.warn('Failed to update client bot count:', updateError)
    }

    return NextResponse.json({
      success: true,
      configuration: configData,
      message: 'Bot configuration created successfully'
    })

  } catch (error) {
    console.error('Error creating bot configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 