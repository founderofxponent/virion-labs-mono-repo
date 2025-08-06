"use client"

import { useState, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"

interface TrackingStats {
  id: number
  documentId: string
  referral_code: string
  title: string
  platform: string
  clicks: number
  conversions: number
  earnings: number
  conversion_rate: number
  referral_url: string
  original_url: string
  last_click_at?: string
  last_conversion_at?: string
  created_at?: string
  is_active: boolean
}

export function useTrackingStats() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  const getToken = () => localStorage.getItem('auth_token')

  const fetchStats = useCallback(async (referralCode: string): Promise<TrackingStats | null> => {
    if (!user) {
      return null
    }

    setLoading(true)
    setError(null)
    const token = getToken()

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tracking/stats/${referralCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Referral link not found')
        }
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch tracking stats')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [user, API_BASE_URL])

  const fetchMultipleStats = useCallback(async (referralCodes: string[]): Promise<(TrackingStats | null)[]> => {
    if (!user || referralCodes.length === 0) {
      return []
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch stats for all referral codes in parallel
      const statsPromises = referralCodes.map(code => fetchStats(code))
      const results = await Promise.allSettled(statsPromises)
      
      return results.map(result => 
        result.status === 'fulfilled' ? result.value : null
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      return []
    } finally {
      setLoading(false)
    }
  }, [user, fetchStats])

  const refreshStats = useCallback(async (referralCode: string): Promise<TrackingStats | null> => {
    // Force a fresh fetch by bypassing any caching
    return fetchStats(referralCode)
  }, [fetchStats])

  return {
    fetchStats,
    fetchMultipleStats,
    refreshStats,
    loading,
    error
  }
}