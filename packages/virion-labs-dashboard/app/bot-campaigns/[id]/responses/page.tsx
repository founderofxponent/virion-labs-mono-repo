"use client"

import { use } from 'react'
import { DashboardLayout } from "@/components/dashboard-layout"
import { CampaignResponsesPage } from '@/components/campaign-responses-page'
import { ProtectedRoute } from "@/components/protected-route"
import { useBotCampaignsAPI } from '@/hooks/use-bot-campaigns-api'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function ResponsesPage({ params }: PageProps) {
  const { campaigns, loading } = useBotCampaignsAPI()
  const { id } = use(params)
  
  const campaign = campaigns.find(c => 
    c.documentId === id || c.id?.toString() === id
  )

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "Platform Administrator"]}>
        <DashboardLayout>
          <div>Loading...</div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "Platform Administrator"]}>
      <DashboardLayout>
        <CampaignResponsesPage 
          campaignId={id}
          campaignName={campaign?.name}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}