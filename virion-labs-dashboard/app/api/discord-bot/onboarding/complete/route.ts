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
      guild_id
    } = body

    if (!campaign_id || !discord_user_id || !discord_username) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, discord_user_id, discord_username' },
        { status: 400 }
      )
    }

    // Check if this user has already completed onboarding for this campaign to prevent duplicates
    const { data: existingCompletion, error: checkError } = await supabase
      .from('campaign_onboarding_completions')
      .select('id')
      .eq('campaign_id', campaign_id)
      .eq('discord_user_id', discord_user_id)
      .single()

    if (existingCompletion) {
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