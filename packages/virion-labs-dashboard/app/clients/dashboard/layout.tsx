"use client"

import type { ReactNode } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ClientDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["client", "admin", "platform administrator"]}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  )
}

