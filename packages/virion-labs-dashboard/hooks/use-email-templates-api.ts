import { useState, useCallback } from 'react'
import api from '@/lib/api'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async (filters?: {
    is_active?: boolean
    template_id?: string
  }): Promise<EmailTemplate[]> => {
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

      const response = await api.get<EmailTemplatesResponse>(`/api/v1/templates?${params.toString()}`)
      return response.data.templates
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch templates')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTemplate = useCallback(async (templateId: string): Promise<EmailTemplate> => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<EmailTemplate>(`/api/v1/templates/${templateId}`)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createTemplate = useCallback(async (templateData: EmailTemplateCreate): Promise<EmailTemplate> => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.post<EmailTemplate>('/api/v1/templates', templateData)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTemplate = useCallback(async (documentId: string, templateData: EmailTemplateUpdate): Promise<EmailTemplate> => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.put<EmailTemplate>(`/api/v1/templates/${documentId}`, templateData)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTemplate = useCallback(async (documentId: string): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      await api.delete(`/api/v1/templates/${documentId}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const renderTemplate = useCallback(async (request: TemplateRenderRequest): Promise<TemplateRenderResponse> => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.post<TemplateRenderResponse>('/api/v1/templates/render', request)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to render template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const sendTestEmail = useCallback(async (request: SendTestEmailRequest): Promise<SendTestEmailResponse> => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.post<SendTestEmailResponse>('/api/v1/templates/send-test', request)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send test email')
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