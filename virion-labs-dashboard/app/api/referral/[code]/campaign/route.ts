import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    // Get referral link with campaign details
    const { data, error } = await supabase
      .from('referral_links')
      .select(`
        id,
        title,
        description,
        platform,
        discord_invite_url,
        landing_page_enabled,
        is_active,
        expires_at,
        campaign_id,
        discord_guild_campaigns (
          id,
          campaign_name,
          campaign_type,
          guild_id,
          welcome_message,
          brand_color,
          brand_logo_url,
          metadata,
          clients (
            name,
            industry,
            logo
          )
        ),
        user_profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('referral_code', code)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Referral link not found' },
        { status: 404 }
      )
    }

    // Check if link has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Referral link has expired' },
        { status: 410 }
      )
    }

    // Check if landing page is enabled
    if (!data.landing_page_enabled) {
      return NextResponse.json(
        { error: 'Landing page not enabled for this referral link' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      referral_link: data,
      campaign: data.discord_guild_campaigns,
      influencer: data.user_profiles
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 