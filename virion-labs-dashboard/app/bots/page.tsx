import { DashboardLayout } from "@/components/dashboard-layout"
import { AdaptiveBotPage } from "@/components/adaptive-bot-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function Bots() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <AdaptiveBotPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
