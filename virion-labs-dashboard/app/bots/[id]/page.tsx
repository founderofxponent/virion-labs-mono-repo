import { DashboardLayout } from "@/components/dashboard-layout"
import { BotDetailPage } from "@/components/bot-detail-page"
import { ProtectedRoute } from "@/components/protected-route"

interface BotPageProps {
  params: {
    id: string
  }
  searchParams: {
    edit?: string
  }
}

export default function BotPage({ params, searchParams }: BotPageProps) {
  const isEditMode = searchParams.edit === 'true'
  
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <BotDetailPage botId={params.id} initialEditMode={isEditMode} />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 