'use client'

import { useState, useEffect } from 'react'
import {
  CampaignOnboardingField,
  CreateOnboardingFieldData,
  UpdateOnboardingFieldData,
  OnboardingTemplate,
  OnboardingFieldConfig
} from '@/schemas/campaign-onboarding-field'

export function useOnboardingFields(campaignId?: string) {
  const [fields, setFields] = useState<CampaignOnboardingField[]>([])
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFields = async (campaign_id?: string) => {
    if (!campaign_id) {
      setLoading(false)
      setFields([])
      setError(null)
      return
    }

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
      // Campaign templates are now handled by the campaign template system
      // This function is kept for backward compatibility but returns empty array
      setTemplates([])
      return []
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
        field.documentId === updateData.documentId ? { ...field, ...data.field } : field
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
      setFields(fields.filter(field => field.documentId !== fieldId))

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

  const reorderFields = async (reorderedFields: CampaignOnboardingField[]) => {
    try {
      // Update sort_order for all fields
      const updatePromises = reorderedFields.map((field, index) =>
        updateField({ documentId: field.documentId, sort_order: index })
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
    } else {
      // No campaignId provided, set loading to false with empty fields
      setLoading(false)
      setFields([])
      setError(null)
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