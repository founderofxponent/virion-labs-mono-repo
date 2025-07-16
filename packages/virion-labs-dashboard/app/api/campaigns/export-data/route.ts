import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
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

    // Get campaigns with onboarding response statistics
    const { data: campaigns, error: campaignsError } = await supabase
      .from('discord_guild_campaigns')
      .select(`
        id,
        campaign_name,
        is_active,
        created_at,
        clients:client_id(name, industry)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (campaignsError) {
      throw new Error(`Campaigns error: ${campaignsError.message}`);
    }

    // Get response statistics for each campaign
    const campaignStats = await Promise.all(
      (campaigns || []).map(async (campaign) => {
        // Get total responses count
        const { count: totalResponses } = await supabase
          .from('campaign_onboarding_responses')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id);

        // Get completed responses count
        const { count: completedResponses } = await supabase
          .from('campaign_onboarding_responses')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('is_completed', true);

        // Get unique fields for this campaign
        const { data: fields } = await supabase
          .from('campaign_onboarding_responses')
          .select('field_key')
          .eq('campaign_id', campaign.id);

        const uniqueFields = [...new Set(fields?.map(f => f.field_key) || [])];

        return {
          id: campaign.id,
          campaign_name: campaign.campaign_name,
          client_name: campaign.clients?.name || 'Unknown',
          client_industry: campaign.clients?.industry || 'Unknown',
          is_active: campaign.is_active,
          total_responses: totalResponses || 0,
          completed_responses: completedResponses || 0,
          unique_fields: uniqueFields,
          created_at: campaign.created_at
        };
      })
    );

    return NextResponse.json({
      success: true,
      campaigns: campaignStats
    });

  } catch (error) {
    console.error('Export campaigns error:', error);
    return NextResponse.json(
      { error: 'Failed to load campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
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
    const selectMode = searchParams.get('selectMode') || 'all';
    const campaignIds = searchParams.get('campaignIds');
    const format = searchParams.get('format') || 'csv';
    const dateRange = searchParams.get('dateRange') || '30';

    const daysBack = dateRange === 'all' ? null : parseInt(dateRange);
    const startDate = daysBack ? new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000) : null;

    // Build campaign filter
    let campaignFilter: string[] = [];
    if (selectMode !== 'all' && campaignIds) {
      campaignFilter = campaignIds.split(',').filter(id => id.trim());
    }

    // Get onboarding responses data
    let responsesQuery = supabase
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
          clients!inner(name, industry)
        )
      `)
      .order('created_at', { ascending: false });

    if (startDate) {
      responsesQuery = responsesQuery.gte('created_at', startDate.toISOString());
    }

    if (campaignFilter.length > 0) {
      responsesQuery = responsesQuery.in('campaign_id', campaignFilter);
    }

    const { data: responses, error: responsesError } = await responsesQuery;

    if (responsesError) {
      throw new Error(`Responses error: ${responsesError.message}`);
    }

    // Note: Removed completions and starts data queries - only campaign responses are needed

    // Transform responses into user profiles grouped by campaign
    const campaignUserProfiles = new Map();
    
    if (responses) {
      responses.forEach((response: any) => {
        const campaignKey = `${response.campaign_id}_${response.discord_guild_campaigns?.campaign_name}`;
        
        if (!campaignUserProfiles.has(campaignKey)) {
          campaignUserProfiles.set(campaignKey, {
            campaign_id: response.campaign_id,
            campaign_name: response.discord_guild_campaigns?.campaign_name || '',
            client_name: response.discord_guild_campaigns?.clients?.name || '',
            client_industry: response.discord_guild_campaigns?.clients?.industry || '',
            user_profiles: new Map()
          });
        }
        
        const campaignData = campaignUserProfiles.get(campaignKey);
        const userKey = `${response.discord_user_id}_${response.campaign_id}`;
        
        if (!campaignData.user_profiles.has(userKey)) {
          campaignData.user_profiles.set(userKey, {
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
        
        const profile = campaignData.user_profiles.get(userKey);
        profile.responses[response.field_key] = response.field_value;
        
        // Update completion status and timestamps to latest
        if (response.updated_at > profile.updated_at) {
          profile.is_completed = response.is_completed;
          profile.updated_at = response.updated_at;
        }
      });
    }

    // Convert user profiles maps to arrays
    for (const [campaignKey, campaignData] of campaignUserProfiles.entries()) {
      campaignData.user_profiles = Array.from(campaignData.user_profiles.values());
    }

    // Generate file content
    let fileContent: string;
    let contentType: string;
    let fileExtension: string;

    if (format === 'csv') {
      fileExtension = 'csv';
      contentType = 'text/csv';
      
      const csvSections = [];
      
      // Generate campaign-specific sections
      for (const [campaignKey, campaignData] of campaignUserProfiles.entries()) {
        const { campaign_name, client_name, user_profiles } = campaignData;
        
        if (user_profiles.length > 0) {
          // Get unique field keys for this campaign
          const campaignFieldKeys = new Set();
          user_profiles.forEach((profile: any) => {
            Object.keys(profile.responses || {}).forEach(key => campaignFieldKeys.add(key));
          });
          const sortedCampaignFieldKeys = Array.from(campaignFieldKeys).sort() as string[];
          
          // Create headers for this campaign
          const campaignHeaders = [
            'Discord User ID',
            'Discord Username',
            'Is Completed',
            'Started At',
            'Last Updated',
            ...sortedCampaignFieldKeys
          ];

          const campaignRows = user_profiles.map((profile: any) => [
            profile.discord_user_id,
            profile.discord_username || '',
            profile.is_completed ? 'Yes' : 'No',
            profile.created_at,
            profile.updated_at,
            ...sortedCampaignFieldKeys.map(key => profile.responses[key] || '')
          ]);

          // Create campaign section
          const campaignSection = [
            `CAMPAIGN - ${campaign_name} - ${client_name}`,
            `Campaign ID,${campaignData.campaign_id}`,
            `Total Responses,${user_profiles.length}`,
            `Completed,${user_profiles.filter((p: any) => p.is_completed).length}`,
            `Fields,"${sortedCampaignFieldKeys.join(', ') || 'None'}"`,
            '', // Empty line before headers
            campaignHeaders.join(','),
            ...campaignRows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
          ].join('\n');

          csvSections.push(campaignSection);
        }
      }

      // Note: Removed completions and starts sections - only campaign responses are exported

      fileContent = csvSections.length > 0 ? csvSections.join('\n\n') : 'No campaign data found for the selected criteria.';
    } else {
      // JSON format
      fileExtension = 'json';
      contentType = 'application/json';
      
      const exportData = {
        generated_at: new Date().toISOString(),
        export_type: 'campaign_onboarding_data',
        select_mode: selectMode,
        campaign_filter: campaignFilter,
        date_range_days: daysBack,
        user_role: profile.role,
        campaigns: Array.from(campaignUserProfiles.values()),
        summary: {
          total_campaigns: campaignUserProfiles.size,
          total_user_profiles: Array.from(campaignUserProfiles.values()).reduce((sum, c) => sum + c.user_profiles.length, 0)
        }
      };
      
      fileContent = JSON.stringify(exportData, null, 2);
    }

    // Generate unique filename
    const timestamp = new Date().toISOString().split('T')[0];
    const randomId = Math.random().toString(36).substring(7);
    const scopeText = selectMode === 'all' ? 'all' : `${campaignFilter.length}campaigns`;
    const filename = `campaign_export_${scopeText}_${timestamp}_${randomId}.${fileExtension}`;

    // Create temp directory if it doesn't exist
    const tempDir = join(process.cwd(), 'temp', 'exports');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Write file to temp directory
    const filePath = join(tempDir, filename);
    writeFileSync(filePath, fileContent, 'utf8');

    // Return download URL
    const downloadUrl = `/api/campaigns/export-data/download?file=${filename}`;

    return NextResponse.json({
      success: true,
      download_url: downloadUrl,
      filename: filename,
      content_type: contentType,
      size: fileContent.length,
      campaigns_exported: campaignUserProfiles.size,
      total_responses: Array.from(campaignUserProfiles.values()).reduce((sum, c) => sum + c.user_profiles.length, 0)
    });

  } catch (error) {
    console.error('Export campaign data error:', error);
    return NextResponse.json(
      { error: 'Failed to export campaign data' },
      { status: 500 }
    );
  }
} 