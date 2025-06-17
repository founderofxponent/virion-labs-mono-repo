import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const templateId = searchParams.get('id')

    // Always include landing page data for optimal performance
    let query = supabase
      .from('campaign_templates')
      .select('*, default_landing_page:landing_page_templates(*)')
      .eq('is_default', true)

    if (category) {
      query = query.eq('category', category)
    }

    if (templateId) {
      query = query.eq('campaign_type', templateId)
    }

    const { data, error } = await query.order('name')

    if (error) {
      console.error('Error fetching campaign templates:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform database templates to match frontend interface
    const templates = data.map((template: any) => {
      const transformedTemplate: any = {
        id: template.campaign_type, // Use campaign_type as ID for backward compatibility
        name: template.name,
        description: template.description,
        category: template.category,
        campaign_type: template.campaign_type,
        is_default: template.is_default,
        bot_config: template.template_config.bot_config,
        onboarding_fields: template.template_config.onboarding_fields || [],
        analytics_config: template.template_config.analytics_config,
        landing_page_config: template.template_config.landing_page_config
      }

      // Always include landing page data
      if (template.default_landing_page) {
        const lp = template.default_landing_page
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

      return transformedTemplate
    })

    if (templateId) {
      const template = templates[0]
      return NextResponse.json({ template: template || null })
    }

    return NextResponse.json({ 
      templates,
      meta: {
        total: templates.length
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      campaign_type,
      category,
      bot_config,
      onboarding_fields,
      analytics_config,
      landing_page_config,
      is_default = true
    } = body

    // Validate required fields
    if (!name || !campaign_type || !category || !bot_config) {
      return NextResponse.json(
        { error: 'Missing required fields: name, campaign_type, category, bot_config' },
        { status: 400 }
      )
    }

    // Check if template with same campaign_type already exists
    const { data: existingTemplate } = await supabase
      .from('campaign_templates')
      .select('id')
      .eq('campaign_type', campaign_type)
      .single()

    if (existingTemplate) {
      return NextResponse.json(
        { error: `Template with campaign_type '${campaign_type}' already exists` },
        { status: 400 }
      )
    }

    const template_config = {
      bot_config,
      onboarding_fields: onboarding_fields || [],
      analytics_config: analytics_config || { primary_metrics: [], conversion_events: [], tracking_enabled: false },
      landing_page_config
    }

    const { data, error } = await supabase
      .from('campaign_templates')
      .insert({
        name,
        description,
        campaign_type,
        category,
        template_config,
        is_default
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform response
    const responseTemplate = {
      id: data.campaign_type,
      name: data.name,
      description: data.description,
      category: data.category,
      bot_config: data.template_config.bot_config,
      onboarding_fields: data.template_config.onboarding_fields || [],
      analytics_config: data.template_config.analytics_config,
      landing_page_config: data.template_config.landing_page_config
    }

    return NextResponse.json({ template: responseTemplate }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      bot_config,
      onboarding_fields,
      analytics_config,
      landing_page_config
    } = body

    const template_config = {
      bot_config,
      onboarding_fields: onboarding_fields || [],
      analytics_config: analytics_config || { primary_metrics: [], conversion_events: [], tracking_enabled: false },
      landing_page_config
    }

    const updateData: any = {
      template_config,
      updated_at: new Date().toISOString()
    }

    if (name) updateData.name = name
    if (description) updateData.description = description
    if (category) updateData.category = category

    const { data, error } = await supabase
      .from('campaign_templates')
      .update(updateData)
      .eq('campaign_type', templateId)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Transform response
    const responseTemplate = {
      id: data.campaign_type,
      name: data.name,
      description: data.description,
      category: data.category,
      bot_config: data.template_config.bot_config,
      onboarding_fields: data.template_config.onboarding_fields || [],
      analytics_config: data.template_config.analytics_config,
      landing_page_config: data.template_config.landing_page_config
    }

    return NextResponse.json({ template: responseTemplate })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('campaign_templates')
      .delete()
      .eq('campaign_type', templateId)

    if (error) {
      console.error('Error deleting campaign template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 