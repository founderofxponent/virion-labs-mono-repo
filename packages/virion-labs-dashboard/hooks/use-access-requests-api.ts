"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"

// TODO: Define the new API-based types for access requests
export interface AccessRequest {
  id: string
  campaign_id: string
  influencer_id: string
  request_status: string
  requested_at: string
  request_message: string
  access_granted_at: string | null
  access_granted_by: string | null
  admin_response: string | null
  discord_guild_campaigns: {
    id: string
    campaign_name: string
    campaign_type: string
    clients: {
      name: string
      industry: string
    }
  }
  user_profiles: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export function useAccessRequestsApi() {
  const { user, profile } = useAuth()
  const isAdmin = profile?.role === "admin" || profile?.role === "Platform Administrator"
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "http://localhost:8000"
  const getToken = () => localStorage.getItem('auth_token')

  const fetchRequests = useCallback(async () => {
    if (!user || !isAdmin) {
      setLoading(false)
      setRequests([])
      return
    }

    setLoading(true)
    setError(null)
    const token = getToken()

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/access-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch access requests')
      }
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAdmin) {
      fetchRequests()
    }
  }, [fetchRequests, isAdmin])

  const approveRequest = useCallback(async (requestId: string) => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/access-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to approve access request')
      }

      // Refetch the list to reflect the updated status
      fetchRequests()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }, [fetchRequests])

  const denyRequest = useCallback(async (requestId: string) => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/access-requests/${requestId}/deny`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to deny access request')
      }

      // Refetch the list to reflect the updated status
      fetchRequests()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }, [fetchRequests])

  return {
    requests,
    approveRequest,
    denyRequest,
    loading,
    error,
    refetch: fetchRequests,
  }
}