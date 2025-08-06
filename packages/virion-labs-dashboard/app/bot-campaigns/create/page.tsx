"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { CampaignWizard } from "@/components/campaign-wizard"
import { ProtectedRoute } from "@/components/protected-route"

export default function CreateCampaignPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "Platform Administrator"]}>
      <DashboardLayout>
        <CampaignWizard mode="create" />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 