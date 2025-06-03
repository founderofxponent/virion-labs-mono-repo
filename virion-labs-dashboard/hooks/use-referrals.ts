"use client"

import { useState, useEffect } from 'react'
import { supabase, type Referral, type ReferralWithLink } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'

export function useReferrals() {
  const { profile } = useAuth()
  const [referrals, setReferrals] = useState<ReferralWithLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReferrals = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('referrals')
        .select(`
          *,
          referral_link:referral_links(
            id,
            title,
            platform,
            referral_code
          )
        `)
        .eq('influencer_id', profile.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setReferrals(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateReferralStatus = async (id: string, status: string) => {
    try {
      const { error: updateError } = await supabase
        .from('referrals')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Update local state
      setReferrals(prev => 
        prev.map(referral => 
          referral.id === id 
            ? { ...referral, status, updated_at: new Date().toISOString() }
            : referral
        )
      )

      return { success: true }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update status' }
    }
  }

  const deleteReferral = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('referrals')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Update local state
      setReferrals(prev => prev.filter(referral => referral.id !== id))

      return { success: true }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete referral' }
    }
  }

  const getReferralsSummary = () => {
    const totalReferrals = referrals.length
    const activeReferrals = referrals.filter(r => r.status === 'active').length
    const completedReferrals = referrals.filter(r => r.status === 'completed').length
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length
    const totalEarnings = referrals.reduce((sum, r) => sum + r.conversion_value, 0)
    const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0

    // Platform breakdown
    const platformCounts = referrals.reduce((acc, referral) => {
      const platform = referral.source_platform
      acc[platform] = (acc[platform] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topPlatform = Object.entries(platformCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'

    const averageAge = referrals.filter(r => r.age).length > 0
      ? referrals.filter(r => r.age).reduce((sum, r) => sum + (r.age || 0), 0) / referrals.filter(r => r.age).length
      : 0

    return {
      totalReferrals,
      activeReferrals,
      completedReferrals,
      pendingReferrals,
      totalEarnings,
      conversionRate,
      topPlatform,
      platformCounts,
      averageAge
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  useEffect(() => {
    fetchReferrals()
  }, [profile?.id])

  return {
    referrals,
    loading,
    error,
    updateReferralStatus,
    deleteReferral,
    getReferralsSummary,
    formatDate,
    refetch: fetchReferrals
  }
} 