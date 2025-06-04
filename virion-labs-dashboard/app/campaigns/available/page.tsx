import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AvailableCampaignsPage } from "@/components/available-campaigns-page"

export default function AvailableCampaigns() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <AvailableCampaignsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 