"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalyticsPage } from "@/components/analytics-page"
import { ProtectedRoute } from "@/components/protected-route"

export default function Analytics() {
  return (
    <ProtectedRoute allowedRoles={["admin", "platform administrator"]}>
      <DashboardLayout>
        <AnalyticsPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
