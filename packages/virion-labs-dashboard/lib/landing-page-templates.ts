export interface LandingPageTemplate {
  id: string
  name: string
  description: string
  preview_image: string
  campaign_types: string[] // Which campaign types this template works for
  category?: string
  customizable_fields?: string[]
  color_scheme?: any
  layout_config?: any
  is_default?: boolean
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
}

// Cache for templates to avoid repeated API calls
let templatesCache: LandingPageTemplate[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Fallback templates (subset of original hardcoded templates for offline/error scenarios)
const FALLBACK_TEMPLATES: LandingPageTemplate[] = [
  {
    id: "nike-sneaker-drop",
    name: "Nike Sneaker Drop",
    description: "Perfect for Nike product launches and exclusive sneaker releases",
    preview_image: "/templates/nike-sneaker-drop.png",
    campaign_types: ["referral_onboarding", "product_promotion"],
    category: "ecommerce",
    fields: {
      offer_title: "Exclusive Nike Drop Access",
      offer_description: "Be first to access limited Nike releases. Skip the waitlist and secure your pair.",
      offer_highlights: [
        "Skip all waitlists and queues",
        "Access to most limited releases",
        "Early notification 24h before drop",
        "Guaranteed purchase window",
        "Free expedited shipping"
      ],
      offer_value: "Save hours of waiting + Free shipping worth $25",
      what_you_get: "Priority access to Nike drops, early notifications, guaranteed purchase windows, and free shipping on all orders.",
      how_it_works: "1. Join our exclusive Discord community\n2. Verify your account and location\n3. Get notified 24h before drops\n4. Use your priority access link",
      requirements: "Valid Discord account, US shipping address, and commitment to purchase when accessing drops.",
      support_info: "Drop questions? Contact #nike-support or email nike@virionlabs.com"
    }
  },
  {
    id: "gaming-community",
    name: "Gaming Community",
    description: "Perfect for gaming communities, tournaments, and gaming-focused Discord servers",
    preview_image: "/templates/gaming-community.png",
    campaign_types: ["community_engagement", "referral_onboarding"],
    category: "gaming",
    fields: {
      offer_title: "Join Elite Gaming Community",
      offer_description: "Connect with competitive gamers, join weekly tournaments, and level up your skills with our pro gaming community.",
      offer_highlights: [
        "Weekly tournaments with cash prizes",
        "Training sessions with pro gamers",
        "Team formation and scrimmage matches",
        "Exclusive gaming tips and strategies",
        "Early access to game betas"
      ],
      offer_value: "Tournament fees waived - Save $25/week",
      what_you_get: "Full access to competitive tournaments, pro training sessions, team matching system, strategy guides, and beta game access.",
      how_it_works: "1. Join our gaming Discord server\n2. Complete skill assessment\n3. Get matched with players at your level\n4. Start competing in tournaments",
      requirements: "Active Discord account and commitment to good sportsmanship. Skill level doesn't matter - we welcome all gamers.",
      support_info: "Gaming support available in #help-desk. Tournament issues? Contact moderators in #tournament-support"
    }
  }
]

/**
 * Fetch landing page templates from the API
 */
async function fetchTemplatesFromAPI(campaignType?: string, category?: string): Promise<LandingPageTemplate[]> {
  try {
    const params = new URLSearchParams()
    if (campaignType) params.append('campaign_type', campaignType)
    if (category) params.append('category', category)

    const response = await fetch(`/api/landing-page-templates?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    return data.templates || []
  } catch (error) {
    console.error('Error fetching landing page templates from API:', error)
    // Return fallback templates if API fails
    return FALLBACK_TEMPLATES.filter(template => {
      if (campaignType && !template.campaign_types.includes(campaignType)) return false
      if (category && template.category !== category) return false
      return true
    })
  }
}

/**
 * Get all landing page templates with optional caching
 */
export async function getLandingPageTemplates(useCache: boolean = true): Promise<LandingPageTemplate[]> {
  const now = Date.now()
  
  // Return cached templates if valid and caching is enabled
  if (useCache && templatesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return templatesCache
  }

  try {
    const templates = await fetchTemplatesFromAPI()
    
    // Update cache
    templatesCache = templates
    cacheTimestamp = now
    
    return templates
  } catch (error) {
    console.error('Error loading landing page templates:', error)
    // Return fallback templates
    return FALLBACK_TEMPLATES
  }
}

/**
 * Get landing page templates by campaign type
 */
export async function getTemplatesByCampaignType(campaignType: string): Promise<LandingPageTemplate[]> {
  try {
    // First try to get from cache
    const now = Date.now()
    if (templatesCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return templatesCache.filter(template => template.campaign_types.includes(campaignType))
    }

    // Fetch from API with campaign type filter
    const templates = await fetchTemplatesFromAPI(campaignType)
    
    // Update cache with all templates if we don't have a full cache
    if (!templatesCache || (now - cacheTimestamp) >= CACHE_DURATION) {
      const allTemplates = await fetchTemplatesFromAPI()
      templatesCache = allTemplates
      cacheTimestamp = now
    }
    
    return templates
  } catch (error) {
    console.error('Error loading templates by campaign type:', error)
    // Return fallback templates filtered by campaign type
    return FALLBACK_TEMPLATES.filter(template => template.campaign_types.includes(campaignType))
  }
}

/**
 * Get a specific landing page template by ID
 */
export async function getTemplateById(id: string): Promise<LandingPageTemplate | undefined> {
  try {
    // First try to get from cache
    const now = Date.now()
    if (templatesCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return templatesCache.find(template => template.id === id)
    }

    // Fetch specific template from API
    const response = await fetch(`/api/landing-page-templates?template_id=${id}`)
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    return data.template || undefined
  } catch (error) {
    console.error('Error loading template by ID:', error)
    // Return fallback template
    return FALLBACK_TEMPLATES.find(template => template.id === id)
  }
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(category: string): Promise<LandingPageTemplate[]> {
  try {
    const templates = await fetchTemplatesFromAPI(undefined, category)
    return templates
  } catch (error) {
    console.error('Error loading templates by category:', error)
    // Return fallback templates filtered by category
    return FALLBACK_TEMPLATES.filter(template => template.category === category)
  }
}

/**
 * Clear the templates cache (useful for forcing refresh)
 */
export function clearTemplatesCache(): void {
  templatesCache = null
  cacheTimestamp = 0
}

// Backward compatibility exports
export const LANDING_PAGE_TEMPLATES = FALLBACK_TEMPLATES 