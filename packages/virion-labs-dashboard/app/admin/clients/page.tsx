import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientsPage } from "@/components/clients-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function Clients() {
  return (
    <ProtectedRoute allowedRoles={["admin", "platform administrator"]}>
      <DashboardLayout>
        <ClientsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
