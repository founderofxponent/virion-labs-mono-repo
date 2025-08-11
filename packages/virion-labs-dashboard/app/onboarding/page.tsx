"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function ClientOnboardingPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the new campaign creation page
    router.replace("/clients/campaigns?create=1")
  }, [router])
  
  return (
    <ProtectedRoute allowedRoles={["client", "admin", "platform administrator"]}>
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Redirecting to campaign creation...</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
