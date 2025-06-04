import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get available campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('discord_guild_campaigns')
      .select(`
        id,
        campaign_name,
        campaign_type,
        campaign_start_date,
        campaign_end_date,
        is_active,
        metadata,
        created_at,
        clients!inner(
          id,
          name,
          industry,
          logo
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Transform the data for the frontend
    const availableCampaigns = (campaigns || []).map(campaign => {
      const client = Array.isArray(campaign.clients) ? campaign.clients[0] : campaign.clients
      
      return {
        id: campaign.id,
        campaign_name: campaign.campaign_name,
        campaign_type: campaign.campaign_type,
        client_name: client?.name || 'Unknown Client',
        client_industry: client?.industry || 'Unknown Industry',
        client_logo: client?.logo || null,
        description: campaign.metadata?.description || `${campaign.campaign_type.replace('_', ' ')} campaign for ${client?.name || 'client'}`,
        discord_server: campaign.metadata?.discord_server_name || 'Discord Community',
        target_audience: campaign.metadata?.target_audience || 'General audience',
        campaign_end_date: campaign.campaign_end_date,
        requirements: campaign.metadata?.requirements || ['Content creation', 'Discord promotion'],
        estimated_earnings: campaign.metadata?.estimated_earnings || '$50-200/month',
        commission_rate: campaign.metadata?.commission_rate || '5%',
        created_at: campaign.created_at
      }
    })

    return NextResponse.json({
      campaigns: availableCampaigns,
      total: availableCampaigns.length
    })

  } catch (error) {
    console.error('Available campaigns error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 