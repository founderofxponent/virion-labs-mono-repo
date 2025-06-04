import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const influencerId = searchParams.get('influencer_id')
    
    if (!influencerId) {
      return NextResponse.json(
        { error: 'influencer_id parameter required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc(
      'get_available_campaigns_for_influencer',
      { p_influencer_id: influencerId }
    )

    if (error) {
      console.error('Error fetching available campaigns:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ campaigns: data || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 