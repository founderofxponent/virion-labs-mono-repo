"use client"

import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OnboardingFieldsPage } from "@/components/onboarding-fields-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function OnboardingFieldsPageRoute() {
  const searchParams = useSearchParams()
  const campaignId = searchParams.get('campaign')
  
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <OnboardingFieldsPage campaignId={campaignId || undefined} />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 