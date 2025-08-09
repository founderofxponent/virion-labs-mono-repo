"use client"

import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useClientDiscordConnections } from '@/hooks/use-client-discord-connections'
import { Bot, Link2, RefreshCw, Shield, ExternalLink } from 'lucide-react'

export default function ClientIntegrationsPage() {
  const { connections, loading, error, saving, upsert, refetch, installUrl } = useClientDiscordConnections()

  const handleMockSync = async () => {
    // This would come from the client-only bot sync command webhook
    await upsert({
      guild_id: '123456789012345678',
      guild_name: 'My Gaming Community',
      channels: [
        { id: '111', name: 'general', type: 0 },
        { id: '222', name: 'announcements', type: 0 },
        { id: '333', name: 'campaigns', type: 0 },
      ],
      roles: [
        { id: 'r1', name: '@everyone', color: 0 },
        { id: 'r2', name: 'Verified', color: 5763719 },
        { id: 'r3', name: 'VIP', color: 15844367 },
      ],
    })
  }

  return (
    <ProtectedRoute allowedRoles={["client", "admin", "Platform Administrator"]}>
      <DashboardLayout>
        <div className="max-w-5xl p-6 mx-auto space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-muted-foreground">Connect third-party apps to power your campaigns.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" /> Discord
                </CardTitle>
                <CardDescription>Sync your server to manage campaigns.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2 flex-wrap">
                  <Button asChild disabled={!installUrl}>
                    <a href={installUrl || '#'} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" /> Install Bot
                    </a>
                  </Button>
                  <Button onClick={handleMockSync} disabled={saving} variant="secondary">
                    <Link2 className="h-4 w-4 mr-2" /> Sync Now
                  </Button>
                  <Button variant="outline" onClick={refetch} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Connected servers</p>
                  {loading ? (
                    <p className="text-sm">Loading...</p>
                  ) : connections.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No servers connected yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {connections.map((c) => (
                        <div key={`${c.id}-${c.guild_id}`} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium">{c.guild_name || c.guild_id}</div>
                              <div className="text-xs text-muted-foreground">{c.channels?.length || 0} channels • {c.roles?.length || 0} roles</div>
                            </div>
                            <Badge variant="secondary">{c.status || 'connected'}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Placeholder for future integrations */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" /> Coming soon
                </CardTitle>
                <CardDescription>More integrations like Slack, Notion, and GitHub.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">We’re building out a library of integrations to supercharge your campaigns.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
