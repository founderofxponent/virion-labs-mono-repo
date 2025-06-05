import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DISCORD_API_BASE = 'https://discord.com/api/v10'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guild_id, channel_id, campaign_id, referral_link_id, max_uses = 0, max_age = 0 } = body

    if (!guild_id || !campaign_id) {
      return NextResponse.json(
        { error: 'guild_id and campaign_id are required' },
        { status: 400 }
      )
    }

    // Get Discord bot token from environment
    const botToken = process.env.DISCORD_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json(
        { error: 'Discord bot token not configured' },
        { status: 500 }
      )
    }

    // Get campaign details to verify it exists
    const { data: campaign, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('id, guild_id, channel_id')
      .eq('id', campaign_id)
      .eq('guild_id', guild_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or guild_id mismatch' },
        { status: 404 }
      )
    }

    // Use campaign's channel_id if not provided
    const targetChannelId = channel_id || campaign.channel_id

    // If no channel specified, get the first available text channel
    let inviteChannelId = targetChannelId
    if (!inviteChannelId) {
      try {
        const channelsResponse = await fetch(`${DISCORD_API_BASE}/guilds/${guild_id}/channels`, {
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (channelsResponse.ok) {
          const channels = await channelsResponse.json()
          const textChannel = channels.find((ch: any) => ch.type === 0) // Text channel type
          if (textChannel) {
            inviteChannelId = textChannel.id
          }
        }
      } catch (error) {
        console.error('Error fetching channels:', error)
      }
    }

    if (!inviteChannelId) {
      return NextResponse.json(
        { error: 'No suitable channel found for invite creation' },
        { status: 400 }
      )
    }

    // Create Discord invite using Discord API
    const inviteResponse = await fetch(`${DISCORD_API_BASE}/channels/${inviteChannelId}/invites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        max_age: max_age, // 0 = never expires
        max_uses: max_uses, // 0 = unlimited uses
        temporary: false,
        unique: true
      })
    })

    if (!inviteResponse.ok) {
      const errorData = await inviteResponse.json()
      console.error('Discord API error:', errorData)
      return NextResponse.json(
        { error: `Failed to create Discord invite: ${errorData.message || 'Unknown error'}` },
        { status: inviteResponse.status }
      )
    }

    const discordInvite = await inviteResponse.json()
    const inviteUrl = `https://discord.gg/${discordInvite.code}`

    // Store the invite in our database
    const { data: storedInvite, error: storeError } = await supabase
      .from('discord_invite_links')
      .insert({
        campaign_id,
        referral_link_id,
        discord_invite_code: discordInvite.code,
        discord_invite_url: inviteUrl,
        guild_id,
        channel_id: inviteChannelId,
        max_uses,
        expires_at: max_age > 0 ? new Date(Date.now() + max_age * 1000).toISOString() : null,
        is_active: true
      })
      .select()
      .single()

    if (storeError) {
      console.error('Error storing invite:', storeError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      invite: {
        code: discordInvite.code,
        url: inviteUrl,
        guild_id,
        channel_id: inviteChannelId,
        max_uses,
        expires_at: max_age > 0 ? new Date(Date.now() + max_age * 1000).toISOString() : null
      },
      discord_invite_data: discordInvite
    })

  } catch (error) {
    console.error('Error creating Discord invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 