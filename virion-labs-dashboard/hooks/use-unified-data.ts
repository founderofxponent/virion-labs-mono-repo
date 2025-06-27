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
const transformInfluencerData = (linksData: any[], referralsData: any[], campaignsData: any[]): UnifiedData => {
  const totalClicks = linksData.reduce((sum, link) => sum + (link.clicks || 0), 0)
  const totalConversions = linksData.reduce((sum, link) => sum + (link.conversions || 0), 0)
  const activeLinks = linksData.filter(link => link.is_active).length
  const totalReferrals = referralsData.length

  const stats: UnifiedStats = {
    primary: totalClicks,
    secondary: totalConversions,
    tertiary: totalReferrals,
    quaternary: campaignsData.length,
    primaryLabel: "Total Clicks",
    secondaryLabel: "Conversions",
    tertiaryLabel: "Total Referrals",
    quaternaryLabel: "Available Campaigns",
    conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
  }

  const primaryList: UnifiedListItem[] = linksData.slice(0, 10).map(link => ({
    id: link.id,
    title: link.title,
    subtitle: link.platform,
    value: link.clicks || 0,
    status: link.is_active ? 'active' : 'inactive',
    metadata: {
      conversions: link.conversions || 0,
      conversionRate: link.conversion_rate || 0,
      url: link.referral_url,
      campaign: link.discord_guild_campaigns?.campaign_name || 'Independent'
    },
    created: new Date(link.created_at).toLocaleDateString()
  }))

  const secondaryList: UnifiedListItem[] = campaignsData.slice(0, 10).map(campaign => ({
    id: campaign.id,
    title: campaign.campaign_name,
    subtitle: campaign.client_name,
    value: 0, // Could be estimated earnings or participants
    status: campaign.is_active ? 'active' : 'inactive',
    metadata: {
      type: campaign.campaign_type,
      endDate: campaign.campaign_end_date,
      requirements: campaign.requirements || []
    },
    created: new Date(campaign.campaign_start_date || campaign.created_at).toLocaleDateString()
  }))

  const recentActivity: UnifiedActivity[] = [
    ...referralsData.slice(0, 3).map(referral => ({
      id: referral.id,
      user: referral.name,
      action: referral.status === 'completed' 
        ? `Completed purchase - $${parseFloat(String(referral.conversion_value || '0')).toFixed(2)}`
        : `${referral.status === 'active' ? 'Signed up' : 'Clicked'} via ${referral.source_platform}`,
      time: getTimeAgo(new Date(referral.created_at)),
      type: referral.status === 'completed' ? 'success' : 'info'
    } as UnifiedActivity)),
    ...campaignsData.slice(0, 2).map(campaign => ({
      id: `campaign-${campaign.id}`,
      user: 'System',
      action: `New campaign "${campaign.campaign_name}" available`,
      time: getTimeAgo(new Date(campaign.created_at)),
      type: 'info'
    } as UnifiedActivity))
  ].slice(0, 5)

  return {
    stats,
    primaryList,
    secondaryList,
    recentActivity,
    metadata: {
      role: 'influencer',
      permissions: ['view_links', 'create_links', 'view_referrals', 'view_campaigns'],
      lastUpdated: new Date().toISOString()
    }
  }
}

