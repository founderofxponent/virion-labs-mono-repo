"use client"

import { useTheme } from "next-themes"
import { useUserSettings } from "@/hooks/use-user-settings"
import { useEffect } from "react"

export function ThemeSync() {
  const { setTheme } = useTheme()
  const { settings } = useUserSettings()
  
  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme)
    }
  }, [settings?.theme, setTheme])
  
  return null
} 