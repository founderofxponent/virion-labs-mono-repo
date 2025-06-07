#!/usr/bin/env node

/**
 * Validation script for Discord campaign tracking pipeline
 * This script tests the entire flow from Discord bot interaction to database statistics
 */

// Use environment variables directly since we're in Next.js environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

// Simple Supabase client implementation
async function supabaseQuery(table, options = {}) {
  const { select = '*', eq, order, limit } = options
  
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`
  
  if (eq) {
    Object.entries(eq).forEach(([key, value]) => {
      url += `&${key}=eq.${value}`
    })
  }
  
  if (order) {
    url += `&order=${order.column}.${order.ascending ? 'asc' : 'desc'}`
  }
  
  if (limit) {
    url += `&limit=${limit}`
  }

  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Supabase query failed: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

async function supabaseRpc(functionName, params = {}) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Supabase RPC failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return await response.json()
}

async function validateTrackingPipeline() {
  console.log('🔍 Validating Discord Campaign Tracking Pipeline\n')

  try {
    // Step 1: Check current campaign state
    console.log('📊 Step 1: Current Campaign Statistics')
    const campaigns = await supabaseQuery('discord_guild_campaigns', {
      select: 'id,campaign_name,total_interactions,successful_onboardings,referral_conversions,is_active',
      order: { column: 'created_at', ascending: false }
    })

    const activeCampaigns = campaigns.filter(c => c.is_active)
    console.log(`Total campaigns: ${campaigns.length}`)
    console.log(`Active campaigns: ${activeCampaigns.length}`)
    
    campaigns.forEach(campaign => {
      console.log(`  ${campaign.campaign_name}: ${campaign.total_interactions} interactions, ${campaign.successful_onboardings} onboardings, ${campaign.referral_conversions} conversions (${campaign.is_active ? 'ACTIVE' : 'inactive'})`)
    })

    // Step 2: Check interaction tracking
    console.log('\n📨 Step 2: Interaction Tracking Analysis')
    const interactions = await supabaseQuery('discord_referral_interactions', {
      select: 'interaction_type,guild_campaign_id,created_at',
      order: { column: 'created_at', ascending: false },
      limit: 10
    })

    const interactionTypes = interactions.reduce((acc, interaction) => {
      acc[interaction.interaction_type] = (acc[interaction.interaction_type] || 0) + 1
      return acc
    }, {})

    console.log('Interaction types found:', interactionTypes)
    console.log('Recent interactions:')
    interactions.forEach(interaction => {
      console.log(`  ${interaction.interaction_type} - Campaign: ${interaction.guild_campaign_id} - ${interaction.created_at}`)
    })

    // Step 3: Test tracking functions
    console.log('\n🧪 Step 3: Testing Tracking Functions')
    
    if (activeCampaigns.length > 0) {
      const testCampaign = activeCampaigns[0]
      console.log(`Testing with campaign: ${testCampaign.campaign_name}`)

      // Test the increment function
      console.log('Testing onboarding increment function...')
      try {
        await supabaseRpc('increment_successful_onboardings', {
          p_campaign_id: testCampaign.id
        })
        console.log('✅ increment_successful_onboardings function works')
      } catch (err) {
        console.log('❌ Exception in increment_successful_onboardings:', err.message)
      }
    }

    // Step 4: Check data consistency
    console.log('\n🔍 Step 4: Data Consistency Check')
    for (const campaign of campaigns.slice(0, 3)) { // Check first 3 campaigns
      try {
        const campaignInteractions = await supabaseQuery('discord_referral_interactions', {
          select: 'interaction_type',
          eq: { guild_campaign_id: campaign.id }
        })

        const actualInteractionCount = campaignInteractions.length
        const onboardingCompletedCount = campaignInteractions.filter(i => i.interaction_type === 'onboarding_completed').length

        console.log(`${campaign.campaign_name}:`)
        console.log(`  Database total_interactions: ${campaign.total_interactions}`)
        console.log(`  Actual interaction records: ${actualInteractionCount}`)
        console.log(`  Difference: ${campaign.total_interactions - actualInteractionCount}`)
        console.log(`  Onboarding completed interactions: ${onboardingCompletedCount}`)
        console.log(`  Database successful_onboardings: ${campaign.successful_onboardings}`)
      } catch (error) {
        console.log(`❌ Error fetching interactions for ${campaign.campaign_name}:`, error.message)
      }
    }

    // Step 5: Recommendations
    console.log('\n💡 Step 5: Recommendations')
    
    const hasOnboardingCompletedInteractions = interactions.some(i => i.interaction_type === 'onboarding_completed')
    if (!hasOnboardingCompletedInteractions) {
      console.log('⚠️  NO "onboarding_completed" interaction types found!')
      console.log('   Discord bot may not be properly tracking onboarding completions')
      console.log('   Check Discord bot onboarding-manager.js trackCompletion method')
    }

    const campaignsWithInconsistentData = campaigns.filter(c => c.successful_onboardings > 0 && c.total_interactions === 0)
    if (campaignsWithInconsistentData.length > 0) {
      console.log('⚠️  Found campaigns with onboardings but no interactions:')
      campaignsWithInconsistentData.forEach(c => {
        console.log(`   ${c.campaign_name}: ${c.successful_onboardings} onboardings, ${c.total_interactions} interactions`)
      })
    }

    console.log('\n✅ Validation complete!')

  } catch (error) {
    console.error('❌ Validation failed:', error)
  }
}

// Main execution
if (require.main === module) {
  validateTrackingPipeline()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}

module.exports = { validateTrackingPipeline } 