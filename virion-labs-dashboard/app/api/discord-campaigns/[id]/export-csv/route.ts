import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Create client for auth checks
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: campaignId } = await params

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select(`
        id,
        campaign_name,
        campaign_type,
        guild_id,
        clients:client_id(name)
      `)
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get all onboarding fields for this campaign
    const { data: fields, error: fieldsError } = await supabase
      .from('campaign_onboarding_fields')
      .select('field_key, field_label, field_type, is_required')
      .eq('campaign_id', campaignId)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })

    if (fieldsError) {
      console.error('Error fetching onboarding fields:', fieldsError)
      return NextResponse.json({ error: 'Failed to fetch onboarding fields' }, { status: 500 })
    }

    // Get all onboarding responses for this campaign
    const { data: responses, error: responsesError } = await supabase
      .from('campaign_onboarding_responses')
      .select(`
        discord_user_id,
        discord_username,
        field_key,
        field_value,
        is_completed,
        created_at
      `)
      .eq('campaign_id', campaignId)
      .order('discord_user_id', { ascending: true })
      .order('created_at', { ascending: true })

    if (responsesError) {
      console.error('Error fetching onboarding responses:', responsesError)
      return NextResponse.json({ error: 'Failed to fetch onboarding responses' }, { status: 500 })
    }

    // Group responses by user
    const userResponses: { [userId: string]: any } = {}
    
    responses?.forEach(response => {
      if (!userResponses[response.discord_user_id]) {
        userResponses[response.discord_user_id] = {
          discord_user_id: response.discord_user_id,
          discord_username: response.discord_username,
          is_completed: response.is_completed,
          first_response: response.created_at,
          last_response: response.created_at,
          responses: {}
        }
      }
      
      userResponses[response.discord_user_id].responses[response.field_key] = response.field_value
      userResponses[response.discord_user_id].is_completed = response.is_completed
      
      // Update timestamps
      if (response.created_at < userResponses[response.discord_user_id].first_response) {
        userResponses[response.discord_user_id].first_response = response.created_at
      }
      if (response.created_at > userResponses[response.discord_user_id].last_response) {
        userResponses[response.discord_user_id].last_response = response.created_at
      }
    })

    // Create CSV headers
    const headers = [
      'Discord User ID',
      'Discord Username', 
      'Onboarding Status',
      'First Response Date',
      'Last Response Date',
      ...(fields?.map(field => field.field_label) || [])
    ]

    // Create CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...Object.values(userResponses).map(user => {
        const row = [
          `"${user.discord_user_id}"`,
          `"${user.discord_username}"`,
          user.is_completed ? 'Completed' : 'In Progress',
          `"${new Date(user.first_response).toLocaleString()}"`,
          `"${new Date(user.last_response).toLocaleString()}"`,
          ...(fields?.map(field => {
            const value = user.responses[field.field_key] || ''
            // Escape quotes and wrap in quotes if contains comma or quote
            const escapedValue = value.toString().replace(/"/g, '""')
            return value.includes(',') || value.includes('"') || value.includes('\n') 
              ? `"${escapedValue}"` 
              : escapedValue
          }) || [])
        ]
        return row.join(',')
      })
    ]

    // Add summary information at the top
    const summaryRows = [
      `# Campaign Export: ${campaign.campaign_name}`,
      `# Campaign Type: ${campaign.campaign_type}`,
      `# Client: ${(campaign.clients as any)?.name || 'Unknown'}`,
      `# Guild ID: ${campaign.guild_id}`,
      `# Export Date: ${new Date().toLocaleString()}`,
      `# Total Users: ${Object.keys(userResponses).length}`,
      `# Completed Onboardings: ${Object.values(userResponses).filter(user => user.is_completed).length}`,
      '',
      ...csvRows
    ]

    const csvContent = summaryRows.join('\n')

    // Return CSV with proper headers
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${campaign.campaign_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_onboarding_data.csv"`
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 