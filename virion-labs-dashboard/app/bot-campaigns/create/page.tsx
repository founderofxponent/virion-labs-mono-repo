"use client"

import { CampaignWizard } from "@/components/campaign-wizard"

export default function CreateCampaignPage() {
  return (
    <div className="container mx-auto py-6">
      <CampaignWizard mode="create" />
    </div>
  )
} 