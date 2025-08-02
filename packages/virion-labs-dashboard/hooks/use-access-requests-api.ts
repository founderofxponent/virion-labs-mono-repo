"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"

// TODO: Define the new API-based types for access requests
interface MediaFile {
  id: number
  url: string
  name: string
  alternativeText?: string
  caption?: string
  width?: number
  height?: number
  formats?: any
  hash: string
  ext: string
}

interface UserProfile {
  id: number
  username: string
  email: string
  full_name?: string
  avatar_url?: MediaFile
}

interface CampaignInfo {
  id: number
  name: string
  description?: string
  campaign_type?: string
  is_active: boolean
  start_date?: string
  end_date?: string
  guild_id?: string
}

export interface AccessRequest {
  id: number
  documentId: string
  campaign_id: number
  user_id: number
  request_status: string
  requested_at: string | null
  request_message: string
  access_granted_at: string | null
  admin_response: string | null
  is_active: boolean
  user?: UserProfile
  campaign?: CampaignInfo
}

export function useAccessRequestsApi() {
  const { user, profile } = useAuth()
  const role = profile?.role
  let roleName: string | undefined | null = null
  if (role) {
    if (typeof role === 'string') {
      roleName = role
    } else {
      roleName = role.name
    }
  }
  const isAdmin = roleName === "admin" || roleName === "Platform Administrator"
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
      const response = await fetch(`${API_BASE_URL}/api/v1/operations/campaign/access-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch access requests')
      }
      const data = await response.json()
      setRequests(data.access_requests || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [user, isAdmin])

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
      const response = await fetch(`${API_BASE_URL}/api/v1/operations/campaign/access-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_status: 'approved',
          admin_response: 'Access request approved',
          is_active: true
        })
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
      const response = await fetch(`${API_BASE_URL}/api/v1/operations/campaign/access-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_status: 'denied',
          admin_response: 'Access request denied',
          is_active: false
        })
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