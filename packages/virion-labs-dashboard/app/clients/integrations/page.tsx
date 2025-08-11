"use client"

import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useClientDiscordConnections } from '@/hooks/use-client-discord-connections'
import { Bot, RefreshCw, ExternalLink, Hash, Crown, Users, Clock, Zap, CheckCircle2, AlertCircle, Volume2, FolderTree, Mic2, Megaphone, MessageSquare, ChevronRight, Shield, Star } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

function DiscordServerCard({ connection }: { connection: any }) {
  const [channelsExpanded, setChannelsExpanded] = useState(false)
  const [rolesExpanded, setRolesExpanded] = useState(false)
  
  const formatChannelType = (type?: number) => {
    switch (type) {
      case 0: return 'Text'
      case 2: return 'Voice'
      case 4: return 'Category'
      case 5: return 'Announcement'
      case 13: return 'Stage'
      case 15: return 'Forum'
      default: return 'Unknown'
    }
  }

  const formatColor = (color?: number) => {
    if (!color || color === 0) return '#99AAB5'
    return `#${color.toString(16).padStart(6, '0')}`
  }

  const formatLastSync = (lastSynced?: string) => {
    if (!lastSynced) return 'Never synced'
    const date = new Date(lastSynced)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const channelIcon = (type?: number) => {
    const cls = "h-3 w-3 text-muted-foreground shrink-0"
    switch (type) {
      case 0: return <Hash className={cls} />
      case 2: return <Volume2 className={cls} />
      case 4: return <FolderTree className={cls} />
      case 5: return <Megaphone className={cls} />
      case 13: return <Mic2 className={cls} />
      case 15: return <MessageSquare className={cls} />
      default: return <Hash className={cls} />
    }
  }

  const status: 'connected' | 'pending' | 'not_connected' = (connection.connection_status || (connection.last_synced_at ? 'connected' : 'pending'))

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {connection.guild_icon_url ? (
              <img 
                src={connection.guild_icon_url} 
                alt={`${connection.guild_name} icon`}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{connection.guild_name || connection.guild_id}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-3 w-3" />
                <span>{connection.channels?.length || 0} channels</span>
                <Crown className="h-3 w-3 ml-2" />
                <span>{connection.roles?.length || 0} roles</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={`text-xs border ${status === 'connected' ? 'bg-green-50 text-green-700 border-green-200' : status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              {status === 'connected' ? (
                <span className="inline-flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Synced</span>
              ) : status === 'pending' ? (
                <span className="inline-flex items-center"><Clock className="h-3 w-3 mr-1" /> Pending sync</span>
              ) : (
                <span className="inline-flex items-center"><AlertCircle className="h-3 w-3 mr-1" /> Not connected</span>
              )}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span title={connection.last_synced_at ? new Date(connection.last_synced_at).toLocaleString() : 'Never synced'}>
                {formatLastSync(connection.last_synced_at)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Channels Section */}
        {connection.channels && connection.channels.length > 0 && (
          <div className="space-y-3">
            <Collapsible open={channelsExpanded} onOpenChange={setChannelsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-8">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span className="text-sm font-medium">Channels</span>
                    <Badge variant="secondary" className="text-xs">
                      {connection.channels.length}
                    </Badge>
                  </div>
                  {channelsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-3">
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {connection.channels
                    .sort((a: any, b: any) => {
                      // Sort by type first (text channels first), then by name
                      if (a.type !== b.type) {
                        const typeOrder = [0, 5, 15, 4, 2, 13]; // text, announcement, forum, category, voice, stage
                        return (typeOrder.indexOf(a.type) || 999) - (typeOrder.indexOf(b.type) || 999);
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map((channel: any) => (
                      <div key={channel.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {channelIcon(channel.type)}
                          <span className="text-sm font-medium">#{channel.name}</span>
                          {channel.topic && (
                            <span className="text-xs text-muted-foreground truncate ml-2" title={channel.topic}>
                              — {channel.topic}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {formatChannelType(channel.type)}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Roles Section */}
        {connection.roles && connection.roles.length > 0 && (
          <div className="space-y-3">
            <Collapsible open={rolesExpanded} onOpenChange={setRolesExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-8">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    <span className="text-sm font-medium">Roles</span>
                    <Badge variant="secondary" className="text-xs">
                      {connection.roles.filter((role: any) => role.name !== '@everyone').length}
                    </Badge>
                  </div>
                  {rolesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-3">
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {connection.roles
                    .filter((role: any) => role.name !== '@everyone')
                    .sort((a: any, b: any) => {
                      // Sort by member count (desc) then name
                      if (a.memberCount && b.memberCount && a.memberCount !== b.memberCount) {
                        return b.memberCount - a.memberCount;
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map((role: any) => (
                      <div 
                        key={role.id} 
                        className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 border rounded-full hover:bg-muted/40 transition-colors"
                      >
                        <div 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: formatColor(role.color) }}
                        />
                        <span className="text-sm font-medium">
                          {role.name?.startsWith('@') ? role.name : `@${role.name}`}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {role.memberCount ?? '?'}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
        
        <div className={`mt-4 p-3 rounded-lg ${
          status === 'pending' 
            ? 'bg-orange-50 border border-orange-200' 
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-xs ${
            status === 'pending' ? 'text-orange-800' : 'text-blue-800'
          }`}>
            {status === 'pending' ? (
              <>Run <code className="px-1 py-0.5 bg-orange-100 rounded font-mono">/sync</code> in your Discord server then click Refresh to complete setup.</>
            ) : status === 'connected' ? (
              <>Run <code className="px-1 py-0.5 bg-blue-100 rounded font-mono">/sync</code> in your Discord server to refresh this data.</>
            ) : (
              <>Install the bot above, then run <code className="px-1 py-0.5 bg-blue-100 rounded font-mono">/sync</code> in your Discord server to get started.</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ClientIntegrationsPage() {
  const { connections, loading, error, saving, upsert, refetch, installUrl } = useClientDiscordConnections()

  return (
    <ProtectedRoute allowedRoles={["client", "admin", "Platform Administrator"]}>
      <DashboardLayout>
        <div className="max-w-5xl p-6 mx-auto space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-muted-foreground">Connect third-party apps to power your campaigns.</p>
          </div>

          <div className="space-y-6">
            {/* Discord Integration Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" /> Discord Integration
                    </CardTitle>
                    <CardDescription>Connect and manage your Discord servers for campaigns.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild disabled={!installUrl} size="sm">
                      <a href={installUrl || '#'} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" /> 
                        {installUrl ? 'Install Bot' : 'Loading...'}
                      </a>
                    </Button>
                    <Button variant="outline" onClick={refetch} disabled={loading} size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {error && (
                <CardContent className="pt-0">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-sm text-red-800 font-medium">Connection Error</p>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </CardContent>
              )}

              {!installUrl && !loading && !error && (
                <CardContent className="pt-0">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-sm text-yellow-800 font-medium">Setup Required</p>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Bot installation URL is not available. Please check your configuration or contact support.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Connected Servers or Getting Started */}
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="text-muted-foreground">Loading your Discord servers...</span>
                  </div>
                </CardContent>
              </Card>
            ) : connections.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-12">
                  <div className="text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="p-4 bg-primary/10 rounded-full">
                        <Bot className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Connect Your First Discord Server</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Get started by connecting your Discord server to unlock powerful campaign management features.
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto text-left">
                      <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Quick Setup Guide
                      </h4>
                      <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                        <li>Click <strong>"Install Bot"</strong> above</li>
                        <li>Choose your Discord server and grant permissions</li>
                        <li>Type <code className="px-2 py-1 bg-blue-100 rounded font-mono text-xs">/sync</code> in any channel</li>
                        <li>Your server details will appear here automatically</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Connected Servers ({connections.length})</h3>
                  <Badge variant="outline" className="text-xs">
                    {connections.filter(c => c.connection_status === 'connected' || (!c.connection_status && c.last_synced_at)).length} active
                  </Badge>
                </div>
                
                <div className="grid gap-6 lg:grid-cols-2">
                  {connections.map((connection) => (
                    <DiscordServerCard 
                      key={`${connection.id}-${connection.guild_id}`} 
                      connection={connection} 
                    />
                  ))}
                </div>
              </div>
            )}

            
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

