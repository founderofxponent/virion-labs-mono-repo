import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminAccessRequestsPage } from "@/components/admin-access-requests-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function AccessRequests() {
  return (
    <ProtectedRoute allowedRoles={["admin", "platform administrator"]}>
      <DashboardLayout>
        <AdminAccessRequestsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 