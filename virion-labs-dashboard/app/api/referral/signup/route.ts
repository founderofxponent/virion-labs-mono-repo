import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      referral_code, 
      name, 
      email, 
      discord_id, 
      age,
      user_agent,
      ip_address 
    } = body

    // Validate required fields
    if (!referral_code || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: referral_code, name, email' },
        { status: 400 }
      )
    }

    // Find the referral link
    const { data: linkData, error: linkError } = await supabase
      .from('referral_links')
      .select('id, influencer_id, platform, is_active, expires_at, conversions')
      .eq('referral_code', referral_code)
      .single()

    if (linkError || !linkData) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    // Check if link is active and not expired
    if (!linkData.is_active) {
      return NextResponse.json(
        { error: 'Referral link is inactive' },
        { status: 400 }
      )
    }

    if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Referral link has expired' },
        { status: 400 }
      )
    }

    // Check if email already exists for this influencer
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('influencer_id', linkData.influencer_id)
      .eq('email', email)
      .single()

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Email already registered for this influencer' },
        { status: 409 }
      )
    }

    // Create the referral record
    const { data: referralData, error: referralError } = await supabase
      .from('referrals')
      .insert({
        influencer_id: linkData.influencer_id,
        referral_link_id: linkData.id,
        name,
        email,
        discord_id,
        age,
        status: 'pending',
        source_platform: linkData.platform,
        conversion_value: 0,
        metadata: {
          signup_source: 'api',
          user_agent,
          ip_address,
          signup_timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (referralError) {
      console.error('Error creating referral:', referralError)
      return NextResponse.json(
        { error: 'Failed to create referral' },
        { status: 500 }
      )
    }

    // Track the signup as a conversion in analytics
    await supabase
      .from('referral_analytics')
      .insert({
        link_id: linkData.id,
        event_type: 'conversion',
        user_agent,
        ip_address,
        referrer: request.headers.get('referer'),
        conversion_value: 0, // Initial signup, no monetary value yet
        metadata: {
          event: 'signup',
          referral_id: referralData.id,
          email
        }
      })

    // Update the referral link conversion count
    await supabase
      .from('referral_links')
      .update({
        conversions: linkData.conversions + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', linkData.id)

    return NextResponse.json({
      success: true,
      referral_id: referralData.id,
      message: 'Referral signup successful'
    })

  } catch (error) {
    console.error('Referral signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 