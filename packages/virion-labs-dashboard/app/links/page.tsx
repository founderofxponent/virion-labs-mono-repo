import { DashboardLayout } from "@/components/dashboard-layout"
import { LinksPage } from "@/components/links-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function Links() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <LinksPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
