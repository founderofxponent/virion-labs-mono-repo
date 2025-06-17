import { useState, useEffect } from 'react'
import { 
  LandingPageTemplate, 
  getTemplatesByCampaignType, 
  getTemplateById, 
  getTemplatesByCategory,
  getLandingPageTemplates 
} from '@/lib/landing-page-templates'

export function useLandingPageTemplates(campaignType?: string, category?: string) {
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true)
      setError(null)
      try {
        let result: LandingPageTemplate[]
        
        if (campaignType) {
          result = await getTemplatesByCampaignType(campaignType)
        } else if (category) {
          result = await getTemplatesByCategory(category)
        } else {
          result = await getLandingPageTemplates()
        }
        
        setTemplates(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
        console.error('Error loading landing page templates:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTemplates()
  }, [campaignType, category])

  const refresh = () => {
    const loadTemplates = async () => {
      setLoading(true)
      setError(null)
      try {
        let result: LandingPageTemplate[]
        
        if (campaignType) {
          result = await getTemplatesByCampaignType(campaignType)
        } else if (category) {
          result = await getTemplatesByCategory(category)
        } else {
          result = await getLandingPageTemplates(false) // Force refresh
        }
        
        setTemplates(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
        console.error('Error loading landing page templates:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTemplates()
  }

  return {
    templates,
    loading,
    error,
    refresh
  }
}

export function useLandingPageTemplate(templateId: string) {
  const [template, setTemplate] = useState<LandingPageTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) {
        setTemplate(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const result = await getTemplateById(templateId)
        setTemplate(result || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load template')
        console.error('Error loading landing page template:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }, [templateId])

  const refresh = () => {
    if (!templateId) return

    const loadTemplate = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await getTemplateById(templateId)
        setTemplate(result || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load template')
        console.error('Error loading landing page template:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }

  return {
    template,
    loading,
    error,
    refresh
  }
} 