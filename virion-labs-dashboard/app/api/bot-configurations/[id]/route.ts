import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('bot_configurations')
      .select(`
        *,
        client:clients(id, name, industry, logo)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching bot configuration:', error)
      return NextResponse.json(
        { error: 'Bot configuration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      configuration: data
    })

  } catch (error) {
    console.error('Error in bot configuration API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
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
      external_integrations,
      is_active
    } = body

    // Validate the configuration exists
    const { data: existingConfig, error: fetchError } = await supabase
      .from('bot_configurations')
      .select('id, client_id, configuration_version')
      .eq('id', id)
      .single()

    if (fetchError || !existingConfig) {
      return NextResponse.json(
        { error: 'Bot configuration not found' },
        { status: 404 }
      )
    }

    // Update the configuration
    const updateData: any = {}
    
    if (display_name !== undefined) updateData.display_name = display_name
    if (template !== undefined) updateData.template = template
    if (prefix !== undefined) updateData.prefix = prefix
    if (description !== undefined) updateData.description = description
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (features !== undefined) updateData.features = features
    if (custom_commands !== undefined) updateData.custom_commands = custom_commands
    if (response_templates !== undefined) updateData.response_templates = response_templates
    if (brand_color !== undefined) updateData.brand_color = brand_color
    if (embed_footer !== undefined) updateData.embed_footer = embed_footer
    if (welcome_message !== undefined) updateData.welcome_message = welcome_message
    if (webhook_url !== undefined) updateData.webhook_url = webhook_url
    if (api_endpoints !== undefined) updateData.api_endpoints = api_endpoints
    if (external_integrations !== undefined) updateData.external_integrations = external_integrations
    if (is_active !== undefined) updateData.is_active = is_active
    
    // Increment configuration version
    updateData.configuration_version = existingConfig.configuration_version + 1

    const { data: updatedConfig, error: updateError } = await supabase
      .from('bot_configurations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, industry, logo)
      `)
      .single()

    if (updateError) {
      console.error('Error updating bot configuration:', updateError)
      return NextResponse.json(
        { error: 'Failed to update bot configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      configuration: updatedConfig,
      message: 'Bot configuration updated successfully'
    })

  } catch (error) {
    console.error('Error updating bot configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get configuration details before deletion
    const { data: configData, error: fetchError } = await supabase
      .from('bot_configurations')
      .select('client_id')
      .eq('id', id)
      .single()

    if (fetchError || !configData) {
      return NextResponse.json(
        { error: 'Bot configuration not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('bot_configurations')
      .update({ is_active: false })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting bot configuration:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete bot configuration' },
        { status: 500 }
      )
    }

    // Decrement client's bot count
    const { error: updateError } = await supabase
      .rpc('decrement', { 
        table_name: 'clients', 
        column_name: 'bots', 
        row_id: configData.client_id 
      })

    if (updateError) {
      console.warn('Failed to update client bot count:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Bot configuration deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting bot configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 