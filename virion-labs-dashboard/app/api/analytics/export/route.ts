import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Initialize clients inside the function to avoid build-time errors
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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

    // Only admin and client users can export data
    if (!['admin', 'client'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied. Admin or client privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const format = searchParams.get('format') || 'json';
    const dateRange = searchParams.get('dateRange') || '30';
    const exportType = searchParams.get('exportType') || 'analytics'; // analytics, onboarding, referrals, comprehensive

    const daysBack = parseInt(dateRange);
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    let exportData: any = {
      generated_at: new Date().toISOString(),
      export_type: exportType,
      campaign_id: campaignId,
      date_range_days: daysBack,
      user_role: profile.role
    };

    // Export analytics data (for all export types)
    if (exportType === 'analytics' || exportType === 'comprehensive') {
      const { data: overview, error: overviewError } = await supabase
        .rpc('get_campaign_analytics_summary', { 
          p_campaign_id: campaignId || null 
        });

      if (overviewError) {
        throw new Error(`Overview error: ${overviewError.message}`);
      }

      exportData.analytics = {
        overview: overview,
        campaigns: overview?.campaigns || []
      };
    }

    // Export onboarding responses data
    if (exportType === 'onboarding' || exportType === 'comprehensive') {
      let onboardingQuery = supabase
        .from('campaign_onboarding_responses')
        .select(`
          id,
          campaign_id,
          discord_user_id,
          discord_username,
          field_key,
          field_value,
          is_completed,
          created_at,
          updated_at,
          discord_guild_campaigns!inner(
            campaign_name,
            client_id,
            clients!inner(name)
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (campaignId) {
        onboardingQuery = onboardingQuery.eq('campaign_id', campaignId);
      }

      const { data: responses, error: responsesError } = await onboardingQuery;

      if (responsesError) {
        console.error('Responses error:', responsesError);
      }

      // Transform fragmented responses into complete user profiles
      const userProfiles = new Map();
      
      if (responses) {
        responses.forEach((response: any) => {
          const key = `${response.discord_user_id}_${response.campaign_id}`;
          
          if (!userProfiles.has(key)) {
            userProfiles.set(key, {
              discord_user_id: response.discord_user_id,
              discord_username: response.discord_username,
              campaign_id: response.campaign_id,
              campaign_name: response.discord_guild_campaigns?.campaign_name || '',
              client_name: response.discord_guild_campaigns?.clients?.name || '',
              is_completed: response.is_completed,
              created_at: response.created_at,
              updated_at: response.updated_at,
              responses: {}
            });
          }
          
          const profile = userProfiles.get(key);
          profile.responses[response.field_key] = response.field_value;
          
          // Update completion status and timestamps to latest
          if (response.updated_at > profile.updated_at) {
            profile.is_completed = response.is_completed;
            profile.updated_at = response.updated_at;
          }
        });
      }

      const aggregatedResponses = Array.from(userProfiles.values());

      // Get completion data
      let completionsQuery = supabase
        .from('campaign_onboarding_completions')
        .select(`
          id,
          campaign_id,
          discord_user_id,
          discord_username,
          guild_id,
          completed_at,
          discord_guild_campaigns!inner(
            campaign_name,
            client_id,
            clients!inner(name)
          )
        `)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false });

      if (campaignId) {
        completionsQuery = completionsQuery.eq('campaign_id', campaignId);
      }

      const { data: completions, error: completionsError } = await completionsQuery;

      if (completionsError) {
        console.error('Completions error:', completionsError);
      }

      // Get onboarding starts data
      let startsQuery = supabase
        .from('campaign_onboarding_starts')
        .select(`
          id,
          campaign_id,
          discord_user_id,
          discord_username,
          guild_id,
          started_at,
          discord_guild_campaigns!inner(
            campaign_name,
            client_id,
            clients!inner(name)
          )
        `)
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: false });

      if (campaignId) {
        startsQuery = startsQuery.eq('campaign_id', campaignId);
      }

      const { data: starts, error: startsError } = await startsQuery;

      if (startsError) {
        console.error('Starts error:', startsError);
      }

      exportData.onboarding = {
        user_profiles: aggregatedResponses || [],
        raw_responses: responses || [], // Keep original for debugging if needed
        completions: completions || [],
        starts: starts || [],
        summary: {
          total_user_profiles: aggregatedResponses?.length || 0,
          total_raw_responses: responses?.length || 0,
          unique_users_responded: new Set(responses?.map(r => r.discord_user_id) || []).size,
          completed_users: completions?.length || 0,
          started_users: starts?.length || 0
        }
      };
    }

    // Export referral data
    if (exportType === 'referrals' || exportType === 'comprehensive') {
      // Get referral links data
      let referralLinksQuery = supabase
        .from('referral_links')
        .select(`
          id,
          code,
          campaign_id,
          influencer_id,
          clicks,
          conversions,
          earnings,
          is_active,
          created_at,
          updated_at,
          user_profiles!inner(full_name, email),
          discord_guild_campaigns(
            campaign_name,
            client_id,
            clients(name)
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      const { data: referralLinks, error: referralLinksError } = await referralLinksQuery;

      if (referralLinksError) {
        console.error('Referral links error:', referralLinksError);
      }

      // Get referrals data
      let referralsQuery = supabase
        .from('referrals')
        .select(`
          id,
          referral_link_id,
          name,
          email,
          discord_id,
          age,
          status,
          source_platform,
          metadata,
          created_at,
          updated_at,
          referral_links(
            code,
            campaign_id,
            discord_guild_campaigns(
              campaign_name,
              clients(name)
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      const { data: referrals, error: referralsError } = await referralsQuery;

      if (referralsError) {
        console.error('Referrals error:', referralsError);
      }

      // Get referral analytics data
      let analyticsQuery = supabase
        .from('referral_analytics')
        .select(`
          id,
          referral_link_id,
          event_type,
          user_agent,
          ip_address,
          device_type,
          browser,
          referrer,
          conversion_value,
          metadata,
          created_at,
          referral_links(
            code,
            campaign_id,
            discord_guild_campaigns(
              campaign_name,
              clients(name)
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      const { data: referralAnalytics, error: analyticsError } = await analyticsQuery;

      if (analyticsError) {
        console.error('Referral analytics error:', analyticsError);
      }

      exportData.referrals = {
        referral_links: referralLinks || [],
        referrals: referrals || [],
        analytics: referralAnalytics || [],
        summary: {
          total_links: referralLinks?.length || 0,
          active_links: referralLinks?.filter(link => link.is_active).length || 0,
          total_referrals: referrals?.length || 0,
          total_clicks: referralAnalytics?.filter(a => a.event_type === 'click').length || 0,
          total_conversions: referralAnalytics?.filter(a => a.event_type === 'conversion').length || 0,
          total_earnings: referralLinks?.reduce((sum, link) => sum + parseFloat(link.earnings || '0'), 0) || 0
        }
      };
    }

    // Export access requests data (admin only)
    if ((exportType === 'comprehensive') && profile.role === 'admin') {
      const { data: accessRequests, error: accessRequestsError } = await supabase
        .from('access_requests')
        .select(`
          id,
          discord_user_id,
          discord_username,
          discord_guild_id,
          full_name,
          email,
          verified_role_id,
          role_assigned_at,
          created_at,
          updated_at
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (accessRequestsError) {
        console.error('Access requests error:', accessRequestsError);
      }

      exportData.access_requests = {
        requests: accessRequests || [],
        summary: {
          total_requests: accessRequests?.length || 0,
          unique_users: new Set(accessRequests?.map(r => r.discord_user_id) || []).size,
          unique_guilds: new Set(accessRequests?.map(r => r.discord_guild_id) || []).size
        }
      };
    }

    // Generate file content
    let fileContent: string;
    let contentType: string;
    let fileExtension: string;

    if (format === 'csv') {
      fileExtension = 'csv';
      contentType = 'text/csv';
      let csvContent = '';
      
      if (exportType === 'onboarding' || exportType === 'comprehensive') {
        // CSV for user onboarding profiles (aggregated responses)
        const userProfiles = exportData.onboarding?.user_profiles || [];
        
        if (userProfiles.length > 0) {
          // Get all unique field keys across all users to create dynamic columns
          const allFieldKeys = new Set();
          userProfiles.forEach((profile: any) => {
            Object.keys(profile.responses || {}).forEach(key => allFieldKeys.add(key));
          });
          const sortedFieldKeys = Array.from(allFieldKeys).sort();
          
          // Create headers: fixed columns + dynamic response fields
          const csvHeaders = [
            'Discord User ID',
            'Discord Username',
            'Campaign Name',
            'Client Name',
            'Is Completed',
            'Started At',
            'Last Updated',
            ...sortedFieldKeys
          ];

          const csvRows = userProfiles.map((profile: any) => [
            profile.discord_user_id,
            profile.discord_username || '',
            profile.campaign_name,
            profile.client_name,
            profile.is_completed ? 'Yes' : 'No',
            profile.created_at,
            profile.updated_at,
            ...sortedFieldKeys.map(key => profile.responses[key] || '')
          ]);

          csvContent = [
            '=== USER ONBOARDING PROFILES ===',
            csvHeaders.join(','),
            ...csvRows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
          ].join('\n');
        } else {
          csvContent = '=== USER ONBOARDING PROFILES ===\nNo onboarding data found for the selected date range.';
        }

        if (exportData.onboarding?.completions?.length > 0) {
          csvContent += '\n\n=== ONBOARDING COMPLETIONS ===\n';
          csvContent += [
            'Completion ID,Campaign Name,Client Name,Discord User ID,Discord Username,Guild ID,Completed At',
            ...exportData.onboarding.completions.map((completion: any) => [
              completion.id,
              completion.discord_guild_campaigns?.campaign_name || '',
              completion.discord_guild_campaigns?.clients?.name || '',
              completion.discord_user_id,
              completion.discord_username,
              completion.guild_id || '',
              completion.completed_at
            ].map(cell => `"${cell}"`).join(','))
          ].join('\n');
        }
      }

      if (exportType === 'referrals' || exportType === 'comprehensive') {
        if (csvContent) csvContent += '\n\n';
        
        csvContent += '=== REFERRAL LINKS ===\n';
        csvContent += [
          'Link ID,Code,Campaign Name,Client Name,Influencer Name,Influencer Email,Clicks,Conversions,Earnings,Is Active,Created At',
          ...((exportData.referrals?.referral_links || []).map((link: any) => [
            link.id,
            link.code,
            link.discord_guild_campaigns?.campaign_name || '',
            link.discord_guild_campaigns?.clients?.name || '',
            link.user_profiles?.full_name || '',
            link.user_profiles?.email || '',
            link.clicks || 0,
            link.conversions || 0,
            link.earnings || '0.00',
            link.is_active ? 'Yes' : 'No',
            link.created_at
          ].map(cell => `"${cell}"`).join(',')))
        ].join('\n');

        if (exportData.referrals?.referrals?.length > 0) {
          csvContent += '\n\n=== REFERRALS ===\n';
          csvContent += [
            'Referral ID,Referral Code,Campaign Name,Client Name,Name,Email,Discord ID,Age,Status,Source Platform,Created At',
            ...exportData.referrals.referrals.map((referral: any) => [
              referral.id,
              referral.referral_links?.code || '',
              referral.referral_links?.discord_guild_campaigns?.campaign_name || '',
              referral.referral_links?.discord_guild_campaigns?.clients?.name || '',
              referral.name || '',
              referral.email || '',
              referral.discord_id || '',
              referral.age || '',
              referral.status || '',
              referral.source_platform || '',
              referral.created_at
            ].map(cell => `"${cell}"`).join(','))
          ].join('\n');
        }
      }

      fileContent = csvContent;
    } else {
      // JSON format
      fileExtension = 'json';
      contentType = 'application/json';
      fileContent = JSON.stringify(exportData, null, 2);
    }

    // Generate unique filename
    const timestamp = new Date().toISOString().split('T')[0];
    const randomId = Math.random().toString(36).substring(7);
    const filename = `${exportType}_export_${campaignId || 'all'}_${timestamp}_${randomId}.${fileExtension}`;

    // Create temp directory if it doesn't exist
    const tempDir = join(process.cwd(), 'temp', 'exports');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Write file to temp directory
    const filePath = join(tempDir, filename);
    writeFileSync(filePath, fileContent, 'utf8');

    // Return download URL
    const downloadUrl = `/api/analytics/export/download?file=${filename}`;

    return NextResponse.json({
      success: true,
      download_url: downloadUrl,
      filename: filename,
      content_type: contentType,
      size: fileContent.length
    });

  } catch (error) {
    console.error('Export analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
} 