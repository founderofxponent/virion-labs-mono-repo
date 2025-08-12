import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'

export interface OnboardingField {
  id: string
  documentId: string
  field_key: string
  field_label: string
  field_type: 'text' | 'email' | 'number' | 'boolean' | 'url' | 'multiselect'
  field_options?: { options?: string[] }
  is_required: boolean
  is_enabled: boolean
  sort_order: number
  validation_rules?: any
}

export interface OnboardingResponse {
  id: string
  documentId: string
  discord_user_id: string
  discord_username: string
  field_key: string
  field_value: string
  interaction_id?: string
}

export interface UserResponse {
  discord_user_id: string
  discord_username: string
  responses: Record<string, string>
  completion_status: 'complete' | 'partial' | 'started'
  completed_fields: number
  total_fields: number
  first_response?: string
  latest_response?: string
}

export function useCampaignResponses(campaignId: string) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<OnboardingField[]>([])
  const [responses, setResponses] = useState<OnboardingResponse[]>([])

  // Get token from localStorage like other hooks do
  const getToken = useCallback(() => localStorage.getItem('auth_token'), [])
  const token = getToken()


  const fetchData = async () => {
    if (!campaignId) return

    try {
      setLoading(true)
      setError(null)

      if (!token) {
        throw new Error('No authentication token available')
      }

      // Use direct API base URL like other hooks
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Fetch both fields and responses in parallel
      const [fieldsResponse, responsesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/operations/campaign/${campaignId}/onboarding-fields`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/api/v1/operations/onboarding/responses?campaign_id=${campaignId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ])

      if (!fieldsResponse.ok || !responsesResponse.ok) {
        throw new Error('Failed to fetch campaign response data')
      }

      const fieldsData = await fieldsResponse.json()
      const responsesData = await responsesResponse.json()

      setFields(fieldsData.onboarding_fields || [])
      setResponses(responsesData.responses || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaign responses'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token && campaignId) {
      fetchData()
    }
  }, [token, campaignId])

  // Transform flat responses into user-grouped data
  const userResponses = useMemo((): UserResponse[] => {
    if (!fields.length || !responses.length) return []

    const userMap = new Map<string, UserResponse>()
    const enabledFields = fields.filter(f => f.is_enabled)
    const totalFields = enabledFields.length

    // Initialize users from responses
    responses.forEach(response => {
      if (!userMap.has(response.discord_user_id)) {
        userMap.set(response.discord_user_id, {
          discord_user_id: response.discord_user_id,
          discord_username: response.discord_username,
          responses: {},
          completion_status: 'started',
          completed_fields: 0,
          total_fields: totalFields,
        })
      }

      const user = userMap.get(response.discord_user_id)!
      user.responses[response.field_key] = response.field_value
    })

    // Calculate completion status for each user
    userMap.forEach(user => {
      user.completed_fields = Object.keys(user.responses).length
      
      if (user.completed_fields === 0) {
        user.completion_status = 'started'
      } else if (user.completed_fields === totalFields) {
        user.completion_status = 'complete'
      } else {
        user.completion_status = 'partial'
      }
    })

    return Array.from(userMap.values())
  }, [fields, responses])

  // Field analysis data
  const fieldAnalysis = useMemo(() => {
    const analysis = new Map<string, {
      field: OnboardingField
      responses: { value: string; count: number; users: string[] }[]
      totalResponses: number
      responseRate: number
    }>()

    fields.filter(f => f.is_enabled).forEach(field => {
      const fieldResponses = responses.filter(r => r.field_key === field.field_key)
      const valueMap = new Map<string, string[]>()

      fieldResponses.forEach(response => {
        if (!valueMap.has(response.field_value)) {
          valueMap.set(response.field_value, [])
        }
        valueMap.get(response.field_value)!.push(response.discord_username)
      })

      const responseData = Array.from(valueMap.entries()).map(([value, users]) => ({
        value,
        count: users.length,
        users
      })).sort((a, b) => b.count - a.count)

      analysis.set(field.field_key, {
        field,
        responses: responseData,
        totalResponses: fieldResponses.length,
        responseRate: userResponses.length > 0 ? (fieldResponses.length / userResponses.length) * 100 : 0
      })
    })

    return analysis
  }, [fields, responses, userResponses])

  const stats = useMemo(() => {
    const totalUsers = userResponses.length
    const completedUsers = userResponses.filter(u => u.completion_status === 'complete').length
    const completionRate = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0

    return {
      totalResponses: totalUsers,
      completedResponses: completedUsers,
      partialResponses: userResponses.filter(u => u.completion_status === 'partial').length,
      completionRate,
      totalFields: fields.filter(f => f.is_enabled).length,
    }
  }, [userResponses, fields])

  return {
    loading,
    error,
    fields,
    responses,
    userResponses,
    fieldAnalysis,
    stats,
    refetch: fetchData
  }
}