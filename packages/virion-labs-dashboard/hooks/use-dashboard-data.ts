"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"

// Unified dashboard data types for the new API
export interface DashboardStats {
  primary: number
  secondary: number
  tertiary: number
  quaternary: number
  primaryLabel: string
  secondaryLabel: string
  tertiaryLabel: string
  quaternaryLabel: string
  conversionRate?: number
}

export interface DashboardListItem {
  id: string
  title: string
  subtitle: string
  value: number
  status: string
  metadata: Record<string, any>
  created: string
}

export interface DashboardActivity {
  id: string
  user: string
  action: string
  time: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface DashboardData {
  stats: DashboardStats
  primaryList: DashboardListItem[]
  secondaryList: DashboardListItem[]
  recentActivity: DashboardActivity[]
  metadata: {
    role: string
    permissions: string[]
    lastUpdated: string
  }
}

// API response types
interface ApiClient {
  id: number
  documentId?: string
  name: string
  industry: string
  website?: string | null
  primary_contact?: string | null
  contact_email?: string
  campaign_count: number
  client_status: string | null
  business_context?: {
    recommendation: string
    is_active: boolean
  }
  created_at?: string
  updated_at?: string
}

interface ApiClientListResponse {
  clients: ApiClient[]
  total_count: number
}

export interface UserSettings {
  id: string
  bio?: string
  phone_number?: string
  twitter_handle?: string
  instagram_handle?: string
  linkedin_handle?: string
  youtube_handle?: string
  tiktok_handle?: string
  twitch_handle?: string
  website_url?: string
  theme: string
  language: string
  timezone: string
  currency: string
  profile_visibility: string
  show_earnings: boolean
  show_referral_count: boolean
  email_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  security_alerts: boolean
  campaign_updates: boolean
  referral_notifications: boolean
  webhook_url?: string
  webhook_events: string[]
  two_factor_enabled: boolean
  login_notifications: boolean
  created_at: string
  updated_at: string
}

// Transform functions
const transformAdminData = (clientsData: ApiClient[]): DashboardData => {
  const totalClients = clientsData.length
  const activeClients = clientsData.filter(client =>
    client.client_status && client.client_status.toLowerCase() === 'active'
  ).length;
  const totalCampaigns = clientsData.reduce((sum, client) =>
    sum + (client.campaign_count || 0), 0
  )
  const totalInfluencers = 0;

  const stats: DashboardStats = {
    primary: totalClients,
    secondary: totalCampaigns,
    tertiary: totalInfluencers,
    quaternary: activeClients,
    primaryLabel: "Total Clients",
    secondaryLabel: "Total Campaigns",
    tertiaryLabel: "Total Influencers",
    quaternaryLabel: "Active Clients",
    conversionRate: totalClients > 0 ? Math.round((activeClients / totalClients) * 100 * 100) / 100 : 0
  }

  const primaryList: DashboardListItem[] = clientsData.slice(0, 10).map(client => ({
    id: client.documentId || client.id.toString(),
    title: client.name,
    subtitle: client.contact_email || client.industry,
    value: client.campaign_count || 0,
    status: client.client_status || 'inactive',
    metadata: {
      industry: client.industry,
      website: client.website
    },
    created: formatClientDate(client.created_at!)
  }))

  const recentActivity: DashboardActivity[] = clientsData
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    .slice(0, 5)
    .map(client => ({
      id: `client-${client.id}`,
      user: 'System',
      action: `New client "${client.name}" was added`,
      time: getTimeAgo(new Date(client.created_at!)),
      type: 'success' as const
    }))

  return {
    stats,
    primaryList,
    secondaryList: [], // Could be campaigns if we had campaign endpoints
    recentActivity,
    metadata: {
      role: 'admin',
      permissions: ['view_all', 'manage_clients', 'manage_campaigns'],
      lastUpdated: new Date().toISOString()
    }
  }
}

const transformInfluencerData = (userSettings: UserSettings): DashboardData => {
  const stats: DashboardStats = {
    primary: 0, // Would need referral links from API
    secondary: 0, // Would need conversions from API
    tertiary: 0, // Would need referrals from API
    quaternary: 0, // Would need campaigns from API
    primaryLabel: "Total Clicks",
    secondaryLabel: "Conversions",
    tertiaryLabel: "Total Referrals",
    quaternaryLabel: "Available Campaigns"
  }

  const primaryList: DashboardListItem[] = []
  const secondaryList: DashboardListItem[] = []
  const recentActivity: DashboardActivity[] = [
    {
      id: 'settings-update',
      user: 'You',
      action: 'Updated profile settings',
      time: getTimeAgo(new Date(userSettings.updated_at)),
      type: 'info'
    }
  ]

  return {
    stats,
    primaryList,
    secondaryList,
    recentActivity,
    metadata: {
      role: 'influencer',
      permissions: ['view_links', 'create_links', 'view_referrals'],
      lastUpdated: new Date().toISOString()
    }
  }
}

const transformClientData = (userSettings: UserSettings): DashboardData => {
  const stats: DashboardStats = {
    primary: 0, // Would need campaigns from API
    secondary: 0, // Would need influencers from API
    tertiary: 0, // Would need conversions from API
    quaternary: 0, // Would need active campaigns from API
    primaryLabel: "Total Campaigns",
    secondaryLabel: "Active Influencers",
    tertiaryLabel: "Total Conversions",
    quaternaryLabel: "Active Campaigns"
  }

  const primaryList: DashboardListItem[] = []
  const secondaryList: DashboardListItem[] = []
  const recentActivity: DashboardActivity[] = [
    {
      id: 'settings-update',
      user: 'You',
      action: 'Updated account settings',
      time: getTimeAgo(new Date(userSettings.updated_at)),
      type: 'info'
    }
  ]

  return {
    stats,
    primaryList,
    secondaryList,
    recentActivity,
    metadata: {
      role: 'client',
      permissions: ['view_campaigns', 'view_analytics'],
      lastUpdated: new Date().toISOString()
    }
  }
}

// Utility functions
const formatClientDate = (dateString: string): string => {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'N/A'
  
  // Check if date is too far in the past (before 2020) or future (after current year + 1)
  const currentYear = new Date().getFullYear()
  const dateYear = date.getFullYear()
  
  if (dateYear < 2020 || dateYear > currentYear + 1) return 'N/A'
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
}

// Main hook
export function useDashboardData() {
  const { user, profile, loading: authLoading } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "http://localhost:8000"
  const getToken = () => localStorage.getItem('auth_token')

  const fetchData = useCallback(async () => {
    if (!user || !profile || authLoading) {
      setLoading(false)
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

      let transformedData: DashboardData

      switch (profile.role) {
        case 'Platform Administrator':
        case 'admin': {
          // Fetch clients data for admin dashboard
          const clientsResponse = await fetch(`${API_BASE_URL}/api/v1/operations/client/list`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (!clientsResponse.ok) {
            const errorData = await clientsResponse.json()
            throw new Error(errorData.detail || 'Failed to fetch clients data')
          }

          const clientsData: ApiClientListResponse = await clientsResponse.json()
          transformedData = transformAdminData(clientsData.clients || [])
          break
        }

        case 'Influencer':
        case 'influencer': {
          // Fetch user settings for influencer dashboard
          const settingsResponse = await fetch(`${API_BASE_URL}/api/users/me/settings`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (!settingsResponse.ok) {
            const errorData = await settingsResponse.json()
            throw new Error(errorData.detail || 'Failed to fetch user settings')
          }

          const settingsData: UserSettings = await settingsResponse.json()
          transformedData = transformInfluencerData(settingsData)
          break
        }

        case 'client': {
          // Fetch user settings for client dashboard
          const settingsResponse = await fetch(`${API_BASE_URL}/api/users/me/settings`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (!settingsResponse.ok) {
            const errorData = await settingsResponse.json()
            throw new Error(errorData.detail || 'Failed to fetch user settings')
          }

          const settingsData: UserSettings = await settingsResponse.json()
          transformedData = transformClientData(settingsData)
          break
        }

        default:
          throw new Error(`Unsupported role: ${profile.role}`)
      }

      setData(transformedData)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id, profile?.role, authLoading])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    setError(null)
    setLoading(true)
    fetchData()
  }, [fetchData])

  return {
    data,
    loading: loading || authLoading,
    error,
    refetch,
    refresh: refetch
  }
}