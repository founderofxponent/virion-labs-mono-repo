"use client"

import { useAuth } from "@/components/auth-provider"
import { memo, useEffect, useState } from "react"

interface DebugInfoProps {
  dataLoading?: boolean
  error?: string | null
}

export const DebugInfo = memo(function DebugInfo({ dataLoading, error }: DebugInfoProps) {
  const [mounted, setMounted] = useState(false)
  const { user, profile, loading: authLoading } = useAuth()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 bg-black/80 text-white p-4 rounded text-xs font-mono z-50 max-w-sm">
      <div className="space-y-1">
        <div>Auth Loading: {authLoading ? '❌' : '✅'}</div>
        <div>User: {user ? '✅' : '❌'}</div>
        <div>Profile: {profile ? '✅' : '❌'}</div>
        <div>Data Loading: {dataLoading ? '❌' : '✅'}</div>
        <div>Error: {error ? '❌' : '✅'}</div>
        {error && <div className="text-red-400 text-xs mt-2">{error}</div>}
        <div className="text-gray-400 mt-2">
          Timestamp: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}) 