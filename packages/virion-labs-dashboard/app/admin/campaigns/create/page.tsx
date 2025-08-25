"use client"

import { CampaignWizard } from "@/components/campaign-wizard/CampaignWizard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function CreateCampaignPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "platform administrator"]}>
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <CampaignWizard mode="create" afterSaveNavigateTo="/admin/campaigns" />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
