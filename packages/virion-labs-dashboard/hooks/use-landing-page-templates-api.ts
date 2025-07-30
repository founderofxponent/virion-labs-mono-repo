"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"

// Landing Page Template interface matching the new API structure
export interface LandingPageTemplate {
  id: string;
  documentId: string; // Required in Strapi v5
  name: string;
  description: string;
  campaign_types: string[];
  template_structure: any;
  default_content: any;
  customizable_fields: any;
  color_scheme: any;
  layout_config: any;
  category?: string;
  is_active: boolean;
  is_default?: boolean;
  preview_image?: string;
  created_at: string;
  updated_at: string;
  // Default template fields for populating forms
  default_offer_title?: string;
  default_offer_description?: string;
  default_offer_highlights?: string[];
  default_offer_value?: string;
  default_offer_expiry_date?: string;
  default_hero_image_url?: string;
  default_product_images?: string[];
  default_video_url?: string;
  default_what_you_get?: string;
  default_how_it_works?: string;
  default_requirements?: string;
  default_support_info?: string;
}

// API response structure
interface ApiLandingPageTemplate {
  id: string;
  documentId: string; // Required in Strapi v5
  attributes: Omit<LandingPageTemplate, 'id' | 'documentId'>;
}

interface ApiListResponse {
  landing_page_templates: any[];
  total_count: number;
}

interface ApiSingleResponse {
  landing_page_template: any;
}

