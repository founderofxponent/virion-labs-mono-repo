"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { UnifiedDashboard } from "@/components/unified-dashboard"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useUserSettings } from "@/hooks/use-user-settings"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  return (
    <ProtectedRoute allowedRoles={["Influencer", "admin", "platform administrator"]} redirectTo="/clients/dashboard">
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { settings } = useUserSettings()

  // Redirect Client role to client dashboard home for a focused experience
  useEffect(() => {
    const rawRole = typeof profile?.role === 'string' ? profile?.role : (profile?.role as { name?: string } | undefined)?.name
    const roleName = rawRole?.toLowerCase()
    if (!authLoading && roleName === 'client') {
      router.replace('/clients/dashboard')
    }
  }, [authLoading, profile, router])

  // Show loading state while checking role and potentially redirecting
  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if the user is a client and should be redirected
  const rawRole = typeof profile.role === 'string' ? profile.role : (profile.role as { name?: string } | undefined)?.name
  const roleName = rawRole?.toLowerCase()
  if (roleName === 'client') {
    // If the redirect hasn't happened yet, show a brief loading state
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to client dashboard...</p>
        </div>
      </div>
    );
  }

  // Only load dashboard data for non-client users
  const { loading: dataLoading, error: dataError, data, refetch } = useDashboardData(settings)

  if (dataLoading) {
    return (
      <DashboardLayout>
        <UnifiedDashboard data={data} loading={dataLoading} error={dataError} refetch={refetch} />
      </DashboardLayout>
    );
  }
  
  if (dataError) {
     return (
      <DashboardLayout>
        <UnifiedDashboard data={data} loading={dataLoading} error={dataError} refetch={refetch} />
      </DashboardLayout>
    );
  }

  if (data) {
    return (
      <DashboardLayout>
        <UnifiedDashboard data={data} loading={dataLoading} error={dataError} refetch={refetch} />
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available for your dashboard at the moment.</p>
      </div>
    </DashboardLayout>
  );
}
