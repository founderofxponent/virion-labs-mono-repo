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

    // Get real-time activity (last 24 hours)
    let recentActivityQuery = supabase
      .from('campaign_onboarding_responses')
      .select(`
        id,
        discord_user_id,
        discord_username,
        field_key,
        field_value,
        is_completed,
        created_at,
        campaign_id
      `)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    // Only filter by campaign_id if one is provided
    if (campaignId) {
      recentActivityQuery = recentActivityQuery.eq('campaign_id', campaignId);
    }

    const { data: recentActivity, error: activityError } = await recentActivityQuery;

    if (activityError) {
      console.error('Recent activity error:', activityError);
      return NextResponse.json(
        { error: 'Failed to fetch recent activity' },
        { status: 500 }
      );
    }

    // Get active sessions (responses in last 15 minutes) - simplified approach
    let activeSessionsQuery = supabase
      .from('campaign_onboarding_responses')
      .select('discord_user_id, discord_username, updated_at')
      .gte('updated_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    // Only filter by campaign_id if one is provided
    if (campaignId) {
      activeSessionsQuery = activeSessionsQuery.eq('campaign_id', campaignId);
    }

    const { data: activeSessions, error: sessionsError } = await activeSessionsQuery;

    if (sessionsError) {
      console.error('Active sessions error:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch active sessions' },
        { status: 500 }
      );
    }

    // Process active sessions in JavaScript
    const activeSessionsProcessed = activeSessions ? 
      Object.values(
        activeSessions.reduce((acc: any, session: any) => {
          if (!acc[session.discord_user_id]) {
            acc[session.discord_user_id] = {
              discord_user_id: session.discord_user_id,
              discord_username: session.discord_username,
              responses_count: 0,
              last_activity: session.updated_at
            };
          }
          acc[session.discord_user_id].responses_count++;
          if (session.updated_at > acc[session.discord_user_id].last_activity) {
            acc[session.discord_user_id].last_activity = session.updated_at;
          }
          return acc;
        }, {})
      ) : [];

    // Get hourly activity for the last 24 hours using RPC
    const { data: hourlyActivity, error: hourlyError } = await supabase
      .rpc('get_hourly_activity', { 
        campaign_id_param: campaignId || null
      });

    if (hourlyError) {
      console.error('Hourly activity error:', hourlyError);
      // Don't fail the request, just return empty array
    }

    return NextResponse.json({
      success: true,
      data: {
        recentActivity: recentActivity || [],
        activeSessions: activeSessionsProcessed || [],
        hourlyActivity: hourlyActivity || [],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Real-time analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 