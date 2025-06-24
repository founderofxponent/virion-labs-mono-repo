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

    // Check if this user has already started onboarding for this campaign
    const { data: existingStart, error: checkError } = await supabase
      .from('campaign_onboarding_starts')
      .select('id')
      .eq('campaign_id', campaign_id)
      .eq('discord_user_id', discord_user_id)

    if (checkError) {
      console.error('Error checking existing onboarding start:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing onboarding start' },
        { status: 500 }
      )
    }

    if (existingStart && existingStart.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Onboarding start already tracked for this user',
        duplicate: true
      })
    }

    // Record the onboarding start
    const { error: insertError } = await supabase
      .from('campaign_onboarding_starts')
      .insert({
        campaign_id,
        discord_user_id,
        discord_username,
        guild_id,
        started_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error recording onboarding start:', insertError)
      return NextResponse.json(
        { error: 'Failed to record onboarding start' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding start tracked successfully',
      duplicate: false
    })

  } catch (error) {
    console.error('Error tracking onboarding start:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 