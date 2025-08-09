import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import ClientsProductsPage from "@/components/clients-products-page"

export default function ClientProductsPage() {
  return (
    <ProtectedRoute allowedRoles={["client", "admin", "Platform Administrator"]}>
      <DashboardLayout>
        <ClientsProductsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
