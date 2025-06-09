import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAllCampaignTemplates } from '@/lib/campaign-templates'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get all hardcoded templates
    const hardcodedTemplates = getAllCampaignTemplates()
    
    if (!hardcodedTemplates || hardcodedTemplates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hardcoded templates found'
      }, { status: 400 })
    }

    // Clear existing default templates
    const { error: deleteError } = await supabase
      .from('campaign_templates')
      .delete()
      .eq('is_default', true)

    if (deleteError) {
      console.error('Error deleting existing templates:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Failed to clear existing templates'
      }, { status: 500 })
    }

    const insertResults = []

    // Insert each hardcoded template
    for (const template of hardcodedTemplates) {
      try {
        // Convert the template to the database format
        const templateConfig = {
          category: template.category,
          bot_config: template.bot_config,
          onboarding_fields: template.onboarding_fields,
          analytics_config: template.analytics_config,
          landing_page_config: template.landing_page_config
        }

        const { data: insertedTemplate, error: insertError } = await supabase
          .from('campaign_templates')
          .insert({
            name: template.name,
            description: template.description,
            campaign_type: template.id, // Use template.id as campaign_type
            template_config: templateConfig,
            is_default: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (insertError) {
          console.error(`Error inserting template ${template.id}:`, insertError)
          insertResults.push({
            template_id: template.id,
            template_name: template.name,
            status: 'failed',
            error: insertError.message
          })
        } else {
          insertResults.push({
            template_id: template.id,
            template_name: template.name,
            database_id: insertedTemplate.id,
            status: 'success'
          })
        }
      } catch (error) {
        console.error(`Error processing template ${template.id}:`, error)
        insertResults.push({
          template_id: template.id,
          template_name: template.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = insertResults.filter(r => r.status === 'success').length
    const failedCount = insertResults.filter(r => r.status === 'failed').length

    return NextResponse.json({
      success: true,
      message: `Template sync completed: ${successCount} successful, ${failedCount} failed`,
      summary: {
        total_templates: hardcodedTemplates.length,
        successful: successCount,
        failed: failedCount
      },
      results: insertResults
    })

  } catch (error) {
    console.error('Error syncing templates from code:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to sync templates from code'
    }, { status: 500 })
  }
} 