"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"
import { InfluencerMetrics } from "@/schemas/referral"

export function useInfluencerMetricsApi() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<InfluencerMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "http://localhost:8000/api/v1/analytics"

  const getToken = () => localStorage.getItem('auth_token')

  const fetchMetrics = useCallback(async () => {
    const token = getToken()
    if (!token || !user) {
      setError("Authentication token or user not found.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/influencer-metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch influencer metrics')
      }
      
      const data: InfluencerMetrics = await response.json()
      setMetrics(data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchMetrics()
    }
  }, [user, fetchMetrics])

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics
  }
}