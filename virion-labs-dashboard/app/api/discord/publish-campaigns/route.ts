import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Use environment variables for guild and channel configuration
    const guild_id = process.env.DISCORD_GUILD_ID
    const channel_id = process.env.DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID || 'join-campaigns'

    if (!guild_id) {
      return NextResponse.json(
        { error: 'Discord guild ID not configured. Please set DISCORD_GUILD_ID environment variable.' },
        { status: 500 }
      )
    }

    console.log(`📢 Publishing campaigns for configured guild: ${guild_id}`)

    // Get all campaigns for this guild (active and inactive)
    const { data: campaigns, error: campaignsError } = await supabase
      .from('discord_guild_campaigns')
      .select(`
        *,
        clients:client_id(name, industry)
      `)
      .eq('guild_id', guild_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError)
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      )
    }

    // Separate active and inactive campaigns
    const activeCampaigns = campaigns?.filter(c => c.is_active) || []
    const inactiveCampaigns = campaigns?.filter(c => !c.is_active) || []

    console.log(`📊 Found ${activeCampaigns.length} active and ${inactiveCampaigns.length} inactive campaigns`)

    // Prepare the Discord webhook payload
    const webhookPayload = {
      guild_id,
      channel_id,
      campaigns: {
        active: activeCampaigns.map(c => ({
          id: c.id,
          name: c.campaign_name,
          type: c.campaign_type,
          client_name: c.clients?.name || 'Unknown Client',
          description: c.description || '',
          status: 'active'
        })),
        inactive: inactiveCampaigns.map(c => ({
          id: c.id,
          name: c.campaign_name,
          type: c.campaign_type,
          client_name: c.clients?.name || 'Unknown Client',
          description: c.description || '',
          status: getCampaignStatus(c)
        }))
      },
      message_content: createCampaignMessage(activeCampaigns, inactiveCampaigns),
      action: 'publish_campaigns'
    }

    // Send to Discord bot webhook with proper URL handling
    let discordBotUrl = process.env.DISCORD_BOT_WEBHOOK_URL
    
    // If no explicit webhook URL is set, use the current request's origin as fallback
    if (!discordBotUrl) {
      const requestUrl = new URL(request.url)
      const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
      discordBotUrl = `${baseUrl}/api/discord/webhook/publish`
    }
    
    console.log(`📡 Publishing to Discord bot via: ${discordBotUrl}`)
    
    let webhookSuccess = false
    let webhookResult = null

    try {
      const response = await fetch(discordBotUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DISCORD_BOT_API_KEY || 'bot-api-key'}`
        },
        body: JSON.stringify(webhookPayload)
      })

      if (response.ok) {
        webhookResult = await response.json()
        webhookSuccess = true
        console.log('✅ Webhook successful:', webhookResult)
      } else {
        const errorText = await response.text()
        console.error('Discord bot webhook failed:', response.status, errorText)
        console.log('⚠️ Webhook failed, but bot can handle via message detection fallback')
      }
    } catch (webhookError) {
      console.error('Discord bot webhook error:', webhookError)
      console.log('⚠️ Webhook failed, but bot can handle via message detection fallback')
    }

    // Log the publish event regardless of webhook success
    try {
      await supabase
        .from('campaign_publish_logs')
        .insert({
          guild_id,
          channel_id,
          active_campaigns_count: activeCampaigns.length,
          inactive_campaigns_count: inactiveCampaigns.length,
          published_at: new Date().toISOString(),
          published_by: 'dashboard',
          success: webhookSuccess,
          error_message: webhookSuccess ? null : 'Webhook failed, fallback to bot message detection'
        })
    } catch (logError) {
      console.error('Failed to log publish event:', logError)
    }

    return NextResponse.json({
      success: true,
      message: webhookSuccess 
        ? 'Campaigns published to Discord successfully' 
        : 'Publish request sent - Discord bot will process via fallback method',
      campaigns_published: {
        active: activeCampaigns.length,
        inactive: inactiveCampaigns.length
      },
      webhook_used: webhookSuccess,
      discord_response: webhookResult
    })

  } catch (error) {
    console.error('Error publishing campaigns:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function getCampaignStatus(campaign: any) {
  if (campaign.is_deleted) return 'deleted'
  if (!campaign.is_active && campaign.campaign_end_date) return 'archived'
  if (!campaign.is_active && campaign.paused_at) return 'paused'
  if (campaign.is_active) return 'active'
  return 'inactive'
}

function createCampaignMessage(activeCampaigns: any[], inactiveCampaigns: any[]) {
  let message = ''
  
  if (activeCampaigns.length > 0) {
    message += `**Active Campaigns (${activeCampaigns.length}):**\nSelect a campaign to join:\n\n`
  } else {
    message += `**No Active Campaigns Available**\n\n`
  }
  
  if (inactiveCampaigns.length > 0) {
    message += `**Inactive Campaigns (${inactiveCampaigns.length}):**\n`
    inactiveCampaigns.forEach(c => {
      const statusEmoji = c.status === 'paused' ? '⏸️' : c.status === 'archived' ? '📦' : '🚫'
      message += `${statusEmoji} ${c.campaign_name} (${c.status})\n`
    })
  }

  return message
} 