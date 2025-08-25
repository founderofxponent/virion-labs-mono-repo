import { useState, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"
import { buildApiUrl, logApiConfiguration } from '@/lib/api-url-utils'

export interface EmailTemplate {
  id: number
  documentId?: string
  template_id: string
  subject: string
  body: string
  description?: string
  is_active: boolean
  variables?: string[]
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
}

export interface EmailTemplateCreate {
  template_id: string
  subject: string
  body: string
  description?: string
  is_active?: boolean
  variables?: string[]
}

export interface EmailTemplateUpdate {
  template_id?: string
  subject?: string
  body?: string
  description?: string
  is_active?: boolean
  variables?: string[]
}

export interface TemplateRenderRequest {
  template_id: string
  variables: Record<string, string>
}

export interface TemplateRenderResponse {
  subject: string
  body: string
}

export interface EmailTemplatesResponse {
  templates: EmailTemplate[]
  total?: number
}

export interface SendTestEmailRequest {
  template_id: string
  to_email: string
  variables?: Record<string, string>
}

export interface SendTestEmailResponse {
  message: string
  template_id: string
  recipient: string
}

export function useEmailTemplatesApi() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = `${buildApiUrl()}/api/v1`
  const getToken = () => localStorage.getItem('auth_token')

  // Debug logging to track environment variable and validate URL
  logApiConfiguration()
  console.log('useEmailTemplatesApi - Final API_BASE_URL:', API_BASE_URL)

  const fetchTemplates = useCallback(async (filters?: {
    is_active?: boolean
    template_id?: string
  }): Promise<EmailTemplate[]> => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      setLoading(false)
      return []
    }

    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters?.is_active !== undefined) {
        params.append('is_active', String(filters.is_active))
      }
      if (filters?.template_id) {
        params.append('template_id', filters.template_id)
      }

      const queryString = params.toString()
      // Explicitly construct URL without trailing slash to avoid FastAPI redirects
      const url = queryString ? `${API_BASE_URL}/templates?${queryString}` : `${API_BASE_URL}/templates`
      
      console.log('Fetching templates from URL:', url)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch templates')
      }

      const data: EmailTemplatesResponse = await response.json()
      return data.templates
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTemplate = useCallback(async (templateId: string): Promise<EmailTemplate> => {
    const token = getToken()
    if (!token) {
      throw new Error("Authentication token not found.")
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch template')
      }

      const data: EmailTemplate = await response.json()
      return data
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to fetch template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createTemplate = useCallback(async (templateData: EmailTemplateCreate): Promise<EmailTemplate> => {
    const token = getToken()
    if (!token) {
      throw new Error("Authentication token not found.")
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create template')
      }

      const data: EmailTemplate = await response.json()
      return data
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTemplate = useCallback(async (documentId: string, templateData: EmailTemplateUpdate): Promise<EmailTemplate> => {
    const token = getToken()
    if (!token) {
      throw new Error("Authentication token not found.")
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update template')
      }

      const data: EmailTemplate = await response.json()
      return data
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTemplate = useCallback(async (documentId: string): Promise<void> => {
    const token = getToken()
    if (!token) {
      throw new Error("Authentication token not found.")
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete template')
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const renderTemplate = useCallback(async (request: TemplateRenderRequest): Promise<TemplateRenderResponse> => {
    const token = getToken()
    if (!token) {
      throw new Error("Authentication token not found.")
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/templates/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to render template')
      }

      const data: TemplateRenderResponse = await response.json()
      return data
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to render template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const sendTestEmail = useCallback(async (request: SendTestEmailRequest): Promise<SendTestEmailResponse> => {
    const token = getToken()
    if (!token) {
      throw new Error("Authentication token not found.")
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/templates/send-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to send test email')
      }

      const data: SendTestEmailResponse = await response.json()
      return data
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to send test email')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    fetchTemplates,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    renderTemplate,
    sendTestEmail,
  }
}