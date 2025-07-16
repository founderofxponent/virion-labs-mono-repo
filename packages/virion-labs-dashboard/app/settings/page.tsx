import { DashboardLayout } from "@/components/dashboard-layout"
import { SettingsPage } from "@/components/settings-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function Settings() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SettingsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
