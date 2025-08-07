"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"
import { CampaignLandingPage } from "@/schemas/landing-page"

export function useCampaignLandingPageApi() {
  const { user } = useAuth()
  const [page, setPage] = useState<CampaignLandingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const getToken = useCallback(() => localStorage.getItem('auth_token'), [])

  const fetchPage = useCallback(async (campaignId: string) => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      setError("Authentication token not found.")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/operations/campaign/${campaignId}/landing-page`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch campaign landing page')
      }
      const data = await response.json()
      console.log('🌐 Landing page API response:', data)
      // The API returns the page data directly, not wrapped in a page property
      setPage(data || null)
      console.log('🌐 Set page to:', data || null)
      return data || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [getToken])

  const createPage = useCallback(async (campaignId: string, pageData: any) => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/operations/campaign/landing-pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...pageData, campaign: campaignId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create campaign landing page')
      }

      // Refetch the page to include the new page
      await fetchPage(campaignId)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }, [getToken, fetchPage])

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

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }, [getToken])

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

      // Refetch the page to reflect the deletion
      await fetchPage(campaignId)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }, [getToken, fetchPage])

  return {
    page,
    createPage,
    updatePage,
    deletePage,
    loading,
    error,
    fetchPage,
  }
}