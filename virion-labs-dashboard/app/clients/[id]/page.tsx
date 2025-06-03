import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientDetailPage } from "@/components/client-detail-page"
import { ProtectedRoute } from "@/components/protected-route"

interface ClientPageProps {
  params: {
    id: string
  }
}

export default function ClientPage({ params }: ClientPageProps) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <ClientDetailPage clientId={params.id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 