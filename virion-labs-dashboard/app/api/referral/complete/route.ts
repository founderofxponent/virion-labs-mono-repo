import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      referral_code, 
      discord_user_id, 
      discord_username, 
      guild_id, 
      user_agent = 'Discord Bot',
      conversion_source = 'discord_auto_detection'
    } = body

    if (!referral_code || !discord_user_id || !guild_id) {
      return NextResponse.json(
        { error: 'referral_code, discord_user_id, and guild_id are required' },
        { status: 400 }
      )
    }

    // Find the referral link
    const { data: referralLink, error: linkError } = await supabase
      .from('referral_links')
      .select('id, influencer_id, campaign_id, title, platform')
      .eq('referral_code', referral_code)
      .eq('is_active', true)
      .single()

    if (linkError || !referralLink) {
      return NextResponse.json(
        { error: 'Referral link not found or inactive' },
        { status: 404 }
      )
    }

    // Check if this Discord user already has a referral record for this link
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referral_link_id', referralLink.id)
      .eq('discord_id', discord_user_id)
      .single()

    if (existingReferral) {
      return NextResponse.json({
        success: true,
        message: 'Referral already exists',
        referral_id: existingReferral.id,
        duplicate: true
      })
    }

    // Get campaign details for context
    const { data: campaign } = await supabase
      .from('discord_guild_campaigns')
      .select('campaign_name')
      .eq('id', referralLink.campaign_id)
      .single()

    // Create the referral record
    const { data: referralData, error: referralError } = await supabase
      .from('referrals')
      .insert({
        influencer_id: referralLink.influencer_id,
        referral_link_id: referralLink.id,
        name: discord_username,
        email: null, // Discord doesn't provide email
        discord_id: discord_user_id,
        age: null, // Discord doesn't provide age
        status: 'active', // Discord join is considered active
        source_platform: 'Discord',
        conversion_value: 0, // Initial value, can be updated later
        metadata: {
          signup_source: conversion_source,
          guild_id: guild_id,
          campaign_name: campaign?.campaign_name,
          discord_username: discord_username,
          detected_via: 'discord_bot_auto_detection',
          signup_timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (referralError) {
      console.error('Error creating referral:', referralError)
      return NextResponse.json(
        { error: 'Failed to create referral record' },
        { status: 500 }
      )
    }

    // Track the conversion in analytics
    const { error: analyticsError } = await supabase
      .from('referral_analytics')
      .insert({
        link_id: referralLink.id,
        event_type: 'conversion',
        user_agent: user_agent,
        ip_address: 'discord_bot',
        referrer: `discord_guild_${guild_id}`,
        conversion_value: 0,
        metadata: {
          event: 'discord_join',
          referral_id: referralData.id,
          discord_user_id: discord_user_id,
          discord_username: discord_username,
          guild_id: guild_id,
          campaign_name: campaign?.campaign_name
        }
      })

    if (analyticsError) {
      console.error('Error tracking analytics:', analyticsError)
      // Don't fail the request for analytics errors
    }

    // Update referral link conversion stats
    // Get current count of all referrals for this link (not just active ones)
    const { data: referralCount, error: countError } = await supabase
      .from('referrals')
      .select('id', { count: 'exact' })
      .eq('referral_link_id', referralLink.id)

    if (countError) {
      console.error('Error counting referrals:', countError)
    }

    const { error: updateError } = await supabase
      .from('referral_links')
      .update({
        conversions: referralCount?.length || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', referralLink.id)

    if (updateError) {
      console.error('Error updating referral link stats:', updateError)
    }

    // Update campaign conversion stats
    const { error: campaignUpdateError } = await supabase.rpc('increment_referral_conversion', {
      p_referral_link_id: referralLink.id,
      p_action: 'discord_join'
    })

    if (campaignUpdateError) {
      console.error('Error updating campaign stats:', campaignUpdateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Referral completed successfully',
      referral_id: referralData.id,
      referral_link_id: referralLink.id,
      influencer_id: referralLink.influencer_id,
      duplicate: false
    })

  } catch (error) {
    console.error('Error completing referral:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 