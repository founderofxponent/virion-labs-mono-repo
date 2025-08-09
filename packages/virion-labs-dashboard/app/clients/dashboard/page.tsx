"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ClientDashboard() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Manage your product catalog.</p>
          <Link href="/clients/products">
            <Button>Go to Products</Button>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaigns</CardTitle>
            <Link href="/onboarding">
              <Button size="sm" variant="default">Create Campaign</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">View and manage your active campaigns.</p>
          <Link href="/clients/campaigns">
            <Button variant="outline">Go to Campaigns</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

