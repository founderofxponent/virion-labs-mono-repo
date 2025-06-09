'use client'

import { useState, useEffect } from 'react'

export interface OnboardingField {
  id: string
  campaign_id: string
  field_key: string
  field_label: string
  field_type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'url' | 'boolean'
  field_placeholder?: string
  field_description?: string
  field_options: string[]
  is_required: boolean
  is_enabled: boolean
  sort_order: number
  validation_rules: Record<string, any>
  discord_integration?: {
    collect_in_dm: boolean
    show_in_embed: boolean
    trigger_after?: string
  }
  created_at: string
  updated_at: string
}

export interface OnboardingTemplate {
  id: string
  template_name: string
  template_description?: string
  field_config: OnboardingFieldConfig[]
  is_default: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface OnboardingFieldConfig {
  key: string
  label: string
  type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'url' | 'boolean'
  placeholder?: string
  description?: string
  options?: string[]
  required: boolean
  enabled: boolean
  sort_order: number
  discord_integration?: {
    collect_in_dm: boolean
    show_in_embed: boolean
    trigger_after?: string
  }
}

export interface CreateOnboardingFieldData {
  campaign_id: string
  field_key: string
  field_label: string
  field_type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'url' | 'boolean'
  field_placeholder?: string
  field_description?: string
  field_options?: string[]
  is_required?: boolean
  is_enabled?: boolean
  sort_order?: number
  validation_rules?: Record<string, any>
  discord_integration?: {
    collect_in_dm: boolean
    show_in_embed: boolean
    trigger_after?: string
  }
}

export interface UpdateOnboardingFieldData {
  id: string
  field_label?: string
  field_type?: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'url' | 'boolean'
  field_placeholder?: string
  field_description?: string
  field_options?: string[]
  is_required?: boolean
  is_enabled?: boolean
  sort_order?: number
  validation_rules?: Record<string, any>
  discord_integration?: {
    collect_in_dm: boolean
    show_in_embed: boolean
    trigger_after?: string
  }
}

export function useOnboardingFields(campaignId?: string) {
  const [fields, setFields] = useState<OnboardingField[]>([])
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFields = async (campaign_id?: string) => {
    if (!campaign_id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/campaign-onboarding-fields?campaign_id=${campaign_id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch fields: ${response.statusText}`)
      }

      const data = await response.json()
      setFields(data.fields || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching onboarding fields:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/onboarding-templates')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`)
      }

      const data = await response.json()
      setTemplates(data.templates || [])
      return data.templates || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching onboarding templates:', err)
    }
  }

  const createField = async (fieldData: CreateOnboardingFieldData) => {
    try {
      const response = await fetch('/api/campaign-onboarding-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create field')
      }

      const data = await response.json()
      
      // Refresh fields list
      if (fieldData.campaign_id) {
        await fetchFields(fieldData.campaign_id)
      }

      return { success: true, field: data.field }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { success: false, error: errorMessage }
    }
  }

  const updateField = async (updateData: UpdateOnboardingFieldData) => {
    try {
      const response = await fetch('/api/campaign-onboarding-fields', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update field')
      }

      const data = await response.json()
      
      // Update local state
      setFields(fields.map(field => 
        field.id === updateData.id ? { ...field, ...data.field } : field
      ))

      return { success: true, field: data.field }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { success: false, error: errorMessage }
    }
  }

  const deleteField = async (fieldId: string) => {
    try {
      const response = await fetch(`/api/campaign-onboarding-fields?id=${fieldId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete field')
      }

      // Update local state
      setFields(fields.filter(field => field.id !== fieldId))

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { success: false, error: errorMessage }
    }
  }

  const applyTemplate = async (campaignId: string, templateId: string) => {
    try {
      const response = await fetch('/api/campaign-onboarding-fields/apply-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          template_id: templateId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to apply template')
      }

      const data = await response.json()
      setFields(data.fields || [])

      return { success: true, fields: data.fields }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { success: false, error: errorMessage }
    }
  }

  const reorderFields = async (reorderedFields: OnboardingField[]) => {
    try {
      // Update sort_order for all fields
      const updatePromises = reorderedFields.map((field, index) =>
        updateField({ id: field.id, sort_order: index })
      )

      await Promise.all(updatePromises)
      
      // Update local state
      setFields(reorderedFields)

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { success: false, error: errorMessage }
    }
  }

  // Auto-fetch when campaignId changes
  useEffect(() => {
    if (campaignId) {
      fetchFields(campaignId)
    }
  }, [campaignId])

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  return {
    fields,
    templates,
    loading,
    error,
    fetchFields,
    fetchTemplates,
    createField,
    updateField,
    deleteField,
    applyTemplate,
    reorderFields,
  }
} 