const transformAdminData = (
  clientsData: any[], 
  campaignsData: any[], 
  onboardingStartsData: any[], 
  onboardingCompletionsData: any[]
): UnifiedData => {
  const totalClients = clientsData.length;
  const totalCampaigns = campaignsData.length;
  const usersStarted = onboardingStartsData.length;
  
  const uniqueCompletions = new Set(onboardingCompletionsData.map(c => c.discord_user_id));
  const completionRate = usersStarted > 0 ? (uniqueCompletions.size / usersStarted) * 100 : 0;

  const totalInteractions = campaignsData.reduce((sum, campaign) => sum + (campaign.total_interactions || 0), 0);

  const stats: UnifiedStats = {
    primary: totalClients,
    secondary: totalCampaigns,
    tertiary: usersStarted,
    quaternary: totalInteractions,
    primaryLabel: "Total Clients",
    secondaryLabel: "Total Campaigns",
    tertiaryLabel: "Users Started",
    quaternaryLabel: "Total Interactions",
    conversionRate: completionRate
  };

  const primaryList: UnifiedListItem[] = clientsData.slice(0, 10).map(client => ({
    id: client.id,
    title: client.name,
    subtitle: client.contact_email || 'No contact',
    value: campaignsData.filter(campaign => campaign.client_id === client.id).length,
    status: client.status || 'active',
    metadata: {
      influencers: client.influencers || 0,
      createdAt: client.created_at,
      campaigns: campaignsData.filter(campaign => campaign.client_id === client.id).length
    },
    created: new Date(client.created_at || new Date()).toLocaleDateString()
  }))

  const secondaryList: UnifiedListItem[] = campaignsData.slice(0, 10).map(campaign => ({
    id: campaign.id,
    title: campaign.campaign_name,
    subtitle: campaign.clients?.name || 'Unknown Client',
    value: campaign.total_interactions || 0,
    status: campaign.is_active ? 'active' : 'inactive',
    metadata: {
      type: campaign.campaign_type,
      conversions: campaign.referral_conversions || 0,
      onboardings: campaign.successful_onboardings || 0,
      guildId: campaign.guild_id
    },
    created: new Date(campaign.created_at || new Date()).toLocaleDateString()
  }))

  const recentActivity: UnifiedActivity[] = [
    ...clientsData.slice(0, 3).map(client => ({
      id: `client-${client.id}`,
      user: 'System',
      action: `New client "${client.name}" was added`,
      time: getTimeAgo(new Date(client.created_at || new Date())),
      type: 'success' as const
    })),
    ...campaignsData.slice(0, 2).map(campaign => ({
      id: `campaign-${campaign.id}`,
      user: 'System',
      action: `Campaign "${campaign.campaign_name}" was ${campaign.is_active ? 'activated' : 'created'}`,
      time: getTimeAgo(new Date(campaign.created_at || new Date())),
      type: campaign.is_active ? 'success' as const : 'info' as const
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
  const totalCampaigns = campaignsData.length;
  const activeInfluencers = new Set(conversionsData.map(c => c.influencer_id)).size;
  const totalConversions = conversionsData.length;
  const activeCampaigns = campaignsData.filter(campaign => campaign.is_active).length;

  const stats: UnifiedStats = {
    primary: totalCampaigns,
    secondary: activeInfluencers,
    tertiary: totalConversions,
    quaternary: activeCampaigns,
    primaryLabel: "Total Campaigns",
    secondaryLabel: "Active Influencers",
    tertiaryLabel: "Total Conversions",
    quaternaryLabel: "Active Campaigns"
  };

  const primaryList: UnifiedListItem[] = campaignsData.slice(0, 10).map(campaign => ({
    id: campaign.id,
    title: campaign.campaign_name,
    subtitle: campaign.campaign_type,
    value: campaign.total_interactions || 0,
    status: campaign.is_active ? 'active' : 'inactive',
    metadata: {
      conversions: campaign.referral_conversions || 0,
      onboardings: campaign.successful_onboardings || 0,
      guildId: campaign.guild_id
    },
    created: new Date(campaign.created_at).toLocaleDateString()
  }));

  const secondaryList: UnifiedListItem[] = influencersData.slice(0, 10).map(influencer => ({
    id: influencer.id,
    title: influencer.full_name,
    subtitle: influencer.email,
    value: conversionsData.filter(c => c.influencer_id === influencer.id).length,
    status: (conversionsData.filter(c => c.influencer_id === influencer.id).length || 0) > 0 ? 'active' : 'inactive',
    metadata: {
      role: influencer.role,
      joinDate: influencer.created_at
    },
    created: new Date(influencer.created_at).toLocaleDateString()
  }));

  const recentActivity: UnifiedActivity[] = conversionsData.slice(0, 5).map(conversion => ({
    id: conversion.id,
    user: conversion.name,
    action: `Completed conversion - ${parseFloat(String(conversion.conversion_value || '0')).toFixed(2)}`,
    time: getTimeAgo(new Date(conversion.created_at)),
    type: 'success'
  }));

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
  };
};

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
          const [linksResponse, referralsResponse, campaignsResponse] = await Promise.all([
            supabase
              .from('referral_links')
              .select(`
                *,
                discord_guild_campaigns!referral_links_campaign_id_fkey(
                  id,
                  campaign_name,
                  campaign_type,
                  clients(name)
                )
              `)
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
              .limit(100),

            supabase
              .from('discord_guild_campaigns')
              .select(`
                id,
                campaign_name,
                campaign_type,
                campaign_start_date,
                campaign_end_date,
                is_active,
                created_at,
                clients!inner(name)
              `)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(50)
          ])

          if (linksResponse.error) throw linksResponse.error
          if (referralsResponse.error) throw referralsResponse.error
          if (campaignsResponse.error) throw campaignsResponse.error

          // Transform campaigns data to match expected format
          const transformedCampaigns = (campaignsResponse.data || []).map(campaign => ({
            ...campaign,
            client_name: (campaign.clients as any)?.name || 'Unknown Client'
          }))

          transformedData = transformInfluencerData(
            linksResponse.data || [],
            referralsResponse.data || [],
            transformedCampaigns
          )
          break
        }

        case 'admin': {
          const [clientsResponse, campaignsResponse, onboardingStartsResponse, onboardingCompletionsResponse] = await Promise.all([
            supabase
              .from('clients')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50),

            supabase
              .from('discord_guild_campaigns')
              .select(`
                *,
                clients!inner(name)
              `)
              .order('created_at', { ascending: false })
              .limit(50),

            supabase
              .from('campaign_onboarding_starts')
              .select('id, discord_user_id')
              .limit(1000),
              
            supabase
              .from('campaign_onboarding_completions')
              .select('id, discord_user_id')
              .limit(1000)
          ]);

          if (clientsResponse.error) throw clientsResponse.error;
          if (campaignsResponse.error) throw campaignsResponse.error;
          if (onboardingStartsResponse.error) throw onboardingStartsResponse.error;
          if (onboardingCompletionsResponse.error) throw onboardingCompletionsResponse.error;

          transformedData = transformAdminData(
            clientsResponse.data || [],
            campaignsResponse.data || [],
            onboardingStartsResponse.data || [],
            onboardingCompletionsResponse.data || []
          );
          break;
        }

        case 'client': {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (clientError) throw clientError;
          if (!clientData) throw new Error("Client not found");

          const [campaignsResponse, influencersResponse, conversionsResponse] = await Promise.all([
            supabase
              .from('discord_guild_campaigns')
              .select(`
                *,
                clients!inner(name)
              `)
              .eq('client_id', clientData.id)
              .order('created_at', { ascending: false })
              .limit(50),

            supabase
              .from('user_profiles')
              .select('id, full_name, email, created_at, role')
              // .in('id', campaign.influencer_ids) // This would be ideal but needs a way to get all influencer IDs first
              .eq('role', 'influencer')
              .limit(50),

            supabase
              .from('referrals')
              .select('id, influencer_id, status, created_at, conversion_value, name')
              .eq('status', 'completed')
              // .in('campaign_id', campaigns.map(c => c.id)) // This would be ideal
              .order('created_at', { ascending: false })
              .limit(100)
          ]);

          if (campaignsResponse.error) throw campaignsResponse.error;
          if (influencersResponse.error) throw influencersResponse.error;
          if (conversionsResponse.error) throw conversionsResponse.error;

          transformedData = transformClientData(
            campaignsResponse.data || [],
            influencersResponse.data || [],
            conversionsResponse.data || []
          );
          break;
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