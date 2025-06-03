"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import type { Database } from "@/lib/supabase"

// Unified data types
export interface UnifiedStats {
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

export interface UnifiedListItem {
  id: string
  title: string
  subtitle: string
  value: number
  status: string
  metadata: Record<string, any>
  created: string
}

export interface UnifiedActivity {
  id: string
  user: string
  action: string
  time: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface UnifiedData {
  stats: UnifiedStats
  primaryList: UnifiedListItem[]
  secondaryList: UnifiedListItem[]
  recentActivity: UnifiedActivity[]
  metadata: {
    role: string
    permissions: string[]
    lastUpdated: string
  }
}

// Data transformers for each role
const transformInfluencerData = (linksData: any[], referralsData: any[]): UnifiedData => {
  const totalClicks = linksData.reduce((sum, link) => sum + (link.clicks || 0), 0)
  const totalConversions = linksData.reduce((sum, link) => sum + (link.conversions || 0), 0)
  const totalEarnings = linksData.reduce((sum, link) => sum + parseFloat(String(link.earnings || '0')), 0)
  const activeLinks = linksData.filter(link => (link.clicks || 0) > 0).length

  const stats: UnifiedStats = {
    primary: totalClicks,
    secondary: totalConversions,
    tertiary: totalEarnings,
    quaternary: activeLinks,
    primaryLabel: "Total Clicks",
    secondaryLabel: "Conversions",
    tertiaryLabel: "Earnings",
    quaternaryLabel: "Active Links",
    conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
  }

  const primaryList: UnifiedListItem[] = linksData.slice(0, 10).map(link => ({
    id: link.id,
    title: link.title,
    subtitle: link.platform,
    value: link.clicks || 0,
    status: (link.clicks || 0) > 0 ? 'active' : 'inactive',
    metadata: {
      conversions: link.conversions || 0,
      earnings: parseFloat(String(link.earnings || '0')),
      url: link.referral_url
    },
    created: new Date(link.created_at).toLocaleDateString()
  }))

  const secondaryList: UnifiedListItem[] = referralsData.slice(0, 10).map(referral => ({
    id: referral.id,
    title: referral.name,
    subtitle: referral.email,
    value: parseFloat(String(referral.conversion_value || '0')),
    status: referral.status,
    metadata: {
      source: referral.source_platform,
      referralLink: referral.referral_links?.title || 'Unknown'
    },
    created: new Date(referral.created_at).toLocaleDateString()
  }))

  const recentActivity: UnifiedActivity[] = referralsData.slice(0, 5).map(referral => ({
    id: referral.id,
    user: referral.name,
    action: referral.status === 'completed' 
      ? `Completed purchase - $${parseFloat(String(referral.conversion_value || '0')).toFixed(2)}`
      : `${referral.status === 'active' ? 'Signed up' : 'Clicked'} via ${referral.source_platform}`,
    time: getTimeAgo(new Date(referral.created_at)),
    type: referral.status === 'completed' ? 'success' : 'info'
  }))

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

const transformAdminData = (clientsData: any[], botsData: any[], usersData: any[]): UnifiedData => {
  const totalClients = clientsData.length
  const totalBots = botsData.length
  const totalUsers = usersData.length
  const activeBots = botsData.filter(bot => bot.status === 'Online').length

  const stats: UnifiedStats = {
    primary: totalClients,
    secondary: totalBots,
    tertiary: totalUsers,
    quaternary: activeBots,
    primaryLabel: "Total Clients",
    secondaryLabel: "Total Bots",
    tertiaryLabel: "Total Users",
    quaternaryLabel: "Active Bots"
  }

  const primaryList: UnifiedListItem[] = clientsData.slice(0, 10).map(client => ({
    id: client.id,
    title: client.name,
    subtitle: client.contact_email || 'No contact',
    value: client.bots || 0,
    status: client.status || 'active',
    metadata: {
      influencers: client.influencers || 0,
      createdAt: client.created_at
    },
    created: new Date(client.created_at || new Date()).toLocaleDateString()
  }))

  const secondaryList: UnifiedListItem[] = botsData.slice(0, 10).map(bot => ({
    id: bot.id,
    title: bot.name,
    subtitle: bot.clients?.name || 'Unknown Client',
    value: bot.servers || 0,
    status: bot.status === 'Online' ? 'active' : 'inactive',
    metadata: {
      users: bot.users || 0,
      commands: bot.commands_used || 0,
      uptime: bot.uptime_percentage || 0
    },
    created: new Date(bot.created_at || new Date()).toLocaleDateString()
  }))

  const recentActivity: UnifiedActivity[] = [
    ...clientsData.slice(0, 3).map(client => ({
      id: `client-${client.id}`,
      user: 'System',
      action: `New client "${client.name}" was added`,
      time: getTimeAgo(new Date(client.created_at || new Date())),
      type: 'success' as const
    })),
    ...botsData.slice(0, 2).map(bot => ({
      id: `bot-${bot.id}`,
      user: 'System',
      action: `Bot "${bot.name}" was deployed`,
      time: getTimeAgo(new Date(bot.created_at || new Date())),
      type: 'info' as const
    }))
  ].slice(0, 5)

  return {
    stats,
    primaryList,
    secondaryList,
    recentActivity,
    metadata: {
      role: 'admin',
      permissions: ['view_all', 'manage_clients', 'manage_bots', 'manage_users'],
      lastUpdated: new Date().toISOString()
    }
  }
}

const transformClientData = (campaignsData: any[], influencersData: any[], conversionsData: any[]): UnifiedData => {
  const totalCampaigns = campaignsData.length
  const activeInfluencers = new Set(conversionsData.map(c => c.influencer_id)).size
  const totalConversions = conversionsData.length
  const totalRevenue = campaignsData.reduce((sum, campaign) => sum + parseFloat(String(campaign.earnings || '0')), 0)

  const stats: UnifiedStats = {
    primary: totalCampaigns,
    secondary: activeInfluencers,
    tertiary: totalConversions,
    quaternary: Math.round(totalRevenue),
    primaryLabel: "Campaigns",
    secondaryLabel: "Active Influencers",
    tertiaryLabel: "Conversions",
    quaternaryLabel: "Revenue ($)"
  }

  const primaryList: UnifiedListItem[] = campaignsData.slice(0, 10).map(campaign => ({
    id: campaign.id,
    title: campaign.title,
    subtitle: campaign.platform,
    value: campaign.conversions || 0,
    status: (campaign.conversions || 0) > 0 ? 'active' : 'inactive',
    metadata: {
      clicks: campaign.clicks || 0,
      earnings: parseFloat(String(campaign.earnings || '0')),
      influencer: campaign.influencer_name || 'Unknown'
    },
    created: new Date(campaign.created_at).toLocaleDateString()
  }))

  const secondaryList: UnifiedListItem[] = influencersData.slice(0, 10).map(influencer => ({
    id: influencer.id,
    title: influencer.full_name,
    subtitle: influencer.email,
    value: influencer.conversions || 0,
    status: (influencer.conversions || 0) > 0 ? 'active' : 'inactive',
    metadata: {
      role: influencer.role,
      joinDate: influencer.created_at
    },
    created: new Date(influencer.created_at).toLocaleDateString()
  }))

  const recentActivity: UnifiedActivity[] = conversionsData.slice(0, 5).map(conversion => ({
    id: conversion.id,
    user: conversion.name,
    action: `Completed conversion - $${parseFloat(String(conversion.conversion_value || '0')).toFixed(2)}`,
    time: getTimeAgo(new Date(conversion.created_at)),
    type: 'success'
  }))

  return {
    stats,
    primaryList,
    secondaryList,
    recentActivity,
    metadata: {
      role: 'client',
      permissions: ['view_campaigns', 'view_influencers', 'view_analytics'],
      lastUpdated: new Date().toISOString()
    }
  }
}

// Utility function
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
export function useUnifiedData() {
  const { user, profile, loading: authLoading } = useAuth()
  const [data, setData] = useState<UnifiedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isExecutingRef = useRef(false)

  const fetchData = useCallback(async (retryCount = 0) => {
    if (!user || !profile || authLoading || isExecutingRef.current) {
      return
    }

    console.log(`🔄 Fetching unified data for ${profile.role}...`)
    isExecutingRef.current = true

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⏰ Unified data fetch timeout (10s), setting error state')
      if (!signal.aborted) {
        abortControllerRef.current?.abort()
        setError('Data loading timed out after 10 seconds. Please try refreshing.')
        setData(null)
        setLoading(false)
        isExecutingRef.current = false
      }
    }, 10000) // 10 second timeout

    try {
      setLoading(true)
      setError(null)

      let transformedData: UnifiedData

      switch (profile.role) {
        case 'influencer': {
          const [linksResponse, referralsResponse] = await Promise.all([
            supabase
              .from('referral_links')
              .select('*')
              .eq('influencer_id', user.id)
              .order('created_at', { ascending: false })
              .limit(50),
            
            supabase
              .from('referrals')
              .select(`
                *,
                referral_links!inner(title, platform)
              `)
              .eq('influencer_id', user.id)
              .order('created_at', { ascending: false })
              .limit(100)
          ])

          if (linksResponse.error) throw linksResponse.error
          if (referralsResponse.error) throw referralsResponse.error

          transformedData = transformInfluencerData(
            linksResponse.data || [],
            referralsResponse.data || []
          )
          break
        }

        case 'admin': {
          const [clientsResponse, botsResponse, usersResponse] = await Promise.all([
            supabase
              .from('clients')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50),

            supabase
              .from('bots')
              .select(`
                *,
                clients!inner(name)
              `)
              .order('created_at', { ascending: false })
              .limit(50),

            supabase
              .from('user_profiles')
              .select('id, role, created_at')
              .limit(1000)
          ])

          if (clientsResponse.error) throw clientsResponse.error
          if (botsResponse.error) throw botsResponse.error
          if (usersResponse.error) throw usersResponse.error

          transformedData = transformAdminData(
            clientsResponse.data || [],
            botsResponse.data || [],
            usersResponse.data || []
          )
          break
        }

        case 'client': {
          // For clients, we'll fetch referral links as campaigns and related data
          const [campaignsResponse, usersResponse, conversionsResponse] = await Promise.all([
            supabase
              .from('referral_links')
              .select('*')
              .order('conversions', { ascending: false })
              .limit(50),

            supabase
              .from('user_profiles')
              .select('*')
              .eq('role', 'influencer')
              .limit(50),

            supabase
              .from('referrals')
              .select('*')
              .eq('status', 'completed')
              .order('created_at', { ascending: false })
              .limit(100)
          ])

          if (campaignsResponse.error) throw campaignsResponse.error
          if (usersResponse.error) throw usersResponse.error
          if (conversionsResponse.error) throw conversionsResponse.error

          transformedData = transformClientData(
            campaignsResponse.data || [],
            usersResponse.data || [],
            conversionsResponse.data || []
          )
          break
        }

        default:
          throw new Error(`Unsupported role: ${profile.role}`)
      }

      if (!signal.aborted) {
        setData(transformedData)
        console.log(`✅ Unified data loaded for ${profile.role}`)
      }

    } catch (err) {
      clearTimeout(timeoutId)
      if (abortControllerRef.current?.signal.aborted) {
        console.log('🛑 Request was aborted, ignoring error')
        return
      }

      console.error('💥 Error fetching unified data:', err)
      
      // Check if this is a backend limitation or network error
      const isBackendLimitation = err instanceof Error && (
        err.message.includes('JWT') ||
        err.message.includes('permission') ||
        err.message.includes('unauthorized') ||
        err.message.includes('forbidden') ||
        err.message.includes('rate limit') ||
        err.message.includes('quota')
      )

      if (isBackendLimitation) {
        console.log('🔄 Backend limitation detected, setting error state')
        setError(`Backend error: ${err.message}. Please try again later.`)
        setData(null)
        setLoading(false)
        isExecutingRef.current = false
        return
      }
      
      // Retry logic for network errors
      if (retryCount < 2 && (err instanceof Error && (
        err.message.includes('network') || 
        err.message.includes('timeout') ||
        err.message.includes('fetch')
      ))) {
        console.log(`🔄 Retrying unified data fetch (attempt ${retryCount + 1})`)
        setTimeout(() => fetchData(retryCount + 1), 1000 * (retryCount + 1))
        return
      }
      
      // If all else fails, try fallback data
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setData(null)
    } finally {
      clearTimeout(timeoutId)
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false)
      }
      isExecutingRef.current = false
    }
  }, [user?.id, profile?.role, authLoading])

  useEffect(() => {
    if (!user || !profile || authLoading) {
      setLoading(false)
      setData(null)
      setError(null)
      return
    }

    fetchData()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      isExecutingRef.current = false
    }
  }, [fetchData])

  const refetch = useCallback(() => {
    setError(null)
    setLoading(true)
    fetchData(0)
  }, [fetchData])

  return {
    data,
    loading: loading || authLoading,
    error,
    refetch,
    refresh: refetch
  }
} 