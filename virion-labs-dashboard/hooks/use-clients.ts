"use client"

import { useState, useEffect } from 'react'
import { supabase, type Client, type ClientInsert, type ClientUpdate } from '@/lib/supabase'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    const totalBots = clients.reduce((sum, client) => sum + (client.bots || 0), 0)
    
    return {
      totalClients,
      activeClients,
      totalInfluencers,
      totalBots,
      activePercentage: totalClients > 0 ? (activeClients / totalClients) * 100 : 0,
      avgInfluencersPerClient: totalClients > 0 ? totalInfluencers / totalClients : 0,
      avgBotsPerClient: totalClients > 0 ? totalBots / totalClients : 0
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

  useEffect(() => {
    fetchClients()
  }, [])

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    refreshClients: fetchClients,
    getClientById,
    formatDate,
    getStats
  }
} 