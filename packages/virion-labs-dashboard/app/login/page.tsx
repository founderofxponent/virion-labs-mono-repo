"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/api"
import { toast } from "sonner"

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth()
  const router = useRouter()
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [lead, setLead] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    industry: "",
    requirements: ""
  })

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/")
    }
  }, [user, loading, router])

  const handleGoogleLogin = () => {
    try {
      signInWithGoogle()
    } catch (error) {
      toast.error("Failed to start Google sign-in.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render login form if user is already authenticated (redirect will happen via useEffect)
  if (user) {
    return null
  }

  const submitLead = async () => {
    setLeadSubmitting(true)
    try {
      const { data } = await api.post("/api/v1/clients/leads", lead)
      const leadId = data?.lead?.documentId || data?.lead?.id
      toast.success("Thanks! We’ll reach out after you book a discovery call.")
      const qs = leadId ? `?lead=${encodeURIComponent(leadId)}` : ""
      router.push(`/work-with-us${qs}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to submit. Try again.")
    } finally {
      setLeadSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background p-4">
      {/* Left: Creator Login */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold text-2xl">
              <Image src="/virion-labs-logo-black.png" alt="Virion Labs" width={32} height={32} className="h-8 w-8 object-contain" />
              <span>Virion Labs</span>
            </Link>
            <p className="text-muted-foreground">Sign in to your Creator account</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Creator Login</CardTitle>
              <CardDescription>Sign in with Google</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGoogleLogin} className="w-full" disabled={loading}>
                {loading ? "Redirecting..." : "Sign in with Google"}
              </Button>
            </CardContent>
          </Card>
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 Virion Labs. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right: Business/Brand CTA */}
      <div className="flex items-center justify-center p-6 bg-muted/30">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Work with us</h2>
            <p className="text-sm text-muted-foreground">Tell us about your business. We’ll guide you through a quick onboarding and let you book a discovery call.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Business / Brand</CardTitle>
              <CardDescription>Start your onboarding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Company name" value={lead.company_name} onChange={(e) => setLead({ ...lead, company_name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Contact name" value={lead.contact_name} onChange={(e) => setLead({ ...lead, contact_name: e.target.value })} />
                <Input type="email" placeholder="Contact email" value={lead.contact_email} onChange={(e) => setLead({ ...lead, contact_email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Phone (optional)" value={lead.contact_phone} onChange={(e) => setLead({ ...lead, contact_phone: e.target.value })} />
                <Input placeholder="Website" value={lead.website} onChange={(e) => setLead({ ...lead, website: e.target.value })} />
              </div>
              <Input placeholder="Industry" value={lead.industry} onChange={(e) => setLead({ ...lead, industry: e.target.value })} />
              <Textarea placeholder="Briefly describe your goals / requirements" value={lead.requirements} onChange={(e) => setLead({ ...lead, requirements: e.target.value })} />
              <Button className="w-full" onClick={submitLead} disabled={leadSubmitting}>
                {leadSubmitting ? "Submitting..." : "Start onboarding"}
              </Button>
              <p className="text-xs text-muted-foreground">Next: pick a time for a discovery call.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
 