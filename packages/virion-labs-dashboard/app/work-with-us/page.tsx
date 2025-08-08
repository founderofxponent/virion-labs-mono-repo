"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import api from "@/lib/api"

export default function WorkWithUsPage() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [booking, setBooking] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const leadId = params.get("lead") || undefined

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

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
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
    </div>
  )
}

