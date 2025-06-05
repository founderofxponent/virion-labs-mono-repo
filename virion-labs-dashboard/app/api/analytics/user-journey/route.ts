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

    // Get user journey insights
    const { data: journeyInsights, error: journeyError } = await supabase
      .rpc('get_user_journey_insights', { 
        p_campaign_id: campaignId 
      });

    if (journeyError) {
      console.error('Journey insights error:', journeyError);
      return NextResponse.json(
        { error: 'Failed to fetch journey insights' },
        { status: 500 }
      );
    }

    // Get individual user journeys for detailed analysis
    const { data: userJourneys, error: userError } = await supabase
      .from('user_journey_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('journey_start', { ascending: false })
      .limit(100); // Limit to most recent 100 journeys

    if (userError) {
      console.error('User journeys error:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user journeys' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        insights: journeyInsights,
        recentJourneys: userJourneys || []
      }
    });

  } catch (error) {
    console.error('User journey analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 