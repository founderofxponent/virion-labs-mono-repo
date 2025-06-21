"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OnboardingFieldsPage } from "@/components/onboarding-fields-page"
import { ProtectedRoute } from "@/components/protected-route"

function OnboardingFieldsContent() {
  const searchParams = useSearchParams()
  const campaignId = searchParams.get('campaign')
  
  return <OnboardingFieldsPage campaignId={campaignId || undefined} />
}

export default function OnboardingFieldsPageRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <OnboardingFieldsContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 