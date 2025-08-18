"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"
import { ReferralLink } from "@/schemas/referral"

export function useReferralLinkManager() {
  const { user } = useAuth()
  const [links, setLinks] = useState<ReferralLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const getToken = () => localStorage.getItem('auth_token')

  const fetchLinks = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const token = getToken()

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/influencer/referral-links`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch referral links')
      }
      const data = await response.json()
      setLinks(data.links || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  const addLink = useCallback(async (linkData: Omit<ReferralLink, 'id' | 'clicks' | 'conversions'>) => {
    const token = getToken()
    if (!token) {
      const error = "Authentication token not found."
      setError(error)
      return { data: null, error }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/influencer/referral-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(linkData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to create referral link')
      }

      fetchLinks()
      return { data: result.link, error: null }

    } catch (err) {
      const error = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(error)
      return { data: null, error }
    }
  }, [fetchLinks])

  const updateLink = useCallback(async (linkId: string, linkData: Partial<ReferralLink>) => {
    const token = getToken()
    if (!token) {
      const error = "Authentication token not found."
      setError(error)
      return { data: null, error }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/influencer/referral-links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(linkData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to update referral link')
      }

      fetchLinks()
      return { data: result.link, error: null }

    } catch (err) {
      const error = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(error)
      return { data: null, error }
    }
  }, [fetchLinks])

  const deleteLink = useCallback(async (linkId: string) => {
    const token = getToken()
    if (!token) {
      const error = "Authentication token not found."
      setError(error)
      throw new Error(error)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/influencer/referral-links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete referral link')
      }

      // Refetch the list to reflect the deletion
      fetchLinks()

    } catch (err) {
      const error = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(error)
      throw err
    }
  }, [fetchLinks])

  return {
    links,
    addLink,
    updateLink,
    deleteLink,
    loading,
    error,
    refetch: fetchLinks,
  }
}