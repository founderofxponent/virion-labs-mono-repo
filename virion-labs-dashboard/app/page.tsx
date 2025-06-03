"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { UnifiedDashboard } from "@/components/unified-dashboard"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useUnifiedData } from "@/hooks/use-unified-data"

export default function Home() {
  console.log('🏠 Home: Component rendering...')
  
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  console.log('📊 DashboardContent: Component rendering...')
  const { profile, loading: authLoading } = useAuth() 
  const { loading: dataLoading, error: dataError, data } = useUnifiedData()

  console.log('📊 DashboardContent: Auth state', { authLoading, hasProfile: !!profile });
  console.log('📊 DashboardContent: Unified data state', { dataLoading, dataError, hasData: !!data })

  if (!authLoading && !profile) {
    console.warn('📊 DashboardContent: Auth loaded, but no profile. This should have been handled by ProtectedRoute redirect.');
    return null;
  }
  
  if (!profile) {
      console.log('📊 DashboardContent: Waiting for profile to be available after auth. Not rendering main content yet.');
      return null; 
  }

  if (dataLoading) {
    console.log('📊 DashboardContent: Profile available, data is loading for UnifiedDashboard. Rendering skeleton via UnifiedDashboard.');
    return (
      <DashboardLayout debugData={{ loading: dataLoading, error: dataError }}>
        <UnifiedDashboard />
      </DashboardLayout>
    );
  }
  
  if (dataError) {
     console.log('📊 DashboardContent: Profile available, data error for UnifiedDashboard.');
     return (
      <DashboardLayout debugData={{ loading: false, error: dataError }}>
        <UnifiedDashboard />
      </DashboardLayout>
    );
  }

  if (data) {
    console.log('📊 DashboardContent: Profile and data available. Rendering main UnifiedDashboard.');
    return (
      <DashboardLayout debugData={{ loading: dataLoading, error: dataError }}>
        <UnifiedDashboard />
      </DashboardLayout>
    );
  }
  
  console.log('📊 DashboardContent: Profile available, but no data from useUnifiedData (and not loading/error). Showing no data available message.');
  return (
    <DashboardLayout debugData={{ loading: dataLoading, error: dataError }}>
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available for your dashboard at the moment.</p>
      </div>
    </DashboardLayout>
  );
}
