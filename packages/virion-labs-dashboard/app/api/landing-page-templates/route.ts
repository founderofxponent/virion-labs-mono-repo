import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignType = searchParams.get('campaign_type')
    const templateId = searchParams.get('template_id')
    const category = searchParams.get('category')
    const isDefault = searchParams.get('is_default')

    let query = supabase
      .from('landing_page_templates')
      .select('*')
      .eq('is_active', true)

    // Filter by campaign type compatibility
    if (campaignType) {
      query = query.contains('campaign_types', [campaignType])
    }

    // Filter by specific template ID
    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    // Filter by category
    if (category) {
      query = query.eq('category', category)
    }

    // Filter by default status
    if (isDefault !== null) {
      query = query.eq('is_default', isDefault === 'true')
    }

    const { data, error } = await query.order('is_default', { ascending: false }).order('name')

    if (error) {
      console.error('Error fetching landing page templates:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform database templates to match frontend interface
    const templates = data.map(template => ({
      id: template.template_id,
      name: template.name,
      description: template.description,
      preview_image: template.preview_image_url || '/templates/default-preview.png',
      campaign_types: template.campaign_types,
      category: template.category,
      fields: {
        offer_title: template.default_offer_title || '',
        offer_description: template.default_offer_description || '',
        offer_highlights: template.default_offer_highlights || [],
        offer_value: template.default_offer_value || '',
        what_you_get: template.default_what_you_get || '',
        how_it_works: template.default_how_it_works || '',
        requirements: template.default_requirements || '',
        support_info: template.default_support_info || ''
      },
      customizable_fields: template.customizable_fields,
      color_scheme: template.color_scheme,
      layout_config: template.layout_config,
      is_default: template.is_default
    }))

    if (templateId) {
      const template = templates[0]
      return NextResponse.json({ template: template || null })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      template_id,
      name,
      description,
      preview_image_url,
      campaign_types,
      category,
      customizable_fields,
      default_offer_title,
      default_offer_description,
      default_offer_highlights,
      default_offer_value,
      default_what_you_get,
      default_how_it_works,
      default_requirements,
      default_support_info,
      color_scheme,
      layout_config,
      is_default = false,
      is_active = true
    } = body

    // Validate required fields
    if (!template_id || !name || !description || !campaign_types) {
      return NextResponse.json(
        { error: 'Missing required fields: template_id, name, description, campaign_types' },
        { status: 400 }
      )
    }

    // Check if template with same template_id already exists
    const { data: existingTemplate } = await supabase
      .from('landing_page_templates')
      .select('id')
      .eq('template_id', template_id)
      .single()

    if (existingTemplate) {
      return NextResponse.json(
        { error: `Template with template_id '${template_id}' already exists` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('landing_page_templates')
      .insert({
        template_id,
        name,
        description,
        preview_image_url,
        campaign_types,
        category,
        customizable_fields: customizable_fields || [],
        default_offer_title,
        default_offer_description,
        default_offer_highlights,
        default_offer_value,
        default_what_you_get,
        default_how_it_works,
        default_requirements,
        default_support_info,
        color_scheme: color_scheme || {},
        layout_config: layout_config || {},
        is_default,
        is_active
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating landing page template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform response to match frontend interface
    const responseTemplate = {
      id: data.template_id,
      name: data.name,
      description: data.description,
      preview_image: data.preview_image_url || '/templates/default-preview.png',
      campaign_types: data.campaign_types,
      category: data.category,
      fields: {
        offer_title: data.default_offer_title || '',
        offer_description: data.default_offer_description || '',
        offer_highlights: data.default_offer_highlights || [],
        offer_value: data.default_offer_value || '',
        what_you_get: data.default_what_you_get || '',
        how_it_works: data.default_how_it_works || '',
        requirements: data.default_requirements || '',
        support_info: data.default_support_info || ''
      },
      customizable_fields: data.customizable_fields,
      color_scheme: data.color_scheme,
      layout_config: data.layout_config,
      is_default: data.is_default
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
    const templateId = searchParams.get('template_id')
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Map allowed update fields
    const allowedFields = [
      'name', 'description', 'preview_image_url', 'campaign_types', 'category',
      'customizable_fields', 'default_offer_title', 'default_offer_description',
      'default_offer_highlights', 'default_offer_value', 'default_what_you_get',
      'default_how_it_works', 'default_requirements', 'default_support_info',
      'color_scheme', 'layout_config', 'is_default', 'is_active'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    const { data, error } = await supabase
      .from('landing_page_templates')
      .update(updateData)
      .eq('template_id', templateId)
      .select()
      .single()

    if (error) {
      console.error('Error updating landing page template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Transform response to match frontend interface
    const responseTemplate = {
      id: data.template_id,
      name: data.name,
      description: data.description,
      preview_image: data.preview_image_url || '/templates/default-preview.png',
      campaign_types: data.campaign_types,
      category: data.category,
      fields: {
        offer_title: data.default_offer_title || '',
        offer_description: data.default_offer_description || '',
        offer_highlights: data.default_offer_highlights || [],
        offer_value: data.default_offer_value || '',
        what_you_get: data.default_what_you_get || '',
        how_it_works: data.default_how_it_works || '',
        requirements: data.default_requirements || '',
        support_info: data.default_support_info || ''
      },
      customizable_fields: data.customizable_fields,
      color_scheme: data.color_scheme,
      layout_config: data.layout_config,
      is_default: data.is_default
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
    const templateId = searchParams.get('template_id')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('landing_page_templates')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('template_id', templateId)

    if (error) {
      console.error('Error deleting landing page template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 