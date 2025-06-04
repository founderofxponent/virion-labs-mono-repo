import { DashboardLayout } from "@/components/dashboard-layout"
import { DiscordCampaignsPage } from "@/components/discord-campaigns-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function DiscordCampaigns() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <DiscordCampaignsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 