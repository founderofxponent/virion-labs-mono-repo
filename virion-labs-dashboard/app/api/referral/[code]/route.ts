import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const userAgent = request.headers.get('user-agent') || ''
  const referrer = request.headers.get('referer') || ''
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  try {
    // Find the referral link by code
    const { data: link, error: linkError } = await supabase
      .from('referral_links')
      .select('*')
      .eq('referral_code', code)
      .eq('is_active', true)
      .single()

    if (linkError || !link) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Check if link has expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Parse user agent for device/browser info
    const deviceType = userAgent.includes('Mobile') ? 'mobile' : 'desktop'
    const browser = getBrowserFromUserAgent(userAgent)

    // Record the click analytics
    const { error: analyticsError } = await supabase
      .from('referral_analytics')
      .insert([{
        link_id: link.id,
        event_type: 'click',
        user_agent: userAgent,
        ip_address: ip,
        referrer: referrer,
        device_type: deviceType,
        browser: browser,
        metadata: {
          timestamp: new Date().toISOString(),
          url: request.url,
        }
      }])

    if (analyticsError) {
      console.error('Error recording analytics:', analyticsError)
    }

    // Update click count on the link
    const { error: updateError } = await supabase
      .from('referral_links')
      .update({ 
        clicks: link.clicks + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', link.id)

    if (updateError) {
      console.error('Error updating click count:', updateError)
    }

    // Redirect to the original URL
    return NextResponse.redirect(link.original_url)

  } catch (error) {
    console.error('Error processing referral:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}

function getBrowserFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  if (userAgent.includes('Opera')) return 'Opera'
  return 'Other'
} 