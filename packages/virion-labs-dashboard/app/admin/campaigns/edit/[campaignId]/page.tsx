"use client"

import { use } from "react"
import { CampaignWizard } from "@/components/campaign-wizard/CampaignWizard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function EditCampaignPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params)
  
  return (
    <ProtectedRoute allowedRoles={["admin", "platform administrator"]}>
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <CampaignWizard mode="edit" campaignId={campaignId} afterSaveNavigateTo="/admin/campaigns" />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
