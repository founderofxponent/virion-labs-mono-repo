import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referral_code, conversion_value = 0, metadata = {} } = body

    if (!referral_code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    // Find the referral link by code
    const { data: link, error: linkError } = await supabase
      .from('referral_links')
      .select('*')
      .eq('referral_code', referral_code)
      .eq('is_active', true)
      .single()

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'Referral link not found or inactive' },
        { status: 404 }
      )
    }

    // Check if link has expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Referral link has expired' },
        { status: 400 }
      )
    }

    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || ''
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Parse user agent for device/browser info
    const deviceType = userAgent.includes('Mobile') ? 'mobile' : 'desktop'
    const browser = getBrowserFromUserAgent(userAgent)

    // Record the conversion analytics
    const { error: analyticsError } = await supabase
      .from('referral_analytics')
      .insert([{
        link_id: link.id,
        event_type: 'conversion',
        user_agent: userAgent,
        ip_address: ip,
        referrer: referrer,
        device_type: deviceType,
        browser: browser,
        conversion_value: conversion_value,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          url: request.url,
        }
      }])

    if (analyticsError) {
      console.error('Error recording conversion analytics:', analyticsError)
      return NextResponse.json(
        { error: 'Failed to record conversion' },
        { status: 500 }
      )
    }

    // Update conversion count and earnings on the link
    const newConversions = link.conversions + 1
    const newEarnings = link.earnings + conversion_value

    const { error: updateError } = await supabase
      .from('referral_links')
      .update({ 
        conversions: newConversions,
        earnings: newEarnings,
        updated_at: new Date().toISOString()
      })
      .eq('id', link.id)

    if (updateError) {
      console.error('Error updating conversion count:', updateError)
      return NextResponse.json(
        { error: 'Failed to update link statistics' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Conversion recorded successfully',
      data: {
        link_id: link.id,
        conversions: newConversions,
        earnings: newEarnings,
        conversion_value: conversion_value
      }
    })

  } catch (error) {
    console.error('Error processing conversion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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