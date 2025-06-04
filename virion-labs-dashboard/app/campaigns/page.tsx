import { DashboardLayout } from "@/components/dashboard-layout"
import { AvailableCampaignsPage } from "@/components/available-campaigns-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function CampaignsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <AvailableCampaignsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 