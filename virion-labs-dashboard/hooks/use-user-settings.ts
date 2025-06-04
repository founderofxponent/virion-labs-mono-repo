"use client"

import { useState, useEffect } from "react"
import { supabase, UserSettings, UserSettingsInsert, UserSettingsUpdate } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { generateUserApiKeys } from "@/lib/api-keys"
import { uploadAvatar, UploadAvatarResult } from "@/lib/avatar-upload"

export function useUserSettings() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user settings
  const fetchSettings = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      setSettings(data || null)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  // Create default settings for new user
  const createDefaultSettings = async (): Promise<UserSettings | null> => {
    if (!user?.id) return null

    try {
      const defaultSettings: UserSettingsInsert = {
        user_id: user.id,
        bio: null,
        phone_number: null,
        twitter_handle: null,
        instagram_handle: null,
        youtube_channel: null,
        discord_username: null,
        website_url: null,
        email_notifications_new_referral: true,
        email_notifications_link_clicks: false,
        email_notifications_weekly_reports: true,
        email_notifications_product_updates: true,
        push_notifications_new_referral: false,
        push_notifications_link_clicks: false,
        push_notifications_weekly_reports: false,
        push_notifications_product_updates: false,
        profile_visibility: 'public',
        show_earnings: false,
        show_referral_count: true,
        webhook_url: null,
        webhook_events: ['signup', 'click', 'conversion'],
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        currency: 'USD',
        two_factor_enabled: false,
        login_notifications: true,
        api_key: null,
        api_key_test: null,
      }

      const { data, error } = await supabase
        .from('user_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (error) throw error

      setSettings(data)
      return data
    } catch (err: any) {
      setError(err.message)
      console.error('Error creating default settings:', err)
      return null
    }
  }

  // Update settings
  const updateSettings = async (updates: Partial<UserSettingsUpdate>): Promise<boolean> => {
    if (!user?.id || !settings) return false

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setSettings(data)
      setError(null)
      return true
    } catch (err: any) {
      setError(err.message)
      console.error('Error updating settings:', err)
      return false
    }
  }

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      })

      if (verifyError) {
        return {
          success: false,
          error: 'Current password is incorrect'
        }
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        return {
          success: false,
          error: updateError.message
        }
      }

      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to change password'
      }
    }
  }

  // Delete account
  const deleteAccount = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    try {
      // Call the server-side API route for user deletion
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to delete account'
        }
      }

      // Sign out the user
      await signOut()

      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to delete account'
      }
    }
  }

  // Generate new API keys
  const regenerateApiKeys = async (): Promise<{ liveKey: string; testKey: string } | null> => {
    if (!user?.id) return null

    try {
      const keys = await generateUserApiKeys(user.id)
      if (keys) {
        // Refresh settings to get updated api_key_regenerated_at
        await fetchSettings()
      }
      return keys
    } catch (err: any) {
      setError(err.message)
      console.error('Error regenerating API keys:', err)
      return null
    }
  }

  // Upload avatar
  const uploadUserAvatar = async (file: File): Promise<UploadAvatarResult> => {
    if (!user?.id) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    try {
      const result = await uploadAvatar(file, user.id)
      if (result.success) {
        // Refresh profile to get updated avatar
        await refreshProfile()
      }
      return result
    } catch (err: any) {
      console.error('Error uploading avatar:', err)
      return {
        success: false,
        error: 'An unexpected error occurred while uploading avatar'
      }
    }
  }

  // Initialize settings on user change
  useEffect(() => {
    if (user?.id) {
      fetchSettings()
    } else {
      setSettings(null)
      setLoading(false)
    }
  }, [user?.id])

  // Create default settings if none exist
  useEffect(() => {
    if (!loading && user?.id && !settings && !error) {
      createDefaultSettings()
    }
  }, [loading, user?.id, settings, error])

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