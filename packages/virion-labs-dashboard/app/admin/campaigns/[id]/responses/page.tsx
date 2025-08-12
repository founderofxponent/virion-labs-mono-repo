import { Suspense } from 'react'
import { CampaignResponsesPageWrapper } from "@/components/campaign-responses-page-wrapper"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminCampaignResponsesPage({ params }: PageProps) {
  const { id } = await params
  
  return (
    <ProtectedRoute allowedRoles={["admin", "platform administrator"]}>
      <DashboardLayout>
        <Suspense fallback={
          <div className="container mx-auto py-6">
            <div className="text-center">Loading...</div>
          </div>
        }>
          <CampaignResponsesPageWrapper campaignId={id} />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  )
}