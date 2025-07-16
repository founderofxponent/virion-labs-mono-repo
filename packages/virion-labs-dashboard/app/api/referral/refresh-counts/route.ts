import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { influencer_id } = body

    if (!influencer_id) {
      return NextResponse.json(
        { error: 'influencer_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('refresh_conversion_counts_for_influencer', {
      p_influencer_id: influencer_id,
    });

    if (error) {
        console.error('Error calling refresh_conversion_counts_for_influencer RPC:', error);
        return NextResponse.json(
            { error: 'Failed to refresh conversion counts via RPC' },
            { status: 500 }
        );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in refresh-counts route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 