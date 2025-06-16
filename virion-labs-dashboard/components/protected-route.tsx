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
    // Redirect unauthenticated users to login
    if (!user) {
      console.log('🛡️ ProtectedRoute: No user found, redirecting to login')
      router.replace('/login')
      return
    }

    // User is authenticated, allow access
    console.log('🛡️ ProtectedRoute: User authenticated, allowing access')
  }, [user, router])

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

  // Only render children if user is authenticated, confirmed, and authorized
  console.log('🛡️ ProtectedRoute: User authenticated and confirmed, rendering protected content')
  return <>{children}</>
} 