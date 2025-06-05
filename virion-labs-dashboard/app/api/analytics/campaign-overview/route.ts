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

    // Get campaign analytics summary
    const { data: analyticsData, error: analyticsError } = await supabase
      .rpc('get_campaign_analytics_summary', { 
        p_campaign_id: campaignId || null 
      });

    if (analyticsError) {
      console.error('Analytics error:', analyticsError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Get daily metrics for the last 30 days
    const { data: dailyMetrics, error: dailyError } = await supabase
      .from('daily_onboarding_metrics')
      .select('*')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .eq('campaign_id', campaignId || '')
      .order('date', { ascending: false });

    if (dailyError) {
      console.error('Daily metrics error:', dailyError);
      return NextResponse.json(
        { error: 'Failed to fetch daily metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: analyticsData,
        dailyMetrics: dailyMetrics || []
      }
    });

  } catch (error) {
    console.error('Campaign analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 