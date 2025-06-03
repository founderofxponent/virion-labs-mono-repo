"use client"

import { useState, useEffect } from "react"
import { supabase, UserSettings, UserSettingsInsert, UserSettingsUpdate } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

export function useUserSettings() {
  const { user } = useAuth()
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
  }
} 