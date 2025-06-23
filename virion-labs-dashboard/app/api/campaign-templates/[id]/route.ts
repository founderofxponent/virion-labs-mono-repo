import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = (await params).id

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Check if the ID is a UUID or campaign_type string
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(templateId)
    
    // Build query based on ID type
    let query = supabase
      .from('campaign_templates')
      .select(`
        *,
        default_landing_page:landing_page_templates(*)
      `)

    if (isUUID) {
      query = query.eq('id', templateId)
    } else {
      query = query.eq('campaign_type', templateId)
    }

    const { data, error } = await query.single()

    if (error) {
      console.error('Error fetching campaign template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign template not found' }, { status: 404 })
    }

    // Transform the campaign template to match the expected frontend interface
    const transformedTemplate: any = {
      id: data.campaign_type, // Use campaign_type as ID for backward compatibility
      name: data.name,
      description: data.description,
      category: data.category || 'general',
      campaign_type: data.campaign_type,
      is_default: data.is_default,
      // Extract bot configuration from template_config
      bot_config: {
        prefix: data.template_config?.bot_config?.prefix || '/',
        description: data.template_config?.bot_config?.description || data.description,
        bot_name: data.template_config?.bot_config?.bot_name || 'VirionBot',
        bot_personality: data.template_config?.bot_config?.bot_personality || 'helpful',
        bot_response_style: data.template_config?.bot_config?.bot_response_style || 'friendly',
        brand_color: data.template_config?.bot_config?.brand_color || '#3b82f6',
        welcome_message: data.template_config?.bot_config?.welcome_message || 'Welcome to our community!',
        campaign_type: data.campaign_type,
        features: {
          referral_tracking: data.template_config?.bot_config?.features?.referral_tracking ?? true,
          auto_role: data.template_config?.bot_config?.features?.auto_role ?? false,
          moderation: data.template_config?.bot_config?.features?.moderation ?? true,
        }
      },
      onboarding_fields: data.template_config?.onboarding_fields || []
    }

    // Transform and embed the landing page template if it exists
    if (data.default_landing_page) {
      const lp = data.default_landing_page
      transformedTemplate.default_landing_page = {
        id: lp.template_id,
        name: lp.name,
        description: lp.description,
        preview_image: lp.preview_image_url || '/templates/default-preview.png',
        campaign_types: lp.campaign_types,
        category: lp.category,
        fields: {
          offer_title: lp.default_offer_title || '',
          offer_description: lp.default_offer_description || '',
          offer_highlights: lp.default_offer_highlights || [],
          offer_value: lp.default_offer_value || '',
          what_you_get: lp.default_what_you_get || '',
          how_it_works: lp.default_how_it_works || '',
          requirements: lp.default_requirements || '',
          support_info: lp.default_support_info || ''
        },
        customizable_fields: lp.customizable_fields,
        color_scheme: lp.color_scheme,
        layout_config: lp.layout_config,
        is_default: lp.is_default
      }
    }

    return NextResponse.json({
      template: transformedTemplate
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 