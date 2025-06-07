import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')

    // Get campaign data
    const { data: campaigns, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('id, campaign_name, total_interactions, successful_onboardings, referral_conversions')
      .order('created_at', { ascending: false })

    if (campaignError) {
      throw campaignError
    }

    // Get detailed interaction counts from discord_referral_interactions
    const { data: interactions, error: interactionError } = await supabase
      .from('discord_referral_interactions')
      .select('guild_campaign_id, interaction_type')

    if (interactionError) {
      throw interactionError
    }

    // Get completion counts from campaign_onboarding_completions
    const { data: completions, error: completionError } = await supabase
      .from('campaign_onboarding_completions')
      .select('campaign_id')

    if (completionError) {
      console.warn('campaign_onboarding_completions table may not exist yet:', completionError)
    }

    // Get referral counts from referrals table
    const { data: referrals, error: referralError } = await supabase
      .from('referrals')
      .select('referral_link_id, status')
      .eq('status', 'active')

    if (referralError) {
      throw referralError
    }

    // Get referral link to campaign mapping
    const { data: referralLinks, error: linkError } = await supabase
      .from('referral_links')
      .select('id, campaign_id')

    if (linkError) {
      throw linkError
    }

    // Process data to create comprehensive stats
    const interactionStats = interactions.reduce((acc, interaction) => {
      if (!acc[interaction.guild_campaign_id]) {
        acc[interaction.guild_campaign_id] = {}
      }
      acc[interaction.guild_campaign_id][interaction.interaction_type] = 
        (acc[interaction.guild_campaign_id][interaction.interaction_type] || 0) + 1
      return acc
    }, {} as Record<string, Record<string, number>>)

    const completionStats = completions ? completions.reduce((acc, completion) => {
      acc[completion.campaign_id] = (acc[completion.campaign_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) : {}

    // Map referral links to campaigns
    const linkToCampaign = referralLinks.reduce((acc, link) => {
      acc[link.id] = link.campaign_id
      return acc
    }, {} as Record<string, string>)

    const referralStats = referrals.reduce((acc, referral) => {
      const campaignId = linkToCampaign[referral.referral_link_id]
      if (campaignId) {
        acc[campaignId] = (acc[campaignId] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const debugData = campaigns.map(campaign => {
      const campaignInteractions = interactionStats[campaign.id] || {}
      const actualInteractions = Object.values(campaignInteractions).reduce((sum, count) => sum + count, 0)
      const actualCompletions = completionStats[campaign.id] || 0
      const actualReferrals = referralStats[campaign.id] || 0

      return {
        campaign_id: campaign.id,
        campaign_name: campaign.campaign_name,
        database_stats: {
          total_interactions: campaign.total_interactions,
          successful_onboardings: campaign.successful_onboardings,
          referral_conversions: campaign.referral_conversions
        },
        calculated_stats: {
          actual_interactions: actualInteractions,
          actual_completions: actualCompletions,
          actual_referrals: actualReferrals
        },
        interaction_breakdown: campaignInteractions,
        discrepancies: {
          interactions_diff: campaign.total_interactions - actualInteractions,
          onboardings_diff: campaign.successful_onboardings - actualCompletions,
          conversions_diff: campaign.referral_conversions - actualReferrals
        }
      }
    })

    // Summary statistics
    const summary = {
      total_campaigns: campaigns.length,
      total_db_interactions: campaigns.reduce((sum, c) => sum + c.total_interactions, 0),
      total_calculated_interactions: Object.values(interactionStats).reduce((sum, stats) => 
        sum + Object.values(stats).reduce((s, count) => s + count, 0), 0),
      total_db_onboardings: campaigns.reduce((sum, c) => sum + c.successful_onboardings, 0),
      total_calculated_onboardings: Object.values(completionStats).reduce((sum, count) => sum + count, 0),
      total_db_conversions: campaigns.reduce((sum, c) => sum + c.referral_conversions, 0),
      total_calculated_conversions: Object.values(referralStats).reduce((sum, count) => sum + count, 0)
    }

    return NextResponse.json({
      success: true,
      summary,
      campaigns: debugData,
      raw_data: {
        interaction_types: [...new Set(interactions.map(i => i.interaction_type))],
        total_interaction_records: interactions.length,
        total_completion_records: completions?.length || 0,
        total_referral_records: referrals.length
      }
    })

  } catch (error) {
    console.error('Error debugging campaign stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 