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
  status: string;
  join_date: string;
  logo?: string;
  campaign_count: number;
  created_at?: string;
  updated_at?: string;
}

// This is the actual shape of the data from the API
interface ApiClient {
  id: number;
  documentId?: string;
  attributes: {
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
  };
}

interface ApiListResponse {
  clients: ApiClient[];
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

  // Correctly transform the nested API response to the flat structure the UI needs
  const transformApiClient = (apiClient: ApiClient): Client => {
    return {
      id: apiClient.id,
      documentId: apiClient.documentId,
      ...apiClient.attributes,
      status: apiClient.attributes.client_status, // Map client_status to status
    }
  }

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
      const transformedData = data.clients.map(transformApiClient)
      setClients(transformedData)

      const counts: Record<string, number> = {}
      transformedData.forEach(client => {
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
          client_data: {
            name: clientData.name,
            contact_email: clientData.contact_email,
            industry: clientData.industry,
          },
          setup_options: {
            create_default_settings: true,
            enable_analytics: true,
            send_welcome_email: true
          }
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
          client_status: updates.status?.toLowerCase(),
          status: undefined, // Remove status to avoid duplication
          // Ensure null values are preserved for optional fields
          website: updates.website,
          primary_contact: updates.primary_contact,
          contact_email: updates.contact_email
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
    const activeClients = clients.filter(client => client.status === 'active').length
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
      // Strapi v5 returns flat structure, transform to match Client interface
      const transformedClient: Client = {
        id: data.client.id,
        documentId: data.client.documentId,
        name: data.client.name,
        industry: data.client.industry,
        website: data.client.website,
        primary_contact: data.client.primary_contact,
        contact_email: data.client.contact_email,
        influencers: data.client.influencers,
        status: data.client.client_status, // Map client_status to status
        join_date: data.client.join_date,
        logo: data.client.logo,
        campaign_count: data.client.campaign_count || 0,
        created_at: data.client.createdAt,
        updated_at: data.client.updatedAt,
      }
      return { data: transformedClient, error: null }
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
