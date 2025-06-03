"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo = "/login" 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're certain about the auth state (not loading)
    if (!loading) {
      if (!user) {
        console.log('🛡️ ProtectedRoute: No user detected, redirecting to login')
        router.replace(redirectTo)
        return
      }

      // Check role requirements only if we have both user and profile
      if (user && profile && allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(profile.role)) {
          console.log('🛡️ ProtectedRoute: Role not allowed, redirecting')
          router.replace("/")
          return
        }
      }
    }
  }, [user, profile, loading, router, allowedRoles, redirectTo])

  // Show loading state while authentication is being checked
  if (loading) {
    console.log('🛡️ ProtectedRoute: Authentication loading, showing loading state')
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
    console.log('🛡️ ProtectedRoute: No user, preventing content flash before redirect')
    return null
  }

  // Check role requirements
  if (allowedRoles && allowedRoles.length > 0 && profile) {
    if (!allowedRoles.includes(profile.role)) {
      console.log('🛡️ ProtectedRoute: Role not allowed, preventing content flash before redirect')
      return null
    }
  }

  // Only render children if user is authenticated and authorized
  console.log('🛡️ ProtectedRoute: User authenticated, rendering protected content')
  return <>{children}</>
} 