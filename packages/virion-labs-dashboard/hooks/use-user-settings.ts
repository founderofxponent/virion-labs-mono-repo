"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { generateUserApiKeys } from "@/lib/api-keys"
import { uploadAvatar, UploadAvatarResult } from "@/lib/avatar-upload"
import api from "@/lib/api"
import { UserSettings, UserSettingsUpdate } from "@/lib/supabase" // Keep for type, but data comes from API

export function useUserSettings() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is available
  const isUserAvailable = user?.id != null

  // Early return for users not available
  useEffect(() => {
    if (!isUserAvailable) {
      console.log('👤 useUserSettings: User not available, immediately setting loading false')
      setSettings(null)
      setLoading(false)
      setError(null)
    }
  }, [isUserAvailable])

  // Emergency timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('👤 useUserSettings: EMERGENCY TIMEOUT - Force setting loading to false')
        setLoading(false)
        setError("Request timed out.")
      }
    }, 5000) // 5 second timeout
    return () => clearTimeout(timeout)
  }, [loading])

  // Fetch user settings from our API
  const fetchSettings = async () => {
    if (!user?.id || !isUserAvailable) {
      console.log('👤 useUserSettings: User not available, skipping fetch')
      setLoading(false)
      return
    }

    try {
      console.log('👤 useUserSettings: Fetching settings for confirmed user from API:', user.id)
      setLoading(true)
      
      const { data } = await api.get<UserSettings>('/api/users/me/settings')
      
      setSettings(data || null)
      setError(null)
      console.log('👤 useUserSettings: Settings fetched successfully from API:', !!data)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "An unknown error occurred"
      setError(errorMessage)
      console.error('👤 useUserSettings: Error fetching settings from API:', errorMessage)
      // If settings are not found (404), we might want to trigger a creation process.
      // For now, we just show an error. The backend should handle creating default settings on user creation.
      if (err.response?.status === 404) {
        console.log('👤 useUserSettings: No settings found on backend.')
        // In the future, we could call a createSettings() endpoint here.
      }
    } finally {
      setLoading(false)
    }
  }

  // Update settings
  const updateSettings = async (updates: Partial<UserSettingsUpdate>): Promise<boolean> => {
    if (!user?.id || !settings) return false

    try {
      const { data } = await api.patch<UserSettings>('/api/users/me/settings', updates)
      
      setSettings(data)
      setError(null)
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "An unknown error occurred"
      setError(errorMessage)
      console.error('Error updating settings via API:', err)
      return false
    }
  }

  // The functions below should also be migrated to use the business logic API.
  // For now, they are left as placeholders or removed if they are fully deprecated.

  // Change password - This should be handled by a dedicated auth flow/API endpoint
  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    console.warn("changePassword is not yet migrated to the new API.")
    // Placeholder implementation
    return { success: false, error: "This feature is temporarily unavailable." }
  }

  // Delete account - This should be handled by a dedicated auth flow/API endpoint
  const deleteAccount = async (password: string): Promise<{ success: boolean; error?: string }> => {
    console.warn("deleteAccount is not yet migrated to the new API.")
    // Placeholder implementation
    return { success: false, error: "This feature is temporarily unavailable." }
  }

  // Regenerate API keys - This should be handled by the API
  const regenerateApiKeys = async (): Promise<{ liveKey: string; testKey: string } | null> => {
    console.warn("regenerateApiKeys is not yet migrated to the new API.")
    // Placeholder implementation
    return null
  }

  // Upload avatar - This should be handled by the API
  const uploadUserAvatar = async (file: File): Promise<UploadAvatarResult> => {
    console.warn("uploadUserAvatar is not yet migrated to the new API.")
    // Placeholder implementation
    return { success: false, error: "This feature is temporarily unavailable." }
  }

  // Initialize settings on user change
  useEffect(() => {
    if (user?.id && isUserAvailable) {
      console.log('👤 useUserSettings: User confirmed, fetching settings from API')
      fetchSettings()
    } else {
      console.log('👤 useUserSettings: User not confirmed or not available, clearing settings')
      setSettings(null)
      setLoading(false)
    }
  }, [user?.id, isUserAvailable])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
    regenerateApiKeys,
    uploadUserAvatar,
    changePassword,
    deleteAccount,
  }
} 