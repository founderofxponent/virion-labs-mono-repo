import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create client for auth checks
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user from JWT token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Check user role in database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // Only admin users can export data
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const format = searchParams.get('format') || 'json';
    const dateRange = searchParams.get('dateRange') || '30';

    const daysBack = parseInt(dateRange);
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Get comprehensive analytics data
    const { data: overview, error: overviewError } = await supabase
      .rpc('get_campaign_analytics_summary', { 
        p_campaign_id: campaignId || null 
      });

    if (overviewError) {
      throw new Error(`Overview error: ${overviewError.message}`);
    }

    // Get field performance
    let fieldPerformance = null;
    if (campaignId) {
      const { data, error } = await supabase
        .rpc('get_field_performance_analytics', { 
          p_campaign_id: campaignId 
        });
      if (!error) fieldPerformance = data;
    }

    // Get user journeys
    let journeyInsights = null;
    if (campaignId) {
      const { data, error } = await supabase
        .rpc('get_user_journey_insights', { 
          p_campaign_id: campaignId 
        });
      if (!error) journeyInsights = data;
    }

    // Get detailed responses
    const { data: responses, error: responsesError } = await supabase
      .from('campaign_onboarding_responses')
      .select(`
        id,
        discord_user_id,
        discord_username,
        field_key,
        field_value,
        is_completed,
        created_at,
        updated_at,
        campaign_id
      `)
      .gte('created_at', startDate.toISOString())
      .eq('campaign_id', campaignId || '')
      .order('created_at', { ascending: false });

    if (responsesError) {
      console.error('Responses error:', responsesError);
    }

    const exportData = {
      generated_at: new Date().toISOString(),
      campaign_id: campaignId,
      date_range_days: daysBack,
      overview: overview,
      field_performance: fieldPerformance,
      journey_insights: journeyInsights,
      detailed_responses: responses || [],
      summary: {
        total_campaigns: overview?.campaigns?.length || 0,
        total_responses: responses?.length || 0,
        unique_users: new Set(responses?.map(r => r.discord_user_id) || []).size,
        completed_users: new Set(
          responses?.filter(r => r.is_completed).map(r => r.discord_user_id) || []
        ).size
      }
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'Discord User ID',
        'Discord Username', 
        'Field Key',
        'Field Value',
        'Is Completed',
        'Created At',
        'Updated At',
        'Campaign ID'
      ];

      const csvRows = responses?.map(response => [
        response.discord_user_id,
        response.discord_username || '',
        response.field_key,
        response.field_value || '',
        response.is_completed ? 'Yes' : 'No',
        response.created_at,
        response.updated_at,
        response.campaign_id
      ]) || [];

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics_export_${campaignId || 'all'}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Default JSON format
    return NextResponse.json({
      success: true,
      data: exportData
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="analytics_export_${campaignId || 'all'}_${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error('Export analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
} 