import { DashboardLayout } from "@/components/dashboard-layout"
import { EmailTemplatesAdmin } from "@/components/email-templates-admin"
import { ProtectedRoute } from "@/components/protected-route"

export default function EmailTemplatesPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "Platform Administrator"]}>
      <DashboardLayout>
        <EmailTemplatesAdmin />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
