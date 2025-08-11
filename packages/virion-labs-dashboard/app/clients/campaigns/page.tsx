import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import ClientsCampaignsPage from "@/components/clients-campaigns-page"

export default function ClientCampaignsPage() {
  return (
    <ProtectedRoute allowedRoles={["client", "admin", "platform administrator"]}>
      <DashboardLayout>
        <ClientsCampaignsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
