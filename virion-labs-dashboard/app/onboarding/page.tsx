import { DashboardLayout } from "@/components/dashboard-layout"
import { OnboardingFieldsPage } from "@/components/onboarding-fields-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function OnboardingFields() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <OnboardingFieldsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
