"use client"

import { useState, useEffect } from 'react'
import { supabase, type ReferralLink, type ReferralLinkInsert, type ReferralLinkUpdate, type ReferralLinkWithAnalytics } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'

export function useReferralLinks() {
  const [links, setLinks] = useState<ReferralLinkWithAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Generate a unique referral code
  const generateReferralCode = (title: string): string => {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    return `${cleanTitle}-${randomSuffix}`
  }

  // Generate referral URL
  const generateReferralUrl = (code: string): string => {
    return `https://ref.virionlabs.com/${code}`
  }

  // Fetch all referral links for the current user
  const fetchLinks = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('referral_links')
        .select('*')
        .eq('influencer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform data to include analytics
      const linksWithAnalytics: ReferralLinkWithAnalytics[] = (data || []).map(link => ({
        ...link,
        analytics: {
          totalClicks: link.clicks,
          totalConversions: link.conversions,
          conversionRate: link.conversion_rate || 0,
          totalEarnings: link.earnings,
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
      
      const { data, error } = await supabase
        .from('referral_links')
        .insert([{
          ...linkData,
          influencer_id: user.id,
          referral_code: referralCode,
          referral_url: referralUrl,
        }])
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        const linkWithAnalytics: ReferralLinkWithAnalytics = {
          ...data,
          analytics: {
            totalClicks: 0,
            totalConversions: 0,
            conversionRate: 0,
            totalEarnings: 0,
            recentClicks: 0,
            recentConversions: 0,
          }
        }
        setLinks(prev => [linkWithAnalytics, ...prev])
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
                  totalEarnings: data.earnings,
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
      
      const { error } = await supabase
        .from('referral_links')
        .delete()
        .eq('id', id)

      if (error) throw error
      
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
    const totalEarnings = links.reduce((sum, link) => sum + link.earnings, 0)
    const averageConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    return {
      totalLinks,
      activeLinks,
      totalClicks,
      totalConversions,
      totalEarnings,
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