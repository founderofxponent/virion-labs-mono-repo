"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"

export interface DiscordSettings {
  id?: number
  documentId?: string
  verified_role_id: string | null
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
}

export function useDiscordSettingsApi() {
  const { user, profile } = useAuth()
  const role = profile?.role
  let roleName: string | undefined | null = null
  if (role) {
    if (typeof role === 'string') {
      roleName = role
    } else {
      roleName = role.name
    }
  }
  const isAdmin = roleName === "admin" || roleName === "Platform Administrator"
  
  const [settings, setSettings] = useState<DiscordSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const getToken = () => localStorage.getItem('auth_token')

  const fetchSettings = useCallback(async () => {
    if (!user || !isAdmin) {
      setLoading(false)
      setSettings(null)
      return
    }

    setLoading(true)
    setError(null)
    const token = getToken()

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/operations/discord/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          // Settings don't exist yet, create default
          setSettings({ verified_role_id: null })
          setLoading(false)
          return
        }
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch Discord settings')
      }
      
      const data = await response.json()
      setSettings(data || { verified_role_id: null })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [user, isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchSettings()
    }
  }, [fetchSettings, isAdmin])

  const updateSettings = useCallback(async (newSettings: Partial<DiscordSettings>) => {
    if (!user || !isAdmin) {
      throw new Error("Unauthorized")
    }

    setSaving(true)
    setError(null)
    const token = getToken()

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/operations/discord/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verified_role_id: newSettings.verified_role_id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update Discord settings')
      }

      const data = await response.json()
      setSettings(data)
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(error)
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }, [user, isAdmin])

  return {
    settings,
    loading,
    error,
    saving,
    updateSettings,
    refetch: fetchSettings,
  }
}