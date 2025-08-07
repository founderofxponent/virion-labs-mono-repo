// Client-side campaign templates service
export interface CampaignTemplate {
  id: string
  documentId?: string
  name: string
  description: string
  category: 'referral' | 'promotion' | 'community' | 'support' | 'custom'
  campaign_type: string
  is_default: boolean
  
  // New structure for template configuration from Strapi v5
  template_config?: {
    bot_config: any
    onboarding_fields: Array<{
      id: string
      question: string
      type: 'text' | 'email' | 'select' | 'multiselect' | 'number' | 'url' | 'boolean'
      required: boolean
      options?: string[]
      validation?: any
      discord_integration?: any
    }>
    analytics_config: any
    landing_page_config?: {
      offer_title: string
      offer_description: string
      offer_highlights: string[]
      offer_value: string
      what_you_get: string
      how_it_works: string
      requirements: string
      support_info: string
    }
  }
  
  // Comprehensive bot configuration (replaces standalone bot_configurations)
  bot_config?: {
    // Core bot identity
    bot_name: string
    bot_personality: 'helpful' | 'enthusiastic' | 'professional' | 'friendly' | 'casual'
    bot_response_style: 'formal' | 'casual' | 'friendly' | 'professional' | 'enthusiastic'
    prefix: string
    description: string
    avatar_url?: string
    
    // Visual branding
    brand_color: string
    embed_footer?: string
    welcome_message: string
    
    // Bot behavior configuration
    template: 'standard' | 'advanced' | 'custom' | 'referral_campaign' | 'support_campaign'
    
    // Response system
    auto_responses: Record<string, string>
    response_templates: Record<string, any>
    custom_commands: Array<{
      command: string
      response: string
      description?: string
    }>
    
    // Feature flags
    features: {
      welcome_enabled: boolean
      referral_tracking: boolean
      onboarding: boolean
      auto_role: boolean
      moderation: boolean
    }
    
    // Integration settings
    webhook_url?: string
    webhook_routes?: Array<{
      pattern: string
      url: string
      method: 'POST' | 'GET'
    }>
    api_endpoints?: Record<string, any>
    external_integrations?: Record<string, any>
    
    // Behavior controls
    rate_limit_per_user?: number
    allowed_channels?: string[]
    blocked_users?: string[]
    moderation_enabled?: boolean
    content_filters?: string[]
    
    // Campaign-specific settings
    referral_tracking_enabled?: boolean
    auto_role_assignment?: boolean
    target_role_ids?: string[]
    onboarding_completion_requirements?: {
      required_fields: string[] // Field IDs that must be completed
      auto_role_on_completion?: string
      completion_message?: string
      completion_webhook?: string
    }
    
    // Access control
    access_control_enabled?: boolean
    referral_only_access?: boolean
    auto_role_on_join?: string
    onboarding_channel_type?: 'dm' | 'channel' | 'any'
    private_channel_setup?: {
      create_private_channel: boolean
      channel_name_template?: string
      invite_expiry_hours?: number
    }
  }
  
  // Onboarding fields for data collection
  onboarding_fields: Array<{
    id: string
    question: string
    type: 'text' | 'email' | 'select' | 'multiselect' | 'number' | 'url' | 'boolean'
    required: boolean
    options?: string[] // For select/multiselect types
    placeholder?: string
    description?: string
    validation?: {
      min_length?: number
      max_length?: number
      pattern?: string
      error_message?: string
    }
    discord_integration: {
      collect_in_dm: boolean // Whether to collect this field in Discord DM
      show_in_embed: boolean // Whether to show this field in Discord embeds
      trigger_after?: string // Collect after this field is completed
    }
  }>
  
  // Analytics configuration
  analytics_config: {
    primary_metrics: string[]
    conversion_events: string[]
    tracking_enabled: boolean
  }
  
  // Optimized landing page association
  default_landing_page?: {
    id: string
    name: string
    description: string
    preview_image: string
    campaign_types: string[]
    category?: string
    fields: {
      offer_title: string
      offer_description: string
      offer_highlights: string[]
      offer_value: string
      what_you_get: string
      how_it_works: string
      requirements: string
      support_info: string
    }
    customizable_fields: string[]
    color_scheme?: any
    layout_config?: any
    is_default?: boolean
  }
}

// Cache for templates to avoid repeated API calls
let templatesCache: CampaignTemplate[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Fetch all templates from API
async function fetchTemplatesFromAPI(): Promise<CampaignTemplate[]> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        throw new Error("Authentication token not found.");
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/operations/campaign-template/list`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    
    if (!response.ok) {
      console.error('Failed to fetch campaign templates:', response.statusText)
      return []
    }
    
    const data = await response.json()
    return data.templates || []
  } catch (error) {
    console.error('Error fetching campaign templates:', error)
    return []
  }
}

// Get templates with caching
async function getTemplatesWithCache(): Promise<CampaignTemplate[]> {
  const now = Date.now()
  
  // Return cached templates if they're still fresh
  if (templatesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return templatesCache
  }
  
  // Fetch fresh templates from API
  const templates = await fetchTemplatesFromAPI()
  
  // Update cache
  templatesCache = templates
  cacheTimestamp = now
  
  return templates
}

// Get individual template by ID
export async function getCampaignTemplateAsync(templateId: string): Promise<CampaignTemplate | undefined> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        throw new Error("Authentication token not found.");
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/operations/campaign-template/get/${encodeURIComponent(templateId)}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    
    if (!response.ok) {
      console.error('Failed to fetch campaign template:', response.statusText)
      return undefined
    }
    
    const data = await response.json()
    return data.template || undefined
  } catch (error) {
    console.error('Error fetching campaign template:', error)
    return undefined
  }
}

// Get templates by category
export async function getCampaignTemplatesByCategoryAsync(category: string): Promise<CampaignTemplate[]> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        throw new Error("Authentication token not found.");
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/operations/campaign-template/list?category=${encodeURIComponent(category)}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    
    if (!response.ok) {
      console.error('Failed to fetch campaign templates by category:', response.statusText)
      return []
    }
    
    const data = await response.json()
    return data.templates || []
  } catch (error) {
    console.error('Error fetching campaign templates by category:', error)
    return []
  }
}

// Get all templates
export async function getAllCampaignTemplatesAsync(): Promise<CampaignTemplate[]> {
  return getTemplatesWithCache()
} 