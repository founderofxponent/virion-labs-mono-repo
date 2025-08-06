"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { UnifiedDashboard } from "@/components/unified-dashboard"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useUserSettings } from "@/hooks/use-user-settings"

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { profile, loading: authLoading } = useAuth() 
  const { settings } = useUserSettings()
  const { loading: dataLoading, error: dataError, data, refetch } = useDashboardData(settings)

  if (!authLoading && !profile) {
    return null;
  }
  
  if (!profile) {
      return null; 
  }

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
