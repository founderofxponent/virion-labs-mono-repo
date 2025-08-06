import { DashboardLayout } from "@/components/dashboard-layout"
import { ReferralsPage } from "@/components/referrals-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function Referrals() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ReferralsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
