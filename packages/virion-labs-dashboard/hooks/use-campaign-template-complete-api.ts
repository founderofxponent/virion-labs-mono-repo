import { useState, useEffect } from 'react'
import { type CampaignTemplate } from '@/lib/campaign-templates'

export function useCampaignTemplateCompleteAPI(templateId: string | null) {
  const [template, setTemplate] = useState<CampaignTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const API_BASE_URL = "http://localhost:8000/api/v1/operations"

  const getToken = () => localStorage.getItem('auth_token')

  useEffect(() => {
    if (!templateId) {
      setTemplate(null)
      setLoading(false)
      setError(null)
      return
    }

    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      setLoading(false)
      return
    }

    const fetchTemplate = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/campaign-template/get/${templateId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
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
        const token = getToken()
        if (!token) {
            setError("Authentication token not found.")
            setLoading(false)
            return
        }

      const fetchTemplate = async () => {
        setLoading(true)
        setError(null)
        try {
          const response = await fetch(`${API_BASE_URL}/campaign-template/get/${templateId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
          })
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
    landingPage: template?.default_landing_page || template?.template_config?.landing_page_config || null,
    loading,
    error,
    refresh
  }
}
