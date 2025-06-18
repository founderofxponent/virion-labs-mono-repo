import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientDetailPage } from "@/components/client-detail-page"
import { ProtectedRoute } from "@/components/protected-route"

interface ClientPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params
  
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <ClientDetailPage clientId={id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 