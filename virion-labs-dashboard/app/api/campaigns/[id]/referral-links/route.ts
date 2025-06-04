import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateReferralCode, generateReferralUrl } from '@/lib/url-utils'

// Use service role client for server-side operations to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const body = await request.json()
    
    const {
      title,
      description,
      platform,
      original_url,
      thumbnail_url,
      expires_at,
      influencer_id // For demo purposes, we'll accept this in the body
    } = body

    // Validate required fields
    if (!title || !platform || !original_url || !influencer_id) {
      return NextResponse.json(
        { error: 'Missing required fields: title, platform, original_url, influencer_id' },
        { status: 400 }
      )
    }

    // Verify the campaign exists and is active
    const { data: campaign, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('id, campaign_name, is_active, clients(name)')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (!campaign.is_active) {
      return NextResponse.json(
        { error: 'Campaign is not active' },
        { status: 400 }
      )
    }

    // Generate referral code and URL using utility functions
    const referralCode = generateReferralCode(title)
    const referralUrl = generateReferralUrl(referralCode)

    // Create the referral link with campaign association
    const { data: referralLink, error: linkError } = await supabase
      .from('referral_links')
      .insert({
        influencer_id,
        campaign_id: campaignId, // Associate with the campaign
        title,
        description,
        platform,
        original_url,
        referral_code: referralCode,
        referral_url: referralUrl,
        thumbnail_url,
        expires_at,
        clicks: 0,
        conversions: 0,
        earnings: 0,
        is_active: true
      })
      .select()
      .single()

    if (linkError) {
      console.error('Error creating referral link:', linkError)
      return NextResponse.json(
        { error: 'Failed to create referral link' },
        { status: 500 }
      )
    }

    // Return the created link with campaign context
    const client = Array.isArray(campaign.clients) ? campaign.clients[0] : campaign.clients
    
    return NextResponse.json({
      success: true,
      referral_link: {
        ...referralLink,
        campaign_context: {
          campaign_id: campaignId,
          campaign_name: campaign.campaign_name,
          client_name: client?.name || 'Unknown Client'
        }
      }
    })

  } catch (error) {
    console.error('Create campaign referral link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 