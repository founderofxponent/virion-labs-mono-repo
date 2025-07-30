"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"

// TODO: Define the new API-based types for campaign landing pages
export interface CampaignLandingPage {
  id: string;
  campaign_id: string;
  template_id: string;
  content: any;
  created_at: string;
  updated_at: string;
}

export function useCampaignLandingPagesApi() {
  const { user } = useAuth()
  const [pages, setPages] = useState<CampaignLandingPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "http://localhost:8000"
  const getToken = () => localStorage.getItem('auth_token')

  const fetchPages = useCallback(async (campaignId: string) => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const token = getToken()

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/operations/campaign/${campaignId}/landing-pages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch campaign landing pages')
      }
      const data = await response.json()
      setPages(data.pages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [user])

  const createPage = useCallback(async (campaignId: string, pageData: any) => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/operations/campaign/${campaignId}/landing-pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pageData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create campaign landing page')
      }

      // Refetch the list to include the new page
      fetchPages(campaignId)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }, [fetchPages])

  const updatePage = useCallback(async (pageId: string, pageData: any) => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/operations/campaign/landing-pages/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pageData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update campaign landing page')
      }

      // Refetch the list to reflect the updated page
      // This assumes the component knows the campaignId to refetch
      // A more robust solution might involve a global state manager.
      // For now, we will rely on the component to trigger a refetch.

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }, [])

  const deletePage = useCallback(async (pageId: string, campaignId: string) => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/operations/campaign/landing-pages/${pageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete campaign landing page')
      }

      // Refetch the list to reflect the deletion
      fetchPages(campaignId)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }, [fetchPages])

  return {
    pages,
    createPage,
    updatePage,
    deletePage,
    loading,
    error,
    fetchPages,
  }
}