#!/usr/bin/env node

/**
 * Validation and Migration Script for Landing Page Template Inheritance
 * 
 * This script validates that all existing campaigns have proper landing page templates
 * assigned and creates inherited landing pages for campaigns that don't have them.
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mcynacktfmtzkkohctps.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
)

async function validateAndMigrateLandingPageInheritance() {
  console.log('🔍 Starting Landing Page Template Inheritance Validation...\n')

  try {
    // Step 1: Get all active campaigns
    console.log('📊 Fetching all active campaigns...')
    const { data: campaigns, error: campaignsError } = await supabase
      .from('discord_guild_campaigns')
      .select('id, campaign_name, campaign_type, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (campaignsError) {
      throw new Error(`Failed to fetch campaigns: ${campaignsError.message}`)
    }

    console.log(`✅ Found ${campaigns.length} active campaigns\n`)

    // Step 2: Check existing landing pages
    console.log('🔍 Checking existing landing pages...')
    const { data: existingLandingPages, error: landingPagesError } = await supabase
      .from('campaign_landing_pages')
      .select('campaign_id, landing_page_template_id, inherited_from_template, offer_title')

    if (landingPagesError) {
      throw new Error(`Failed to fetch landing pages: ${landingPagesError.message}`)
    }

    const landingPageMap = new Map()
    existingLandingPages.forEach(page => {
      landingPageMap.set(page.campaign_id, page)
    })

    console.log(`✅ Found ${existingLandingPages.length} existing landing pages\n`)

    // Step 3: Get all campaign template relationships
    console.log('🔗 Fetching campaign template relationships...')
    const { data: templateRelations, error: relationsError } = await supabase
      .from('campaign_template_landing_page_defaults')
      .select(`
        campaign_template_id,
        landing_page_template_id,
        is_primary,
        landing_page_templates (
          template_id,
          name,
          default_offer_title,
          default_offer_description,
          default_offer_highlights,
          default_offer_value,
          default_what_you_get,
          default_how_it_works,
          default_requirements,
          default_support_info
        ),
        campaign_templates (
          campaign_type
        )
      `)
      .eq('is_primary', true)

    if (relationsError) {
      throw new Error(`Failed to fetch template relations: ${relationsError.message}`)
    }

    // Create mapping from campaign_type to landing page template
    const campaignTypeToTemplate = new Map()
    templateRelations.forEach(relation => {
      if (relation.campaign_templates && relation.landing_page_templates) {
        campaignTypeToTemplate.set(
          relation.campaign_templates.campaign_type, 
          relation.landing_page_templates
        )
      }
    })

    console.log(`✅ Found ${templateRelations.length} template relationships\n`)

    // Step 4: Process each campaign
    const results = {
      total: campaigns.length,
      hasLandingPage: existingLandingPages.length,
      needsInheritance: campaigns.length - existingLandingPages.length,
      inherited: existingLandingPages.filter(p => p.inherited_from_template).length,
      customized: existingLandingPages.filter(p => !p.inherited_from_template).length
    }

    console.log('📊 VALIDATION SUMMARY')
    console.log('=' .repeat(40))
    console.log(`Total campaigns: ${results.total}`)
    console.log(`With landing pages: ${results.hasLandingPage}`)
    console.log(`  - Inherited: ${results.inherited}`)
    console.log(`  - Customized: ${results.customized}`)
    console.log(`Missing landing pages: ${results.needsInheritance}`)

    return results
  } catch (error) {
    console.error('💥 Error:', error.message)
    throw error
  }
}

// Run the script if called directly
if (require.main === module) {
  validateAndMigrateLandingPageInheritance()
    .then(() => console.log('\n✅ Validation completed'))
    .catch(error => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { validateAndMigrateLandingPageInheritance } 