import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { error: 'Discord invite code is required' },
        { status: 400 }
      );
    }

    // Find the Discord invite link in our database
    const { data: inviteLink, error: inviteError } = await supabase
      .from('discord_invite_links')
      .select('*')
      .eq('discord_invite_code', code)
      .eq('is_active', true)
      .single();

    if (inviteError || !inviteLink) {
      return NextResponse.json(
        { error: 'Discord invite not found or not associated with a referral campaign' },
        { status: 404 }
      );
    }

    // Get referral link details
    const { data: referralLink, error: referralError } = await supabase
      .from('referral_links')
      .select('id, referral_code, title, influencer_id, campaign_id')
      .eq('id', inviteLink.referral_link_id)
      .single();

    if (referralError || !referralLink) {
      return NextResponse.json(
        { error: 'Associated referral link not found' },
        { status: 404 }
      );
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('id, campaign_name, campaign_type, guild_id, welcome_message, brand_color, metadata, client_id')
      .eq('id', referralLink.campaign_id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Associated campaign not found' },
        { status: 404 }
      );
    }

    // Get client details
    const { data: client } = await supabase
      .from('clients')
      .select('name, industry')
      .eq('id', campaign.client_id)
      .single();

    // Get influencer details
    const { data: influencer } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', referralLink.influencer_id)
      .single();

    return NextResponse.json({
      success: true,
      invite_context: {
        discord_invite_code: code,
        discord_invite_url: inviteLink.discord_invite_url,
        guild_id: inviteLink.guild_id,
        referral_code: referralLink.referral_code,
        campaign: {
          id: campaign.id,
          name: campaign.campaign_name,
          type: campaign.campaign_type,
          welcome_message: campaign.welcome_message,
          brand_color: campaign.brand_color,
          metadata: campaign.metadata
        },
        client: {
          name: client?.name,
          industry: client?.industry
        },
        influencer: {
          id: referralLink.influencer_id,
          name: influencer?.full_name
        }
      }
    });

  } catch (error) {
    console.error('Error fetching Discord invite context:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 