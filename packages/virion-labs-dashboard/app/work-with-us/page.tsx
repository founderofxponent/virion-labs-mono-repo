"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { toast } from "sonner"
import api from "@/lib/api"

export default function WorkWithUsPage() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [booking, setBooking] = useState(false)
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [lead, setLead] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    industry: "",
    requirements: "",
  })
  const router = useRouter()
  const params = useSearchParams()
  const [leadId, setLeadId] = useState<string | undefined>(params.get("lead") || undefined)

  useEffect(() => {
    const load = async () => {
      try {
        const d = date ? date.toISOString().split("T")[0] : undefined
        if (!d) return
        const { data } = await api.get(`/api/v1/scheduling/slots`, { params: { date: d } })
        setAvailableSlots(data?.slots || [])
      } catch (e: any) {
        toast.error(e?.response?.data?.detail || "Failed to load slots")
      }
    }
    load()
  }, [date])

  const book = async (slot: string) => {
    setBooking(true)
    try {
      const { data } = await api.post(`/api/v1/scheduling/book`, { start: slot, duration_minutes: 30, lead_document_id: leadId })
      toast.success("Booked! Check your email for the calendar invite.")
      router.push("/")
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to book")
    } finally {
      setBooking(false)
    }
  }

  const submitLead = async () => {
    setLeadSubmitting(true)
    try {
      const { data } = await api.post("/api/v1/clients/leads", lead)
      const newLeadId = data?.lead?.documentId || data?.lead?.id
      setLeadId(newLeadId)
      toast.success("Thanks! Now pick a time for your discovery call.")
      const qs = newLeadId ? `?lead=${encodeURIComponent(newLeadId)}` : ""
      router.replace(`/work-with-us${qs}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to submit. Try again.")
    } finally {
      setLeadSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Work with Virion Labs</h1>
          <p className="text-sm text-muted-foreground mt-1">Tell us about your business and book a discovery call.</p>
        </div>

        {!leadId && (
          <Card>
            <CardHeader>
              <CardTitle>Business / Brand</CardTitle>
              <CardDescription>Start your onboarding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Company name" value={lead.company_name} onChange={(e) => setLead({ ...lead, company_name: e.target.value })} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Contact name" value={lead.contact_name} onChange={(e) => setLead({ ...lead, contact_name: e.target.value })} />
                <Input type="email" placeholder="Contact email" value={lead.contact_email} onChange={(e) => setLead({ ...lead, contact_email: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Phone (optional)" value={lead.contact_phone} onChange={(e) => setLead({ ...lead, contact_phone: e.target.value })} />
                <Input placeholder="Website" value={lead.website} onChange={(e) => setLead({ ...lead, website: e.target.value })} />
              </div>
              <Input placeholder="Industry" value={lead.industry} onChange={(e) => setLead({ ...lead, industry: e.target.value })} />
              <Textarea placeholder="Briefly describe your goals / requirements" value={lead.requirements} onChange={(e) => setLead({ ...lead, requirements: e.target.value })} />
              <Button className="w-full" onClick={submitLead} disabled={leadSubmitting}>
                {leadSubmitting ? "Submitting..." : "Continue to scheduling"}
              </Button>
              <p className="text-xs text-muted-foreground">Next: pick a time for a discovery call.</p>
            </CardContent>
          </Card>
        )}

        {leadId && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pick a date</CardTitle>
                <CardDescription>Choose a date for your discovery call.</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Available times</CardTitle>
                <CardDescription>30-minute slots (Google Calendar)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableSlots.length === 0 && <p className="text-sm text-muted-foreground">Select a date to see slots.</p>}
                  {availableSlots.map((s) => (
                    <div key={s} className="flex items-center justify-between rounded border p-3">
                      <span>{new Date(s).toLocaleString()}</span>
                      <Button size="sm" onClick={() => book(s)} disabled={booking}>Book</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground">
          <p>
            Are you a creator? {""}
            <Link href="/login" className="underline">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

