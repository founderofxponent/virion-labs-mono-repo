import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List all pending access requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const campaignId = searchParams.get('campaign_id')

    let query = supabase
      .from('campaign_influencer_access')
      .select(`
        id,
        campaign_id,
        influencer_id,
        request_status,
        requested_at,
        request_message,
        access_granted_at,
        access_granted_by,
        admin_response,
        discord_guild_campaigns!inner(
          id,
          campaign_name,
          campaign_type,
          clients(name, industry)
        )
      `)
      .eq('request_status', status)
      .order('requested_at', { ascending: false })

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching access requests:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch user profiles separately for each request
    const requestsWithProfiles = await Promise.all(
      (data || []).map(async (request) => {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, avatar_url')
          .eq('id', request.influencer_id)
          .single()

        return {
          ...request,
          user_profiles: userProfile
        }
      })
    )

    return NextResponse.json({ requests: requestsWithProfiles })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Approve or deny an access request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { request_id, action, admin_id, admin_response } = body

    if (!request_id || !action || !admin_id) {
      return NextResponse.json(
        { error: 'request_id, action, and admin_id are required' },
        { status: 400 }
      )
    }

    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be either "approve" or "deny"' },
        { status: 400 }
      )
    }

    // Get the access request
    const { data: accessRequest, error: fetchError } = await supabase
      .from('campaign_influencer_access')
      .select('id, campaign_id, influencer_id, request_status')
      .eq('id', request_id)
      .single()

    if (fetchError || !accessRequest) {
      return NextResponse.json(
        { error: 'Access request not found' },
        { status: 404 }
      )
    }

    if (accessRequest.request_status !== 'pending') {
      return NextResponse.json(
        { error: 'Access request has already been processed' },
        { status: 400 }
      )
    }

    // Update the access request
    const updateData: any = {
      request_status: action === 'approve' ? 'approved' : 'denied',
      access_granted_by: admin_id,
      admin_response: admin_response,
      updated_at: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.access_granted_at = new Date().toISOString()
      updateData.is_active = true
    }

    const { data, error } = await supabase
      .from('campaign_influencer_access')
      .update(updateData)
      .eq('id', request_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating access request:', error)
      return NextResponse.json(
        { error: 'Failed to update access request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Access request ${action}d successfully`,
      access_request: data
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 