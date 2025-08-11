import { DashboardLayout } from "@/components/dashboard-layout"
import BotCampaignsPage from "@/components/bot-campaigns-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function AdminCampaigns() {
  return (
    <ProtectedRoute allowedRoles={["admin", "Platform Administrator"]}>
      <DashboardLayout>
        <BotCampaignsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
