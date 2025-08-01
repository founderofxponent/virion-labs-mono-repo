"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/components/auth-provider"
import { UserSettings } from "@/schemas/user-settings"

export function useUserSettings() {
  const { user, profile, loading: authLoading, getUser } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "http://localhost:8000"
  const getToken = () => localStorage.getItem('auth_token')

  const fetchSettings = useCallback(async () => {
    if (authLoading) return

    if (!user) {
      setLoading(false)
      return
    }

    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch user settings')
      }

      const settingsData: UserSettings = await response.json()
      setSettings(settingsData)
    } catch (err) {
      console.error('Error fetching user settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch settings')
      setSettings(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id, authLoading])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSettings = async (updatedData: Partial<UserSettings>): Promise<boolean> => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      return false
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update settings')
      }

      const newSettings = await response.json()
      setSettings(newSettings)
      return true
    } catch (err) {
      console.error('Error updating settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to update settings')
      return false
    }
  }

  const uploadUserAvatar = async (file: File): Promise<{ success: boolean; error?: string }> => {
    const token = getToken()
    if (!token || !user) {
      return { success: false, error: "User not authenticated" }
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.detail || "Failed to upload avatar" }
      }

      // Refresh user profile to get the new avatar URL
      await getUser()
      
      return { success: true }
    } catch (error) {
      console.error("Avatar upload error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const token = getToken()
    if (!token) {
      return { success: false, error: "Authentication token not found." }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.detail || "Failed to change password" }
      }

      return { success: true }
    } catch (error) {
      console.error("Password change error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const deleteAccount = async (password: string): Promise<{ success: boolean; error?: string }> => {
    const token = getToken()
    if (!token) {
      return { success: false, error: "Authentication token not found." }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.detail || "Failed to delete account" }
      }

      // The auth provider should handle logout and redirection
      return { success: true }
    } catch (error) {
      console.error("Account deletion error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const regenerateApiKeys = async (): Promise<{ liveKey: string; testKey: string } | null> => {
    const token = getToken()
    if (!token) {
      setError("Authentication token not found.")
      return null
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me/api-keys/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to regenerate API keys')
      }

      const data = await response.json()
      
      // Also refetch settings to update the regenerated_at timestamp
      await fetchSettings()

      return { liveKey: data.api_key, testKey: data.api_key_test }
    } catch (err) {
      console.error('Error regenerating API keys:', err)
      setError(err instanceof Error ? err.message : 'Failed to regenerate keys')
      return null
    }
  }

  return {
    settings,
    loading: loading || authLoading,
    error,
    fetchSettings,
    updateSettings,
    uploadUserAvatar,
    changePassword,
    deleteAccount,
    regenerateApiKeys,
  }
}