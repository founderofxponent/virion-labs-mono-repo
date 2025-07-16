import { useState, useEffect } from 'react'
import { type CampaignTemplate } from '@/lib/campaign-templates'

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

export function useCampaignTemplateComplete(templateId: string | null) {
  const [template, setTemplate] = useState<CampaignTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!templateId) {
      setTemplate(null)
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
        setTemplate(result.template)
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
          setTemplate(result.template)
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
    template,
    landingPage: template?.default_landing_page || null,
    loading,
    error,
    refresh
  }
} 