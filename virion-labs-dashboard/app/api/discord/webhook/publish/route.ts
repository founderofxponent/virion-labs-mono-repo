import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guild_id, channel_id, campaigns, message_content, action } = body

    // Use environment variables if not provided in request
    const target_guild_id = guild_id || process.env.DISCORD_GUILD_ID
    const target_channel_id = channel_id || process.env.DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID || 'join-campaigns'

    if (!target_guild_id || action !== 'publish_campaigns') {
      return NextResponse.json(
        { error: 'Invalid request parameters or Discord guild not configured' },
        { status: 400 }
      )
    }

    // This endpoint will be called by the Discord bot
    // The bot should implement the actual Discord message posting logic
    // This endpoint serves as a bridge between dashboard and bot

    console.log(`📢 Publishing campaigns to Discord guild: ${target_guild_id}`)
    console.log(`📋 Active campaigns: ${campaigns.active?.length || 0}`)
    console.log(`📋 Inactive campaigns: ${campaigns.inactive?.length || 0}`)

    // Forward the request to the Discord bot's HTTP server
    const discordBotInternalUrl = process.env.DISCORD_BOT_INTERNAL_URL || 'http://localhost:3001'
    
    try {
      console.log(`🚀 Sending webhook to Discord bot at: ${discordBotInternalUrl}/api/publish-campaigns`);
      
      const botResponse = await fetch(`${discordBotInternalUrl}/api/publish-campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DISCORD_BOT_API_KEY || 'internal-bot-key'}`
        },
        body: JSON.stringify({
          guild_id: target_guild_id,
          channel_id: target_channel_id,
          campaigns,
          message_content
        }),
        timeout: 10000 // 10 second timeout
      })

      if (botResponse.ok) {
        const result = await botResponse.json()
        console.log('✅ Discord bot responded successfully:', result);
        return NextResponse.json({
          success: true,
          message: 'Campaigns published to Discord successfully via direct webhook',
          bot_response: result,
          method: 'webhook'
        })
      } else {
        const errorText = await botResponse.text()
        console.error(`❌ Discord bot HTTP server responded with error: ${botResponse.status} - ${errorText}`)
        
        return NextResponse.json({
          success: false,
          message: 'Discord bot rejected the publish request',
          error: errorText,
          status: botResponse.status
        }, { status: 502 })
      }
    } catch (fetchError) {
      console.error('❌ Failed to connect to Discord bot HTTP server:', fetchError.message)
      
      return NextResponse.json({
        success: false,
        message: 'Could not connect to Discord bot. Please ensure the bot is running.',
        error: fetchError.message
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Error in publish webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 