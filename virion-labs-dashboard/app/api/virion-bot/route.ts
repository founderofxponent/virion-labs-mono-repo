import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DISCORD_API_BASE = 'https://discord.com/api/v10'

export async function GET(request: NextRequest) {
  try {
    // Get the single Virion bot instance
    const { data, error } = await supabase
      .from('virion_bot_instances')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching Virion bot instance:', error)
      return NextResponse.json(
        { error: 'Virion bot instance not found' },
        { status: 404 }
      )
    }

    // Get additional statistics
    const { data: configStats } = await supabase
      .from('bot_configurations')
      .select('client_id')
      .eq('is_active', true)

    const { data: activityStats } = await supabase
      .from('discord_activities')
      .select('client_id')
      .eq('is_active', true)

    // Don't expose sensitive information in the response
    const sanitizedData = {
      ...data,
      discord_bot_token: data.discord_bot_token ? '***HIDDEN***' : null,
      total_configurations: configStats?.length || 0,
      total_activities: activityStats?.length || 0
    }

    return NextResponse.json({
      success: true,
      bot: sanitizedData
    })

  } catch (error) {
    console.error('Error in Virion bot API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      discord_application_id,
      discord_bot_token,
      bot_name,
      deployment_strategy,
      global_settings,
      feature_flags
    } = body

    // Get existing bot instance
    const { data: existingBot, error: fetchError } = await supabase
      .from('virion_bot_instances')
      .select('*')
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Virion bot instance not found' },
        { status: 404 }
      )
    }

    // Validate Discord credentials if provided
    if (discord_application_id && discord_bot_token) {
      const isValid = await validateDiscordBotToken(discord_bot_token, discord_application_id)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid Discord bot token or application ID' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (discord_application_id !== undefined) updateData.discord_application_id = discord_application_id
    if (discord_bot_token !== undefined) updateData.discord_bot_token = discord_bot_token
    if (bot_name !== undefined) updateData.bot_name = bot_name
    if (deployment_strategy !== undefined) updateData.deployment_strategy = deployment_strategy
    if (global_settings !== undefined) updateData.global_settings = global_settings
    if (feature_flags !== undefined) updateData.feature_flags = feature_flags

    // Update the bot instance
    const { data: updatedBot, error: updateError } = await supabase
      .from('virion_bot_instances')
      .update(updateData)
      .eq('id', existingBot.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating Virion bot:', updateError)
      return NextResponse.json(
        { error: 'Failed to update Virion bot' },
        { status: 500 }
      )
    }

    // Don't expose sensitive information in the response
    const sanitizedData = {
      ...updatedBot,
      discord_bot_token: updatedBot.discord_bot_token ? '***HIDDEN***' : null
    }

    return NextResponse.json({
      success: true,
      bot: sanitizedData,
      message: 'Virion bot updated successfully'
    })

  } catch (error) {
    console.error('Error updating Virion bot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Get the bot instance
    const { data: botInstance, error: fetchError } = await supabase
      .from('virion_bot_instances')
      .select('*')
      .single()

    if (fetchError || !botInstance) {
      return NextResponse.json(
        { error: 'Virion bot instance not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}
    let message = ''

    switch (action) {
      case 'start':
        updateData = {
          status: 'Online',
          last_online: new Date().toISOString(),
          last_health_check: new Date().toISOString()
        }
        message = 'Bot started successfully'
        break

      case 'stop':
        updateData = {
          status: 'Offline',
          last_health_check: new Date().toISOString()
        }
        message = 'Bot stopped successfully'
        break

      case 'restart':
        updateData = {
          status: 'Online',
          last_online: new Date().toISOString(),
          last_health_check: new Date().toISOString()
        }
        message = 'Bot restarted successfully'
        break

      case 'health_check':
        // Perform Discord API health check
        if (botInstance.discord_bot_token && botInstance.discord_application_id) {
          const isHealthy = await performHealthCheck(botInstance.discord_bot_token)
          updateData = {
            status: isHealthy ? 'Online' : 'Error',
            last_health_check: new Date().toISOString()
          }
          if (isHealthy) {
            updateData.last_online = new Date().toISOString()
          }
        } else {
          updateData = {
            status: 'Error',
            last_health_check: new Date().toISOString()
          }
        }
        message = 'Health check completed'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: start, stop, restart, health_check' },
          { status: 400 }
        )
    }

    // Update bot status
    const { data: updatedBot, error: updateError } = await supabase
      .from('virion_bot_instances')
      .update(updateData)
      .eq('id', botInstance.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating bot status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update bot status' },
        { status: 500 }
      )
    }

    // Don't expose sensitive information
    const sanitizedData = {
      ...updatedBot,
      discord_bot_token: updatedBot.discord_bot_token ? '***HIDDEN***' : null
    }

    return NextResponse.json({
      success: true,
      bot: sanitizedData,
      message
    })

  } catch (error) {
    console.error('Error controlling Virion bot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function validateDiscordBotToken(token: string, applicationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/applications/@me`, {
      headers: {
        'Authorization': `Bot ${token}`
      }
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.id === applicationId
  } catch (error) {
    console.error('Token validation error:', error)
    return false
  }
}

async function performHealthCheck(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        'Authorization': `Bot ${token}`
      }
    })

    return response.ok
  } catch (error) {
    console.error('Health check error:', error)
    return false
  }
} 