export function useLandingPageTemplatesAPI(campaignType?: string, category?: string) {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "http://localhost:8000/api/v1/operations"

  const getToken = () => localStorage.getItem('auth_token')

  const transformApiTemplate = (apiTemplate: any): LandingPageTemplate => {
    // Handle both nested attributes structure and flat structure from Strapi
    const attributes = apiTemplate.attributes || apiTemplate;
    
    return {
      id: apiTemplate.id,
      documentId: apiTemplate.documentId,
      name: attributes.name || apiTemplate.name,
      description: attributes.description || attributes.Description || apiTemplate.Description,
      campaign_types: attributes.campaign_types || apiTemplate.campaign_types || [],
      template_structure: attributes.template_structure || apiTemplate.template_structure || {},
      default_content: attributes.default_content || apiTemplate.default_content || {},
      customizable_fields: attributes.customizable_fields || apiTemplate.customizable_fields || [],
      color_scheme: attributes.color_scheme || apiTemplate.color_scheme || {},
      layout_config: attributes.layout_config || apiTemplate.layout_config || {},
      category: attributes.category || apiTemplate.category,
      is_active: attributes.is_active !== undefined ? attributes.is_active : (apiTemplate.is_active !== undefined ? apiTemplate.is_active : true),
      created_at: attributes.created_at || attributes.createdAt || apiTemplate.createdAt || '',
      updated_at: attributes.updated_at || attributes.updatedAt || apiTemplate.updatedAt || '',
      // Add default template fields for populating form data
      default_offer_title: attributes.default_offer_title || apiTemplate.default_offer_title,
      default_offer_description: attributes.default_offer_description || apiTemplate.default_offer_description,
      default_offer_highlights: attributes.default_offer_highlights || apiTemplate.default_offer_highlights,
      default_offer_value: attributes.default_offer_value || apiTemplate.default_offer_value,
      default_offer_expiry_date: attributes.default_offer_expiry_date || apiTemplate.default_offer_expiry_date,
      default_hero_image_url: attributes.default_hero_image_url || apiTemplate.default_hero_image_url,
      default_product_images: attributes.default_product_images || apiTemplate.default_product_images,
      default_video_url: attributes.default_video_url || apiTemplate.default_video_url,
      default_what_you_get: attributes.default_what_you_get || apiTemplate.default_what_you_get,
      default_how_it_works: attributes.default_how_it_works || apiTemplate.default_how_it_works,
      default_requirements: attributes.default_requirements || apiTemplate.default_requirements,
      default_support_info: attributes.default_support_info || apiTemplate.default_support_info,
    }
  }

  const fetchTemplates = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const searchParams = new URLSearchParams()
      if (campaignType) searchParams.append('campaign_type', campaignType)
      if (category) searchParams.append('category', category)

      const response = await fetch(`${API_BASE_URL}/landing-page-template/list?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch landing page templates')
      }
      
      const data: ApiListResponse = await response.json()
      const transformedTemplates = data.landing_page_templates.map(transformApiTemplate)
      setTemplates(transformedTemplates)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [campaignType, category])

  const fetchSingleTemplate = useCallback(async (templateId: string): Promise<LandingPageTemplate> => {
    const token = getToken()
    if (!token) {
      throw new Error("Authentication token not found.")
    }

    try {
      const response = await fetch(`${API_BASE_URL}/landing-page-template/get/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch landing page template')
      }
      
      const data: ApiSingleResponse = await response.json()
      return transformApiTemplate(data.landing_page_template)

    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchTemplates()
    }
  }, [user, fetchTemplates])

  return {
    templates,
    loading,
    error,
    refresh: fetchTemplates,
    fetchSingleTemplate,
    createTemplate: useCallback(async (templateData: any) => {
      const token = getToken()
      if (!token) {
        throw new Error("Authentication token not found.")
      }
      const response = await fetch(`${API_BASE_URL}/landing-page-template/create`, {
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
      fetchTemplates()
    }, [fetchTemplates]),
    updateTemplate: useCallback(async (templateId: string, templateData: any) => {
      const token = getToken()
      if (!token) {
        throw new Error("Authentication token not found.")
      }
      const response = await fetch(`${API_BASE_URL}/landing-page-template/update/${templateId}`, {
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
      fetchTemplates()
    }, [fetchTemplates]),
    deleteTemplate: useCallback(async (templateId: string) => {
      const token = getToken()
      if (!token) {
        throw new Error("Authentication token not found.")
      }
      const response = await fetch(`${API_BASE_URL}/landing-page-template/delete/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete template')
      }
      fetchTemplates()
    }, [fetchTemplates]),
  }
}

export function useLandingPageTemplateAPI(templateId?: string) {
  const { user } = useAuth()
  const [template, setTemplate] = useState<LandingPageTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "http://localhost:8000/api/v1/operations"

  const getToken = () => localStorage.getItem('auth_token')

  const transformApiTemplate = (apiTemplate: any): LandingPageTemplate => {
    // Handle both nested attributes structure and flat structure from Strapi
    const attributes = apiTemplate.attributes || apiTemplate;
    
    return {
      id: apiTemplate.id,
      documentId: apiTemplate.documentId,
      name: attributes.name || apiTemplate.name,
      description: attributes.description || attributes.Description || apiTemplate.Description,
      campaign_types: attributes.campaign_types || apiTemplate.campaign_types || [],
      template_structure: attributes.template_structure || apiTemplate.template_structure || {},
      default_content: attributes.default_content || apiTemplate.default_content || {},
      customizable_fields: attributes.customizable_fields || apiTemplate.customizable_fields || [],
      color_scheme: attributes.color_scheme || apiTemplate.color_scheme || {},
      layout_config: attributes.layout_config || apiTemplate.layout_config || {},
      category: attributes.category || apiTemplate.category,
      is_active: attributes.is_active !== undefined ? attributes.is_active : (apiTemplate.is_active !== undefined ? apiTemplate.is_active : true),
      created_at: attributes.created_at || attributes.createdAt || apiTemplate.createdAt || '',
      updated_at: attributes.updated_at || attributes.updatedAt || apiTemplate.updatedAt || '',
      // Add default template fields for populating form data
      default_offer_title: attributes.default_offer_title || apiTemplate.default_offer_title,
      default_offer_description: attributes.default_offer_description || apiTemplate.default_offer_description,
      default_offer_highlights: attributes.default_offer_highlights || apiTemplate.default_offer_highlights,
      default_offer_value: attributes.default_offer_value || apiTemplate.default_offer_value,
      default_offer_expiry_date: attributes.default_offer_expiry_date || apiTemplate.default_offer_expiry_date,
      default_hero_image_url: attributes.default_hero_image_url || apiTemplate.default_hero_image_url,
      default_product_images: attributes.default_product_images || apiTemplate.default_product_images,
      default_video_url: attributes.default_video_url || apiTemplate.default_video_url,
      default_what_you_get: attributes.default_what_you_get || apiTemplate.default_what_you_get,
      default_how_it_works: attributes.default_how_it_works || apiTemplate.default_how_it_works,
      default_requirements: attributes.default_requirements || apiTemplate.default_requirements,
      default_support_info: attributes.default_support_info || apiTemplate.default_support_info,
    }
  }

  const fetchTemplate = useCallback(async () => {
    if (!templateId) {
      setTemplate(null)
      setLoading(false)
      return
    }

    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/landing-page-template/get/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch landing page template')
      }
      
      const data: ApiSingleResponse = await response.json()
      setTemplate(transformApiTemplate(data.landing_page_template))

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    if (user) {
      fetchTemplate()
    }
  }, [user, fetchTemplate])

  return {
    template,
    loading,
    error,
    refresh: fetchTemplate,
  }
}