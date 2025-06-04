import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Utility function to generate referral code
function generateReferralCode(title: string): string {
  const cleaned = title.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const random = Math.random().toString(36).substring(2, 8)
  return `${cleaned.substring(0, 10)}-${random}`
}

// Utility function to generate referral URL
function generateReferralUrl(code: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/r/${code}`
}

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
      influencer_id,
      redirect_to_discord = true,
      landing_page_enabled = true
    } = body

    // Validate required fields
    if (!title || !platform || !influencer_id) {
      return NextResponse.json(
        { error: 'Missing required fields: title, platform, influencer_id' },
        { status: 400 }
      )
    }

    // Validate campaign exists and influencer has access
    const { data: campaign, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select(`
        id, 
        campaign_name, 
        guild_id, 
        is_active,
        campaign_influencer_access!inner(influencer_id)
      `)
      .eq('id', campaignId)
      .eq('campaign_influencer_access.influencer_id', influencer_id)
      .eq('campaign_influencer_access.is_active', true)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' },
        { status: 404 }
      )
    }

    if (!campaign.is_active) {
      return NextResponse.json(
        { error: 'Campaign is not active' },
        { status: 400 }
      )
    }

    // Generate referral code and URL
    const referralCode = generateReferralCode(title)
    const referralUrl = generateReferralUrl(referralCode)
    
    // Create referral link
    const { data: referralLink, error: linkError } = await supabase
      .from('referral_links')
      .insert({
        influencer_id,
        campaign_id: campaignId,
        title,
        description,
        platform,
        original_url: `${process.env.NEXT_PUBLIC_APP_URL}/r/${referralCode}`, // Landing page URL
        referral_code: referralCode,
        referral_url: referralUrl,
        discord_guild_id: campaign.guild_id,
        redirect_to_discord,
        landing_page_enabled,
        is_active: true
      })
      .select()
      .single()

    if (linkError) {
      console.error('Error creating referral link:', linkError)
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }

    // Create Discord invite if needed
    let discordInvite = null
    if (redirect_to_discord) {
      const { data: inviteData, error: inviteError } = await supabase.rpc(
        'create_campaign_discord_invite',
        { 
          p_campaign_id: campaignId,
          p_referral_link_id: referralLink.id 
        }
      )

      if (inviteError) {
        console.error('Error creating Discord invite:', inviteError)
        // Don't fail the whole request, just log the error
      } else if (inviteData && inviteData.length > 0) {
        discordInvite = inviteData[0]
        
        // Update referral link with Discord invite URL
        await supabase
          .from('referral_links')
          .update({ discord_invite_url: inviteData[0].invite_url })
          .eq('id', referralLink.id)
          
        // Update the local object
        referralLink.discord_invite_url = inviteData[0].invite_url
      }
    }

    return NextResponse.json({ 
      referral_link: referralLink,
      discord_invite: discordInvite,
      campaign: {
        id: campaign.id,
        name: campaign.campaign_name,
        guild_id: campaign.guild_id
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 