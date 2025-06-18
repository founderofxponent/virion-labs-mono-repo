"use client"

import { CampaignWizard } from "@/components/campaign-wizard"
import { use } from "react"

interface EditCampaignPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { id } = use(params)
  
  return (
    <div className="container mx-auto py-6">
      <CampaignWizard mode="edit" campaignId={id} />
    </div>
  )
} 