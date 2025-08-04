'use client'

import { useState, useEffect } from 'react'
import { CampaignOnboardingField, OnboardingQuestion, UpdateOnboardingFieldData } from "@/schemas/campaign-onboarding-field";
import { CreateOnboardingFieldData } from "@/schemas/campaign-onboarding-field";

export function useOnboardingFieldsAPI(campaignId?: string) {
  const [fields, setFields] = useState<CampaignOnboardingField[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const API_BASE_URL = "http://localhost:8000/api/v1/operations"

  const getToken = () => localStorage.getItem('auth_token')

  const fetchFields = async (campaign_id?: string): Promise<CampaignOnboardingField[] | void> => {
    if (!campaign_id) {
      setLoading(false)
      setFields([])
      setError(null)
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

      const response = await fetch(`${API_BASE_URL}/campaign/onboarding-fields/${campaign_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch fields: ${response.statusText}`)
      }

      const data = await response.json()
      const fields = data.fields || [];
      setFields(fields);
      return fields;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching onboarding fields:', err)
    } finally {
      setLoading(false)
    }
  }

  const createField = async (fieldData: CreateOnboardingFieldData) => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    try {
      const response = await fetch(`${API_BASE_URL}/campaign/onboarding-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...fieldData,
          id: undefined,
          campaign: fieldData.campaign_id,
          field_options: Array.isArray(fieldData.field_options) && fieldData.field_options.length > 0
            ? { options: fieldData.field_options }
            : {}
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create field')
      }

      const data = await response.json()
      
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
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    try {
      const { documentId } = updateData;
      if (!documentId) throw new Error("documentId is required for updating a field.");

      // Create clean payload - backend now handles complex detach-update-reattach logic
      const payload = { ...updateData };
      
      // Remove fields that shouldn't be sent to the API
      delete (payload as any).id;
      delete (payload as any).documentId;
      delete (payload as any).campaign_id;
      delete (payload as any).createdAt;
      delete (payload as any).updatedAt;
      delete (payload as any).publishedAt;
      delete (payload as any).campaign;
      delete (payload as any).created_at;
      delete (payload as any).updated_at;

      const response = await fetch(`${API_BASE_URL}/campaign/onboarding-fields/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update field')
      }

      const data = await response.json()
      
      // Update local state with the updated field
      setFields(fields.map(field =>
        field.documentId === (updateData as any).documentId ? { ...field, ...data.field } : field
      ))

      return { success: true, field: data.field }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { success: false, error: errorMessage }
    }
  }

  const deleteField = async (documentId: string) => {
    const token = getToken()
    if (!token) throw new Error("Authentication token not found.")

    try {
      const response = await fetch(`${API_BASE_URL}/campaign/onboarding-fields/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete field')
      }

      setFields(fields.filter(field => field.documentId !== documentId))
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { success: false, error: errorMessage }
    }
  }

  const applyTemplate = async (campaign_id: string, template_id: string) => {
    const token = getToken()
    if (!token) return { success: false, error: "Authentication token not found." }

    try {
      const response = await fetch(`${API_BASE_URL}/campaign/onboarding-fields/apply-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ campaign_id, template_id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to apply template')
      }

      const data = await response.json()
      
      if (campaign_id) {
        await fetchFields(campaign_id)
      }

      return { success: true, fields: data.fields }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { success: false, error: errorMessage }
    }
  }

  const reorderFields = async (reorderedFields: CampaignOnboardingField[]) => {
    // This will require a new endpoint
    return { success: false, error: "Not implemented" }
  }

  const batchUpdateFields = async (campaign_id: string, fields: OnboardingQuestion[], deleteIds: string[] = []) => {
    const token = getToken()
    if (!token) return { success: false, error: "Authentication token not found." }

    try {
      setLoading(true)
      setError(null)

      // Transform fields to match the backend schema
      const transformedFields = fields.map(field => ({
        id: field.id,
        documentId: field.id,
        field_key: field.field_key,
        field_label: field.field_label,
        field_type: field.field_type,
        is_required: field.is_required,
        is_enabled: field.is_enabled,
        sort_order: field.sort_order,
        field_options: Array.isArray(field.field_options) && field.field_options.length > 0
          ? { options: field.field_options }
          : {},
        validation_rules: field.validation_rules || {}
      }))

      const response = await fetch(`${API_BASE_URL}/campaign/${campaign_id}/onboarding-fields/batch-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fields: transformedFields,
          delete_ids: deleteIds
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.detail || 'Failed to batch update fields')
      }

      const data = await response.json()
      
      // Update local state with the returned fields - no need to refresh!
      setFields(data.onboarding_fields || [])

      return {
        success: true,
        error_count: 0,
        success_count: data.total_count || 0,
        fields: data.onboarding_fields
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
        error_count: 1,
        success_count: 0
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (campaignId) {
      fetchFields(campaignId)
    } else {
      setLoading(false)
      setFields([])
      setError(null)
    }
  }, [campaignId])

  return {
    fields,
    loading,
    error,
    fetchFields,
    createField,
    updateField,
    deleteField,
    applyTemplate,
    reorderFields,
    batchUpdateFields,
  }
}
