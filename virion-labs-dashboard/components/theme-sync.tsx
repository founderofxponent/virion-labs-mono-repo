"use client"

import { useTheme } from "next-themes"
import { useUserSettings } from "@/hooks/use-user-settings"
import { useAuth } from "@/components/auth-provider"
import { useEffect } from "react"

export function ThemeSync() {
  const { setTheme } = useTheme()
  const { user } = useAuth()
  const { settings } = useUserSettings()
  
  // Apply theme from user settings when user is available and has settings
  useEffect(() => {
    if (user && settings?.theme) {
      setTheme(settings.theme)
    }
  }, [user, settings?.theme, setTheme])
  
  return null
} 