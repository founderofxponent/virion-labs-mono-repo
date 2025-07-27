'use client'

import { useState, useEffect } from 'react'
import { OnboardingField, CreateOnboardingFieldData, UpdateOnboardingFieldData } from './use-onboarding-fields'

export function useOnboardingFieldsAPI(campaignId?: string) {
  const [fields, setFields] = useState<OnboardingField[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const API_BASE_URL = "http://localhost:8000/api/v1/operations"

  const getToken = () => localStorage.getItem('auth_token')

  const fetchFields = async (campaign_id?: string) => {
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
      setFields(data.fields || [])
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
      const response = await fetch(`${API_BASE_URL}/campaign/onboarding-fields/${fieldData.campaign_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(fieldData),
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
      const response = await fetch(`${API_BASE_URL}/campaign/onboarding-fields/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update field')
      }

      const data = await response.json()
      
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
    // This will require a new endpoint
    return { success: false, error: "Not implemented" }
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

  const reorderFields = async (reorderedFields: OnboardingField[]) => {
    // This will require a new endpoint
    return { success: false, error: "Not implemented" }
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
  }
}
