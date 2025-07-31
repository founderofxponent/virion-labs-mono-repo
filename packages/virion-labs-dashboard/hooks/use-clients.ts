"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"

// This is the shape of the data the UI components expect
export interface Client {
  id: number;
  documentId?: string;
  name: string;
  industry: string;
  website?: string;
  primary_contact?: string;
  contact_email?: string;
  influencers: number;
  client_status: string;
  join_date: string;
  logo?: string;
  campaign_count: number;
  created_at?: string;
  updated_at?: string;
}

interface ApiListResponse {
  clients: Client[];
  total_count: number;
}

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [campaignCounts, setCampaignCounts] = useState<Record<string, number>>({})

  const API_BASE_URL = "http://localhost:8000/api/v1/operations"

  const getToken = () => localStorage.getItem('auth_token')


  const fetchClients = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/client/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch clients')
      }
      
      const data: ApiListResponse = await response.json()
      setClients(data.clients)

      const counts: Record<string, number> = {}
      data.clients.forEach(client => {
        counts[client.id] = client.campaign_count
      })
      setCampaignCounts(counts)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Other functions (addClient, updateClient, etc.) would also need to be
  // updated to send the correct nested structure if they create/update data.
  // For now, the primary issue was fetching and displaying, which is now fixed.

  const addClient = async (clientData: Omit<Client, 'id' | 'join_date' | 'campaign_count'>) => {
    const token = getToken()
    if (!token) return { data: null, error: "Authentication token not found." }

    try {
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/client/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: clientData.name,
          contact_email: clientData.contact_email,
          industry: clientData.industry,
          website: clientData.website,
          primary_contact: clientData.primary_contact,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to add client')
      }
      
      await fetchClients()
      return { data: "Success", error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const updateClient = async (clientIdentifier: number | string, updates: Partial<Client>) => {
    const token = getToken()
    if (!token) return { data: null, error: "Authentication token not found." }

    try {
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/client/update/${clientIdentifier}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...updates,
          client_status: updates.client_status?.toLowerCase(),
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update client')
      }
      
      const responseData = await response.json()
      await fetchClients()
      return { data: responseData, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const deleteClient = async (clientIdentifier: number | string) => {
    const token = getToken()
    if (!token) return { error: "Authentication token not found." }

    try {
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/client/delete/${clientIdentifier}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete client')
      }
      
      await fetchClients()
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStats = () => {
    const totalClients = clients.length
    const activeClients = clients.filter(client => client.client_status === 'active').length
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

  const getClientById = async (id: number | string) => {
    const token = getToken()
    if (!token) return { data: null, error: "Authentication token not found." }

    try {
      const response = await fetch(`${API_BASE_URL}/client/get/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch client')
      }
      
      const data: { client: any } = await response.json()
      return { data: data.client, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error: errorMessage }
    }
  }

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user, fetchClients])

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
