"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

// Enable verbose logging when NEXT_PUBLIC_DEBUG_AUTH=true
const DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true'

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Wait until loading is finished before checking for user
    if (loading) {
      if (DEBUG) console.debug('ProtectedRoute: loading...', { pathname })
      return
    }

    // Redirect unauthenticated users to login
    if (!user) {
      if (DEBUG) console.debug('ProtectedRoute: no user -> /login', { from: pathname })
      router.replace('/login')
      return
    }

    // Check role requirements and redirect unauthorized users
    if (allowedRoles && allowedRoles.length > 0 && profile) {
      const userRoleRaw = typeof profile.role === 'string' ? profile.role : profile.role?.name
      const userRole = userRoleRaw?.toLowerCase()
      const normalizedAllowed = allowedRoles.map(r => r.toLowerCase())
      if (!userRole || !normalizedAllowed.includes(userRole)) {
        const fallback = userRole === 'client' ? '/clients/dashboard' : '/'
        const target = (redirectTo ?? fallback)
        if (DEBUG) console.debug('ProtectedRoute: unauthorized role -> redirect', { userRole, normalizedAllowed, target, from: pathname })
        if (pathname !== target) {
          router.replace(target)
        }
        return
      }
    }

    // User is authenticated and authorized
    if (DEBUG) console.debug('ProtectedRoute: authorized', { pathname })
  }, [user, loading, profile, allowedRoles, redirectTo, pathname, router])

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated (redirect will happen via useEffect)
  if (!user) {
    if (DEBUG) console.debug('ProtectedRoute: render guard returning null (no user)')
    return null
  }

  // Check role requirements (render guard only; navigation happens in useEffect)
  if (allowedRoles && allowedRoles.length > 0 && profile) {
    const userRoleRaw = typeof profile.role === 'string' ? profile.role : profile.role?.name
    const userRole = userRoleRaw?.toLowerCase()
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase())
    if (!userRole || !normalizedAllowed.includes(userRole)) {
      if (DEBUG) console.debug('ProtectedRoute: render guard returning null (unauthorized)', { userRole, normalizedAllowed })
      return null
    }
  }

  // Only render children if user is authenticated, confirmed, and authorized
  return <>{children}</>
} 