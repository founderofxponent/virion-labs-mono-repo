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
      campaign_id,
      discord_user_id,
      discord_username,
      guild_id,
      referral_code
    } = body

    if (!campaign_id || !discord_user_id || !discord_username) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, discord_user_id, discord_username' },
        { status: 400 }
      )
    }

    // Check if this user has already completed onboarding for this campaign to prevent duplicates
    const { data: existingCompletions, error: checkError } = await supabase
      .from('campaign_onboarding_completions')
      .select('id')
      .eq('campaign_id', campaign_id)
      .eq('discord_user_id', discord_user_id)

    if (checkError) {
      console.error('Error checking existing completion:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing completion' },
        { status: 500 }
      )
    }

    if (existingCompletions && existingCompletions.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Onboarding already completed for this user',
        duplicate: true
      })
    }

    // Record the completion
    const { error: completionError } = await supabase
      .from('campaign_onboarding_completions')
      .insert({
        campaign_id,
        discord_user_id,
        discord_username,
        guild_id,
        completed_at: new Date().toISOString()
      })

    if (completionError) {
      console.error('Error recording onboarding completion:', completionError)
      return NextResponse.json(
        { error: 'Failed to record onboarding completion' },
        { status: 500 }
      )
    }

    // Increment successful_onboardings count in the campaign
    const { error: updateError } = await supabase.rpc('increment_successful_onboardings', {
      p_campaign_id: campaign_id
    })

    if (updateError) {
      console.error('Error updating campaign successful_onboardings count:', updateError)
      return NextResponse.json(
        { error: 'Failed to update campaign statistics' },
        { status: 500 }
      )
    }

    if (referral_code) {
      // Find the referral link to get the influencer_id and link_id
      const { data: link, error: linkError } = await supabase
        .from('referral_links')
        .select('id, influencer_id')
        .eq('referral_code', referral_code)
        .single();

      if (linkError) {
        console.warn(`Could not find referral link for code: ${referral_code}`, linkError);
        // Don't block completion if the link is not found, just log it
      } else if (link) {
        // Create the referral record to track the conversion
        const { error: referralError } = await supabase
          .from('referrals')
          .insert({
            influencer_id: link.influencer_id,
            referral_link_id: link.id,
            referred_user_id: null, // We may not have a user profile UUID yet
            name: discord_username,
            email: null, // Email is not available at this stage
            discord_id: discord_user_id,
            status: 'completed', // Mark as completed since they finished onboarding
            source_platform: 'Discord',
          });

        if (referralError) {
          console.error('Error creating referral record:', referralError);
          // Don't block completion, just log the error
        } else {
          console.log(`Successfully created referral record for ${discord_username}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completion tracked successfully',
      duplicate: false
    })

  } catch (error) {
    console.error('Error tracking onboarding completion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 