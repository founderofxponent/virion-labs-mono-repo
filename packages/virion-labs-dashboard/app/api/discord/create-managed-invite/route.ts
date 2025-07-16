import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This is a placeholder for your bot's token.
// In a real-world scenario, this should be stored securely and retrieved
// based on the campaign or client, especially in a multi-bot environment.
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referral_code } = body;

    if (!referral_code) {
      return NextResponse.json({ error: 'referral_code is required' }, { status: 400 });
    }

    if (!DISCORD_BOT_TOKEN) {
        console.error('DISCORD_BOT_TOKEN is not configured on the server.');
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    // 1. Find the referral link and associated campaign details
    const { data: linkData, error: linkError } = await supabase
      .from('referral_links')
      .select(`
        id,
        campaign:discord_guild_campaigns!referral_links_campaign_id_fkey(
          id,
          guild_id,
          channel_id
        )
      `)
      .eq('referral_code', referral_code)
      .single();

    if (linkError || !linkData || !linkData.campaign) {
      console.error('Error fetching referral link or campaign data:', linkError);
      return NextResponse.json({ error: 'Invalid referral code or misconfigured campaign.' }, { status: 404 });
    }
    
    const { id: referral_link_id, campaign } = linkData;
    const { id: campaign_id, guild_id, channel_id } = campaign;

    if (!guild_id || !channel_id) {
        return NextResponse.json({ error: 'Campaign is not configured with a valid Discord server or channel.' }, { status: 400 });
    }

    // 2. Use the Discord API to create a new, single-use invite
    const discordApiUrl = `https://discord.com/api/v10/channels/${channel_id}/invites`;

    const discordResponse = await fetch(discordApiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            max_age: 600, // Invite is valid for 10 minutes
            max_uses: 1, // Invite can only be used once
            unique: true, // Prevent creating a duplicate invite
        }),
    });

    if (!discordResponse.ok) {
        const errorBody = await discordResponse.json();
        console.error('Discord API error:', errorBody);
        return NextResponse.json({ error: 'Failed to create Discord invite.' }, { status: 500 });
    }

    const invite = await discordResponse.json();
    const inviteCode = invite.code;

    // 3. Store the connection between the Discord invite and our referral link
    const { error: saveError } = await supabase
      .from('discord_invite_links')
      .insert({
        campaign_id,
        referral_link_id,
        discord_invite_code: inviteCode,
        discord_invite_url: `https://discord.gg/${inviteCode}`,
        guild_id,
        channel_id,
        max_uses: 1,
      });

    if (saveError) {
        console.error('Error saving managed invite link:', saveError);
        return NextResponse.json({ error: 'Failed to save tracking information.' }, { status: 500 });
    }

    // 4. Return the new invite URL to the frontend
    return NextResponse.json({
      success: true,
      invite_url: `https://discord.gg/${inviteCode}`,
    });

  } catch (error) {
    console.error('Error in create-managed-invite route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
