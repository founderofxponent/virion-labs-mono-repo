"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"

// Analytics data interfaces matching the current analytics page expectations
export interface AnalyticsOverview {
  total_campaigns: number
  active_campaigns: number
  total_onboarding_starts: number
  total_onboarding_completions: number
  overall_completion_rate: number
  total_clients: number
  active_clients: number
  // The following are placeholders until the API provides them
  campaigns_last_30_days?: number
  new_clients_30_days?: number
  total_field_responses?: number
  responses_last_7_days?: number
  responses_last_30_days?: number
  total_interactions?: number
  unique_interaction_users?: number
  interactions_24h?: number
  total_referral_links?: number
  active_referral_links?: number
  total_clicks?: number
  total_conversions?: number
  click_through_rate?: number | null
}

export interface CampaignAnalytics {
  campaign_id: string
  name: string // Changed from campaign_name
  total_starts: number
  total_completions: number
  completion_rate: number
  // The following are placeholders until the API provides them
  client_name?: string
  total_fields?: number
  active_fields?: number
  required_fields?: number
  total_interactions?: number
  interactions_last_7_days?: number
  is_active?: boolean
  created_at?: string
}

export interface DailyMetrics {
  date: string
  campaigns_created?: number // Optional as it might not be in the new performance report
  users_started: number
  users_completed: number
  interactions?: number // Optional
  referral_clicks?: number // Optional
  new_users?: number // Optional
}

export interface ComprehensiveAnalyticsData {
  overview: AnalyticsOverview
  campaigns: CampaignAnalytics[]
}

// API response interfaces for the new unified API
interface ApiAnalyticsResponse {
  overview: AnalyticsOverview
  campaigns: CampaignAnalytics[]
  dailyMetrics?: DailyMetrics[]
}

export function useAnalytics() {
  const { user, profile } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<ComprehensiveAnalyticsData | null>(null)
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "http://localhost:8000/api/v1/operations"

  const getToken = () => localStorage.getItem('auth_token')

  const fetchAnalytics = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      setLoading(false)
      return
    }

    if (!user?.id || !profile?.role) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Use the new unified API analytics dashboard endpoint
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch analytics')
      }
      
      const data: ApiAnalyticsResponse = await response.json()
      
      setAnalyticsData({
        overview: data.overview,
        campaigns: data.campaigns
      })
      
      // We will now fetch daily metrics from the dedicated performance report endpoint
      // This call can happen in parallel for efficiency in the future, but for now, it's sequential
      const performanceResponse = await fetch(`${API_BASE_URL}/analytics/performance-report?timeframe=30d`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        setDailyMetrics(performanceData.daily_metrics || []);
      }

    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [user?.id, profile?.role])

  // Fetch ROI analytics for clients/admin
  const fetchROIAnalytics = useCallback(async () => {
    const token = getToken()
    if (!token) return { data: null, error: "Authentication token not found." }

    try {
      const response = await fetch(`${API_BASE_URL}/analytics/roi`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch ROI analytics')
      }
      
      const data = await response.json()
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error: errorMessage }
    }
  }, [])

  // Fetch performance report
  const fetchPerformanceReport = useCallback(async (timeframe?: string) => {
    const token = getToken()
    if (!token) return { data: null, error: "Authentication token not found." }

    try {
      const params = timeframe ? `?timeframe=${timeframe}` : ''
      const response = await fetch(`${API_BASE_URL}/analytics/performance-report${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch performance report')
      }
      
      const data = await response.json()
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error: errorMessage }
    }
  }, [])

  // Fetch influencer-specific metrics (for influencer role)
  const fetchInfluencerMetrics = useCallback(async () => {
    const token = getToken()
    if (!token) return { data: null, error: "Authentication token not found." }

    try {
      const response = await fetch(`${API_BASE_URL}/analytics/influencer-metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch influencer metrics')
      }
      
      const data = await response.json()
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error: errorMessage }
    }
  }, [])

  // Utility functions
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatPercentage = (value: number | null | undefined) => {
    if (typeof value !== 'number' || !isFinite(value)) {
      return "0.0%"
    }
    return `${value.toFixed(1)}%`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get analytics stats for summary cards
  const getAnalyticsStats = () => {
    if (!analyticsData) return null
    
    const { overview } = analyticsData
    return {
      totalClients: overview.total_clients,
      activeClients: overview.active_clients,
      totalCampaigns: overview.total_campaigns,
      activeCampaigns: overview.active_campaigns,
      totalUsersStarted: overview.total_onboarding_starts,
      totalUsersCompleted: overview.total_onboarding_completions,
      completionRate: overview.overall_completion_rate,
      totalInteractions: overview.total_interactions || 0,
      clientGrowthRate: overview.new_clients_30_days || 0,
      campaignGrowthRate: overview.campaigns_last_30_days || 0
    }
  }

  useEffect(() => {
    if (user && profile) {
      fetchAnalytics()
    }
  }, [user, profile, fetchAnalytics])

  return {
    analyticsData,
    dailyMetrics,
    loading,
    error,
    refreshAnalytics: fetchAnalytics,
    fetchROIAnalytics,
    fetchPerformanceReport,
    fetchInfluencerMetrics,
    formatNumber,
    formatPercentage,
    formatDate,
    getAnalyticsStats
  }
}