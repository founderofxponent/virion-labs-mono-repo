"use client"

import { useMemo, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useBotCampaignsAPI, getCampaignStatus } from '@/hooks/use-bot-campaigns-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function ClientsCampaignsPage() {
  const { profile } = useAuth()
  const [search, setSearch] = useState('')
  const filters = useMemo(() => ({}), [])
  const { campaigns, loading } = useBotCampaignsAPI(filters)

  const filtered = campaigns.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.client?.name && c.client.name.toLowerCase().includes(q)) ||
      c.guild_id.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">View and manage your campaigns</p>
        </div>
        <Link href="/onboarding">
          <Button>Create Campaign</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns {loading ? '' : `(${filtered.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaigns found.</p>
          ) : (
            <div className="grid gap-4">
              {filtered.map(c => (
                <div key={c.documentId || c.id} className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{c.name}</h3>
                      <p className="text-sm text-muted-foreground">Guild: {c.guild_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getCampaignStatus(c)}</Badge>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
