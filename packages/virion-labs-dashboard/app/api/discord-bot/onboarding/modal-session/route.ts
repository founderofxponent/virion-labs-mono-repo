import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Store modal session in database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      campaign_id,
      discord_user_id,
      discord_username,
      session_data
    } = body

    if (!campaign_id || !discord_user_id || !session_data) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, discord_user_id, session_data' },
        { status: 400 }
      )
    }

    console.log(`📦 Storing modal session for ${discord_username} in campaign ${campaign_id}`)

    // Store session data using campaign_onboarding_responses table with a special field
    const sessionKey = `modal_session_${campaign_id}_${discord_user_id}`
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
    
    const { data: session, error } = await supabase
      .from('campaign_onboarding_responses')
      .upsert({
        campaign_id,
        discord_user_id,
        discord_username,
        field_key: '__modal_session__',
        field_value: JSON.stringify({
          ...session_data,
          expires_at: expiresAt,
          stored_at: new Date().toISOString()
        }),
        is_completed: false
      }, {
        onConflict: 'campaign_id,discord_user_id,field_key'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error storing modal session:', error)
      return NextResponse.json(
        { error: 'Failed to store session' },
        { status: 500 }
      )
    }

    console.log(`✅ Modal session stored successfully for ${discord_username}`)
    return NextResponse.json({ success: true, session_id: session.id })

  } catch (error) {
    console.error('Error in modal session POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Retrieve modal session from database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')
    const discordUserId = searchParams.get('discord_user_id')

    if (!campaignId || !discordUserId) {
      return NextResponse.json(
        { error: 'Missing required parameters: campaign_id, discord_user_id' },
        { status: 400 }
      )
    }

    console.log(`🔍 Looking for modal session: ${campaignId} / ${discordUserId}`)

    // Get session data from campaign_onboarding_responses table
    const { data: sessionRecord, error } = await supabase
      .from('campaign_onboarding_responses')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('discord_user_id', discordUserId)
      .eq('field_key', '__modal_session__')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No session found
        console.log(`❌ No modal session found for ${discordUserId} in campaign ${campaignId}`)
        return NextResponse.json({ success: false, session: null })
      }
      throw error
    }

    // Parse and validate session data
    let sessionData
    try {
      sessionData = JSON.parse(sessionRecord.field_value)
    } catch (parseError) {
      console.error('❌ Failed to parse session data:', parseError)
      return NextResponse.json({ success: false, session: null })
    }

    // Check if session has expired
    if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
      console.log(`⏰ Modal session expired for ${discordUserId}`)
      // Delete expired session
      await supabase
        .from('campaign_onboarding_responses')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('discord_user_id', discordUserId)
        .eq('field_key', '__modal_session__')
      
      return NextResponse.json({ success: false, session: null })
    }

    console.log(`✅ Modal session found for ${sessionRecord.discord_username}`)
    
    // Remove expiration metadata from session data
    const { expires_at, stored_at, ...cleanSessionData } = sessionData
    
    return NextResponse.json({ 
      success: true, 
      session: cleanSessionData,
      expires_at: expires_at
    })

  } catch (error) {
    console.error('Error in modal session GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete modal session from database
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')
    const discordUserId = searchParams.get('discord_user_id')

    if (!campaignId || !discordUserId) {
      return NextResponse.json(
        { error: 'Missing required parameters: campaign_id, discord_user_id' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Deleting modal session for ${discordUserId} in campaign ${campaignId}`)

    const { error } = await supabase
      .from('campaign_onboarding_responses')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('discord_user_id', discordUserId)
      .eq('field_key', '__modal_session__')

    if (error) {
      throw error
    }

    console.log(`✅ Modal session deleted successfully`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in modal session DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 