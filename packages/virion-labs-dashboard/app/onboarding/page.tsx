import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientOnboarding } from "@/components/client-onboarding"
import { ProtectedRoute } from "@/components/protected-route"

export default function ClientOnboardingPage() {
  // In a real implementation, these would come from URL params or user session
  const clientId = "demo-client-id"
  const clientName = "Demo Client"
  
  return (
    <ProtectedRoute allowedRoles={["client", "admin"]}>
      <DashboardLayout>
        <ClientOnboarding 
          clientId={clientId}
          clientName={clientName}
        />
        <div className="mt-6 text-sm text-muted-foreground">
          Discord sync has moved to Clients → Integrations. Connect your server there; synced channels and roles will appear in Step 3.
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
