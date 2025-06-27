import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()
    
    const { 
      action, 
      discord_invite_url, 
      campaign_id, 
      influencer_id 
    } = body

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      )
    }

    // Find the referral link
    const { data: referralLink, error: linkError } = await supabase
      .from('referral_links')
      .select('id, title, platform, is_active, clicks')
      .eq('referral_code', code)
      .single()

    if (linkError || !referralLink) {
      return NextResponse.json(
        { error: 'Referral link not found' },
        { status: 404 }
      )
    }

    if (!referralLink.is_active) {
      return NextResponse.json(
        { error: 'Referral link is not active' },
        { status: 400 }
      )
    }

    // Get user agent and IP for analytics
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown'

    // Track the conversion intent in analytics
    const { error: analyticsError } = await supabase
      .from('referral_analytics')
      .insert({
        link_id: referralLink.id,
        event_type: 'click', // This is a click event leading to conversion
        user_agent: userAgent,
        ip_address: clientIp,
        referrer: request.headers.get('referer') || null,
        conversion_value: 0, // Initial value, actual conversion happens on Discord join
        metadata: {
          event: action,
          action_type: 'discord_redirect',
          discord_invite_url: discord_invite_url,
          campaign_id: campaign_id,
          influencer_id: influencer_id,
          timestamp: new Date().toISOString()
        }
      })

    if (analyticsError) {
      console.error('Error tracking conversion analytics:', analyticsError)
      // Don't fail the request for analytics errors
    }

    

    return NextResponse.json({
      success: true,
      message: 'Conversion tracked successfully',
      action: action,
      referral_link_id: referralLink.id
    })

  } catch (error) {
    console.error('Error tracking referral conversion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 