"use client"

import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useClientDiscordConnections } from '@/hooks/use-client-discord-connections'
import { useAuth } from '@/components/auth-provider'
import { Bot, Link2, RefreshCw, Shield, ExternalLink } from 'lucide-react'

export default function ClientIntegrationsPage() {
  const { connections, loading, error, saving, upsert, refetch, installUrl } = useClientDiscordConnections()
  const { user } = useAuth()

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
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button asChild disabled={!installUrl}>
                    <a href={installUrl || '#'} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" /> 
                      {installUrl ? 'Install Bot' : 'Loading...'}
                    </a>
                  </Button>
                  <Button variant="outline" onClick={refetch} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                  {process.env.NODE_ENV === 'development' && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        console.log('Current installUrl:', installUrl)
                        console.log('User:', user)
                        console.log('Loading:', loading)
                        console.log('Error:', error)
                      }}
                    >
                      Debug
                    </Button>
                  )}
                </div>
                {!installUrl && !loading && !error && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Bot installation URL is not available. Please check your configuration or contact support.
                    </p>
                  </div>
                )}
                {connections.length === 0 && !loading && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">How to connect your Discord server:</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Click "Install Bot" above</li>
                      <li>Select your Discord server and authorize the bot</li>
                      <li>Run <code className="px-1 py-0.5 bg-blue-100 rounded">/sync</code> in your server</li>
                      <li>Your server will appear here automatically</li>
                    </ol>
                  </div>
                )}
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
                          <div className="text-xs text-muted-foreground mt-2">
                            Run <code className="px-1 py-0.5 bg-muted rounded">/sync</code> in Discord to refresh server data.
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
