import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const inviteCode = params.code;

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('discord_invite_links')
      .select(`
        referral_link_id,
        campaign_id,
        referral_links:referral_links!inner(
            referral_code
        )
      `)
      .eq('discord_invite_code', inviteCode)
      .single();

    if (error || !data) {
      if (error && error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Managed invite not found' }, { status: 404 });
      }
      console.error('Error fetching managed invite context:', error);
      return NextResponse.json({ error: 'Failed to fetch invite context' }, { status: 500 });
    }
    
    // Get the referral code from the parent table
    const { data: referralLink, error: referralError } = await supabase
        .from('referral_links')
        .select('referral_code')
        .eq('id', data.referral_link_id)
        .single();

    if (referralError || !referralLink) {
        return NextResponse.json({ error: 'Could not find parent referral link.' }, { status: 500 });
    }

    const responseData = {
        referral_link_id: data.referral_link_id,
        campaign_id: data.campaign_id,
        referral_code: referralLink.referral_code,
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error in invite context route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 