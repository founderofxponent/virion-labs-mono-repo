import { NextRequest, NextResponse } from 'next/server'

// This endpoint allows the dashboard to invalidate the Discord bot's cache
// when campaign status changes, ensuring immediate effect of pause/resume actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, guild_id } = body

    // Validate the request
    if (!action || !['invalidate', 'clear_all'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "invalidate" or "clear_all"' },
        { status: 400 }
      )
    }

    if (action === 'invalidate' && !guild_id) {
      return NextResponse.json(
        { error: 'guild_id is required for invalidate action' },
        { status: 400 }
      )
    }

    // Get Discord bot webhook URL or direct communication method
    const botWebhookUrl = process.env.DISCORD_BOT_WEBHOOK_URL
    
    if (!botWebhookUrl) {
      console.log('⚠️ Discord bot webhook URL not configured. Cache invalidation will rely on TTL.')
      return NextResponse.json({ 
        success: false, 
        message: 'Cache invalidation webhook not configured' 
      })
    }

    // Send cache invalidation request to Discord bot
    try {
      const response = await fetch(botWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Dashboard/1.0'
        },
        body: JSON.stringify({
          type: 'cache_invalidation',
          action,
          guild_id
        })
      })

      if (response.ok) {
        return NextResponse.json({ 
          success: true, 
          message: `Cache ${action} request sent successfully` 
        })
      } else {
        console.error(`Failed to send cache invalidation: ${response.status}`)
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to send cache invalidation request' 
        }, { status: 500 })
      }
    } catch (error) {
      console.error('Error sending cache invalidation:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Error communicating with Discord bot' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 