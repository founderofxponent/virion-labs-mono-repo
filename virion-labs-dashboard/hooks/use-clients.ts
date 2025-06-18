"use client"

import { useState, useEffect } from 'react'
import { supabase, type Client, type ClientInsert, type ClientUpdate } from '@/lib/supabase'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [campaignCounts, setCampaignCounts] = useState<Record<string, number>>({})

  // Fetch campaign counts for all clients
  const fetchCampaignCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('discord_guild_campaigns')
        .select('client_id')
        .neq('is_deleted', true)

      if (error) throw error

      // Count campaigns per client
      const counts: Record<string, number> = {}
      data?.forEach(campaign => {
        counts[campaign.client_id] = (counts[campaign.client_id] || 0) + 1
      })

      setCampaignCounts(counts)
    } catch (err) {
      console.error('Error fetching campaign counts:', err)
      setCampaignCounts({})
    }
  }

  // Fetch all clients
  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('join_date', { ascending: false })

      if (error) throw error
      
      setClients(data || [])
      
      // Fetch campaign counts after getting clients
      await fetchCampaignCounts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Add a new client
  const addClient = async (clientData: ClientInsert) => {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        setClients(prev => [data, ...prev])
      }
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Update a client
  const updateClient = async (id: string, updates: ClientUpdate) => {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        setClients(prev => prev.map(client => 
          client.id === id ? data : client
        ))
      }
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Delete a client
  const deleteClient = async (id: string) => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setClients(prev => prev.filter(client => client.id !== id))
      
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get client statistics
  const getStats = () => {
    const totalClients = clients.length
    const activeClients = clients.filter(client => client.status === 'Active').length
    const totalInfluencers = clients.reduce((sum, client) => sum + (client.influencers || 0), 0)
    const totalCampaigns = Object.values(campaignCounts).reduce((sum, count) => sum + count, 0)
    
    return {
      totalClients,
      activeClients,
      totalInfluencers,
      totalCampaigns,
      activePercentage: totalClients > 0 ? (activeClients / totalClients) * 100 : 0,
      avgInfluencersPerClient: totalClients > 0 ? totalInfluencers / totalClients : 0,
      avgCampaignsPerClient: totalClients > 0 ? totalCampaigns / totalClients : 0
    }
  }

  // Get a single client by ID
  const getClientById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
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

  // Real-time subscription for client updates
  useEffect(() => {
    fetchClients()

    // Set up real-time subscription for client changes (influencer count updates)
    const clientSubscription = supabase
      .channel('client_influencer_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients'
        },
        (payload) => {
          console.log('Client data updated:', payload)
          // Refresh client data when influencer counts change
          fetchClients()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(clientSubscription)
    }
  }, [])

  return {
    clients,
    loading,
    error,
    campaignCounts,
    addClient,
    updateClient,
    deleteClient,
    refreshClients: fetchClients,
    getClientById,
    formatDate,
    getStats
  }
} 