import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const body = await request.json()
    
    const { influencer_id, message } = body

    if (!influencer_id) {
      return NextResponse.json(
        { error: 'influencer_id is required' },
        { status: 400 }
      )
    }

    // Check if campaign exists and is active
    const { data: campaign, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('id, campaign_name, is_active')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (!campaign.is_active) {
      return NextResponse.json(
        { error: 'Campaign is not active' },
        { status: 400 }
      )
    }

    // Check if access already exists or is pending
    const { data: existingAccess } = await supabase
      .from('campaign_influencer_access')
      .select('id, request_status')
      .eq('campaign_id', campaignId)
      .eq('influencer_id', influencer_id)
      .single()

    if (existingAccess) {
      if (existingAccess.request_status === 'approved') {
        return NextResponse.json(
          { error: 'Access already granted' },
          { status: 400 }
        )
      } else if (existingAccess.request_status === 'pending') {
        return NextResponse.json(
          { error: 'Access request already pending' },
          { status: 400 }
        )
      }
    }

    // Create new access request
    const { data, error } = await supabase
      .from('campaign_influencer_access')
      .insert({
        campaign_id: campaignId,
        influencer_id: influencer_id,
        request_status: 'pending',
        request_message: message,
        requested_at: new Date().toISOString(),
        is_active: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating access request:', error)
      return NextResponse.json(
        { error: 'Failed to create access request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Access request submitted successfully',
      request_id: data.id
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 