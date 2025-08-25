"use client"

import { CampaignWizard } from "@/components/campaign-wizard/CampaignWizard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function EditCampaignPage({ params }: { params: { campaignId: string } }) {
  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <CampaignWizard mode="edit" campaignId={params.campaignId} afterSaveNavigateTo="/clients/campaigns" />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
