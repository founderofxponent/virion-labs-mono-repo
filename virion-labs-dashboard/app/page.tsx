"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { UnifiedDashboard } from "@/components/unified-dashboard"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useUnifiedData } from "@/hooks/use-unified-data"

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { profile, loading: authLoading } = useAuth() 
  const { loading: dataLoading, error: dataError, data } = useUnifiedData()

  if (!authLoading && !profile) {
    return null;
  }
  
  if (!profile) {
      return null; 
  }

  if (dataLoading) {
    return (
      <DashboardLayout>
        <UnifiedDashboard />
      </DashboardLayout>
    );
  }
  
  if (dataError) {
     return (
      <DashboardLayout>
        <UnifiedDashboard />
      </DashboardLayout>
    );
  }

  if (data) {
    return (
      <DashboardLayout>
        <UnifiedDashboard />
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
