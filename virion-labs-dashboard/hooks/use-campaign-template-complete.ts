import { useState, useEffect } from 'react'

export interface CampaignTemplateComplete {
  id: string
  name: string
  description: string
  category: string
  campaign_type: string
  is_default: boolean
  bot_config: {
    prefix: string
    description: string
    bot_name: string
    bot_personality: string
    bot_response_style: string
    brand_color: string
    welcome_message: string
    campaign_type: string
    features: {
      referral_tracking: boolean
      auto_role: boolean
      moderation: boolean
    }
  }
  onboarding_fields: any[]
}

export interface LandingPageTemplate {
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

export interface CampaignTemplateCompleteResponse {
  template: CampaignTemplateComplete
  landing_page: LandingPageTemplate | null
}

export function useCampaignTemplateComplete(templateId: string | null) {
  const [data, setData] = useState<CampaignTemplateCompleteResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!templateId) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchTemplate = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/campaign-templates/${templateId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch template: ${response.status}`)
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load template')
        console.error('Error loading campaign template:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [templateId])

  const refresh = () => {
    if (templateId) {
      const fetchTemplate = async () => {
        setLoading(true)
        setError(null)
        try {
          const response = await fetch(`/api/campaign-templates/${templateId}`)
          if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.status}`)
          }
          
          const result = await response.json()
          setData(result)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load template')
          console.error('Error loading campaign template:', err)
        } finally {
          setLoading(false)
        }
      }

      fetchTemplate()
    }
  }

  return {
    data,
    template: data?.template || null,
    landing_page: data?.landing_page || null,
    loading,
    error,
    refresh
  }
} 