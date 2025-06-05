import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Get field performance analytics
    const { data: fieldPerformance, error: fieldError } = await supabase
      .rpc('get_field_performance_analytics', { 
        p_campaign_id: campaignId 
      });

    if (fieldError) {
      console.error('Field performance error:', fieldError);
      return NextResponse.json(
        { error: 'Failed to fetch field performance data' },
        { status: 500 }
      );
    }

    // Get field response analytics from view
    const { data: fieldAnalytics, error: analyticsError } = await supabase
      .from('field_response_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('sort_order');

    if (analyticsError) {
      console.error('Field analytics error:', analyticsError);
      return NextResponse.json(
        { error: 'Failed to fetch field analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fieldPerformance: fieldPerformance,
        fieldAnalytics: fieldAnalytics || []
      }
    });

  } catch (error) {
    console.error('Field performance analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 