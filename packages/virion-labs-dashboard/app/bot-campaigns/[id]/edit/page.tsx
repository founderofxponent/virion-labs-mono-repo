"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { CampaignWizard } from "@/components/campaign-wizard"
import { ProtectedRoute } from "@/components/protected-route"
import { use } from "react"

interface EditCampaignPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { id } = use(params)
  
  return (
    <ProtectedRoute allowedRoles={["admin", "Platform Administrator"]}>
      <DashboardLayout>
        <CampaignWizard mode="edit" campaignId={id} />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 