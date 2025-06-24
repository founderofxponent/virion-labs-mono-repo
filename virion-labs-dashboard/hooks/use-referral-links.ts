"use client"

import { useState, useEffect } from 'react'
import { supabase, type ReferralLink, type ReferralLinkInsert, type ReferralLinkUpdate, type ReferralLinkWithAnalytics } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { generateReferralCode, generateReferralUrl } from '@/lib/url-utils'
import { updateClientInfluencerCount } from '@/lib/client-helpers'

export function useReferralLinks() {
  const [links, setLinks] = useState<ReferralLinkWithAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Fetch all referral links for the current user
  const fetchLinks = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // First, refresh the conversion counts to ensure data consistency
      try {
        const refreshResponse = await fetch('/api/referral/refresh-counts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            influencer_id: user.id
          })
        })

        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json()
          console.log('Conversion counts refreshed:', refreshResult)
        } else {
          console.warn('Failed to refresh conversion counts:', refreshResponse.status)
        }
      } catch (refreshError) {
        console.warn('Error refreshing conversion counts:', refreshError)
        // Continue with normal fetch even if refresh fails
      }
      
      const { data, error } = await supabase
        .from('referral_links')
        .select(`
          *,
          campaign:discord_guild_campaigns!referral_links_campaign_id_fkey(
            id,
            campaign_name,
            campaign_type,
            client:clients(name)
          )
        `)
        .eq('influencer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform data to include analytics and campaign context
      const linksWithAnalytics: ReferralLinkWithAnalytics[] = (data || []).map(link => ({
        ...link,
        campaign_context: link.campaign ? {
          campaign_id: link.campaign.id,
          campaign_name: link.campaign.campaign_name,
          campaign_type: link.campaign.campaign_type,
          client_name: link.campaign.client?.name || 'Unknown Client'
        } : null,
        analytics: {
          totalClicks: link.clicks,
          totalConversions: link.conversions,
          conversionRate: link.conversion_rate || 0,
          recentClicks: link.clicks, // TODO: Calculate recent clicks from analytics
          recentConversions: link.conversions, // TODO: Calculate recent conversions from analytics
        }
      }))
      
      setLinks(linksWithAnalytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Add a new referral link
  const addLink = async (linkData: Omit<ReferralLinkInsert, 'influencer_id' | 'referral_code' | 'referral_url'>) => {
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    try {
      setError(null)
      
      const referralCode = generateReferralCode(linkData.title)
      const referralUrl = generateReferralUrl(referralCode)
      
      // 1. Create the referral link
      const { data, error } = await supabase
        .from('referral_links')
        .insert([{
          ...linkData,
          influencer_id: user.id,
          referral_code: referralCode,
          referral_url: referralUrl,
        }])
        .select(`
          *,
          campaign:discord_guild_campaigns!referral_links_campaign_id_fkey(
            id,
            campaign_name,
            campaign_type,
            client_id,
            client:clients(name)
          )
        `)
        .single()

      if (error) throw error
      
      // 2. Update client influencer count
      if (data?.campaign?.client_id) {
        try {
          await updateClientInfluencerCount(data.campaign.client_id)
          console.log(`Updated influencer count for client after adding referral link`)
        } catch (updateError) {
          console.error('Failed to update client influencer count:', updateError)
          // Don't fail the entire operation if count update fails
        }
      }
      
      if (data) {
        const linkWithAnalytics: ReferralLinkWithAnalytics = {
          ...data,
          campaign_context: data.campaign ? {
            campaign_id: data.campaign.id,
            campaign_name: data.campaign.campaign_name,
            campaign_type: data.campaign.campaign_type,
            client_name: data.campaign.client?.name || 'Unknown Client'
          } : null,
          analytics: {
            totalClicks: 0,
            totalConversions: 0,
            conversionRate: 0,
            recentClicks: 0,
            recentConversions: 0,
          }
        }
        setLinks(prev => [linkWithAnalytics, ...prev])
        
        // Return the full link with campaign context for the success modal
        return { data: linkWithAnalytics, error: null }
      }
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Update a referral link
  const updateLink = async (id: string, updates: ReferralLinkUpdate) => {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from('referral_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        setLinks(prev => prev.map(link => 
          link.id === id 
            ? { 
                ...data, 
                analytics: link.analytics || {
                  totalClicks: data.clicks,
                  totalConversions: data.conversions,
                  conversionRate: data.conversion_rate || 0,
                  recentClicks: data.clicks,
                  recentConversions: data.conversions,
                }
              }
            : link
        ))
      }
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Delete a referral link
  const deleteLink = async (id: string) => {
    try {
      setError(null)
      
      // 1. Get link details before deletion to know which client to update
      const { data: linkData } = await supabase
        .from('referral_links')
        .select(`
          id,
          campaign:discord_guild_campaigns!referral_links_campaign_id_fkey(
            client_id
          )
        `)
        .eq('id', id)
        .single()

      // 2. Handle foreign key constraints: Delete or unlink related discord_invite_links first
      const { data: discordInvites, error: discordInvitesError } = await supabase
        .from('discord_invite_links')
        .select('id, discord_invite_code')
        .eq('referral_link_id', id)

      if (discordInvitesError) {
        console.error('Error checking discord invite links:', discordInvitesError)
        throw new Error(`Failed to check related Discord invites: ${discordInvitesError.message}`)
      }

      if (discordInvites && discordInvites.length > 0) {
        // Option 1: Set referral_link_id to null (preserve Discord invites)
        const { error: unlinkError } = await supabase
          .from('discord_invite_links')
          .update({ referral_link_id: null })
          .eq('referral_link_id', id)

        if (unlinkError) {
          console.error('Error unlinking discord invites:', unlinkError)
          throw new Error(`Failed to unlink Discord invites: ${unlinkError.message}`)
        }

        console.log(`Unlinked ${discordInvites.length} Discord invite(s) from referral link`)
      }

      // 3. Delete related records that have ON DELETE CASCADE or should be cleaned up
      // Delete referral analytics
      const { error: analyticsError } = await supabase
        .from('referral_analytics')
        .delete()
        .eq('link_id', id)

      if (analyticsError) {
        console.error('Error deleting referral analytics:', analyticsError)
        // Don't throw here, analytics cleanup is not critical for referral link deletion
      }

      // Delete referral records (this might also have foreign key constraints)
      const { error: referralsError } = await supabase
        .from('referrals')
        .delete()
        .eq('referral_link_id', id)

      if (referralsError) {
        console.error('Error deleting referrals:', referralsError)
        // Don't throw here if it's just missing referrals
        if (!referralsError.message.includes('No rows found')) {
          throw new Error(`Failed to delete related referrals: ${referralsError.message}`)
        }
      }

      // 4. Delete the referral link
      const { error } = await supabase
        .from('referral_links')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // 5. Update client influencer count
      const campaign = Array.isArray(linkData?.campaign) ? linkData.campaign[0] : linkData?.campaign
      if (campaign?.client_id) {
        try {
          await updateClientInfluencerCount(campaign.client_id)
          console.log(`Updated influencer count for client after deleting referral link`)
        } catch (updateError) {
          console.error('Failed to update client influencer count:', updateError)
          // Don't fail the operation if count update fails
        }
      }
      
      // 6. Update local state
      setLinks(prev => prev.filter(link => link.id !== id))
      
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // Get a single referral link by ID
  const getLinkById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('referral_links')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error: errorMessage }
    }
  }

  // Toggle link active status
  const toggleLinkStatus = async (id: string) => {
    const link = links.find(l => l.id === id)
    if (!link) return { error: 'Link not found' }
    
    return updateLink(id, { is_active: !link.is_active })
  }

  // Get analytics summary
  const getAnalyticsSummary = () => {
    const totalLinks = links.length
    const activeLinks = links.filter(link => link.is_active).length
    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)
    const totalConversions = links.reduce((sum, link) => sum + link.conversions, 0)
    const averageConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    return {
      totalLinks,
      activeLinks,
      totalClicks,
      totalConversions,
      averageConversionRate,
    }
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Real-time subscription to changes
  useEffect(() => {
    if (!user) return

    // Set up real-time subscription for referral links
    const linkSubscription = supabase
      .channel('referral_links_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referral_links',
          filter: `influencer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Referral link change detected:', payload)
          // Refresh data when changes are detected
          fetchLinks()
        }
      )
      .subscribe()

    // Set up real-time subscription for referrals (to update conversion counts)
    const referralSubscription = supabase
      .channel('referrals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `influencer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Referral change detected:', payload)
          // Refresh data when referral changes are detected
          fetchLinks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(linkSubscription)
      supabase.removeChannel(referralSubscription)
    }
  }, [user])

  // Initialize data fetch
  useEffect(() => {
    fetchLinks()
  }, [user])

  return {
    links,
    loading,
    error,
    fetchLinks,
    addLink,
    updateLink,
    deleteLink,
    getLinkById,
    toggleLinkStatus,
    getAnalyticsSummary,
    formatDate,
    generateReferralCode,
    generateReferralUrl,
  }
} 