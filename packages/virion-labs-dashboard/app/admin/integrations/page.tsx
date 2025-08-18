"use client"

import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClientDiscordConnections } from '@/hooks/use-client-discord-connections'
import { Bot, RefreshCw, Hash, Crown, Clock, CheckCircle2, AlertCircle, Volume2, FolderTree, Mic2, Megaphone, MessageSquare, Shield, Building2, ExternalLink, ChevronDown as ChevronDownIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/components/auth-provider'
import { useState } from 'react'

function DiscordServerCard({ connection, onAssignVerifiedRole }: { connection: any, onAssignVerifiedRole: (connectionId: string, guildId: string, roleId: string, roleName: string) => void }) {
  const [channelsExpanded, setChannelsExpanded] = useState(false)
  const [rolesExpanded, setRolesExpanded] = useState(false)
  
  const truncateTitle = (title: string, maxLength: number = 10) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + '...'
  }
  
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
        <div className="flex items-start justify-between mb-3">
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
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg" title={connection.guild_name || connection.guild_id}>
                {truncateTitle(connection.guild_name || connection.guild_id)}
              </CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                <span>Client ID: {connection.client_id || 'N/A'}</span>
              </div>
            </div>
          </div>
          <Badge className={`text-xs border shrink-0 ${status === 'connected' ? 'bg-green-50 text-green-700 border-green-200' : status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {status === 'pending' ? (
              <span className="inline-flex items-center">
                <Clock className="h-3 w-3 mr-1" /> Pending sync
              </span>
            ) : (
              <span className="inline-flex items-center gap-2" title={connection.last_synced_at ? new Date(connection.last_synced_at).toLocaleString() : 'Never synced'}>
                <span className="inline-flex items-center">
                  {status === 'connected' ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Synced</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 mr-1" /> Not connected</>
                  )}
                </span>
                <span className="opacity-75">
                  {formatLastSync(connection.last_synced_at)}
                </span>
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Channels Section - Always show */}
        <div className="space-y-2">
          <Collapsible open={channelsExpanded} onOpenChange={setChannelsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-9 px-3 hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Channels</span>
                  <Badge variant="secondary" className="text-xs h-5">
                    {connection.channels?.length || 0}
                  </Badge>
                </div>
                {channelsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-2">
              <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md bg-muted/20 p-2">
                {connection.channels && connection.channels.length > 0 ? (
                  connection.channels
                    .sort((a: any, b: any) => {
                      // Sort by type first (text channels first), then by name
                      if (a.type !== b.type) {
                        const typeOrder = [0, 5, 15, 4, 2, 13]; // text, announcement, forum, category, voice, stage
                        return (typeOrder.indexOf(a.type) || 999) - (typeOrder.indexOf(b.type) || 999);
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map((channel: any) => (
                      <div key={channel.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-background/80 transition-colors">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {channelIcon(channel.type)}
                          <span className="text-sm">#{channel.name}</span>
                          {channel.topic && (
                            <span className="text-xs text-muted-foreground truncate ml-2" title={channel.topic}>
                              — {channel.topic}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0">
                          {formatChannelType(channel.type)}
                        </Badge>
                      </div>
                    ))
                ) : (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <span className="text-sm">No channels available</span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Roles Section - Always show */}
        <div className="space-y-2">
          <Collapsible open={rolesExpanded} onOpenChange={setRolesExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-9 px-3 hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Roles</span>
                  <Badge variant="secondary" className="text-xs h-5">
                    {connection.roles?.filter((role: any) => role.name !== '@everyone').length || 0}
                  </Badge>
                </div>
                {rolesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-2">
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border rounded-md bg-muted/20 p-2">
                {connection.roles && connection.roles.filter((role: any) => role.name !== '@everyone').length > 0 ? (
                  connection.roles
                    .filter((role: any) => role.name !== '@everyone')
                    .sort((a: any, b: any) => {
                      // Sort by member count (desc) then name
                      if (a.memberCount && b.memberCount && a.memberCount !== b.memberCount) {
                        return b.memberCount - a.memberCount;
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map((role: any) => {
                      const isVerifiedRole = connection.verified_role_id === role.id
                      return (
                        <div 
                          key={role.id} 
                          className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-full hover:bg-muted/50 transition-colors text-sm group relative ${
                            isVerifiedRole 
                              ? 'bg-green-50 border-green-300 ring-1 ring-green-200' 
                              : 'bg-background'
                          }`}
                        >
                          <div 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: formatColor(role.color) }}
                          />
                          <span className="font-medium">
                            {role.name?.startsWith('@') ? role.name : `@${role.name}`}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {role.memberCount ?? '?'}
                          </Badge>
                          {isVerifiedRole && (
                            <Badge className="text-[9px] h-4 px-1.5 bg-green-600 hover:bg-green-700 text-white ml-1">
                              <Shield className="h-2 w-2 mr-0.5" />
                              Verified
                            </Badge>
                          )}
                          {!isVerifiedRole && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0 ml-2 text-[10px] transition-opacity"
                              onClick={() => {
                                onAssignVerifiedRole(
                                  connection.documentId || connection.id?.toString() || '', 
                                  connection.guild_id,
                                  role.id, 
                                  role.name
                                )
                              }}
                              title="Set as verified role"
                            >
                              <Shield className="h-2.5 w-2.5" />
                            </Button>
                          )}
                        </div>
                      )
                    })
                ) : (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <span className="text-sm">No roles available</span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        {/* Verified Role Assignment Section */}
        {status === 'connected' && (
          <div className="mt-3 p-3 rounded-lg border bg-green-50/50 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-green-900 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Verified Role Assignment
              </h4>
            </div>
            <p className="text-xs text-green-800 mb-2">
              Hover over any role above and click the shield icon to set it as the verified role for this server.
            </p>
            {connection.verified_role_id && (
              <div className="flex items-center gap-2 text-xs text-green-800">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span>Current verified role: <code className="px-1 py-0.5 bg-green-100 rounded font-mono">
                  {(() => {
                    const verifiedRole = connection.roles?.find((role: any) => role.id === connection.verified_role_id)
                    return verifiedRole ? (verifiedRole.name?.startsWith('@') ? verifiedRole.name : `@${verifiedRole.name}`) : connection.verified_role_id
                  })()} 
                </code></span>
              </div>
            )}
          </div>
        )}

        {/* Status Message */}
        <div className={`mt-3 p-3 rounded-lg border ${
          status === 'pending' 
            ? 'bg-orange-50/50 border-orange-200 text-orange-800' 
            : status === 'connected'
            ? 'bg-blue-50/50 border-blue-200 text-blue-800'
            : 'bg-slate-50/50 border-slate-200 text-slate-800'
        }`}>
          <p className="text-xs">
            {status === 'pending' ? (
              <>Client needs to run <code className="px-1.5 py-0.5 bg-orange-100 rounded font-mono text-[11px]">/sync</code> in their Discord server to complete setup.</>
            ) : status === 'connected' ? (
              <>Data updated when client runs <code className="px-1.5 py-0.5 bg-blue-100 rounded font-mono text-[11px]">/sync</code> command.</>
            ) : (
              <>Client needs to install bot and run <code className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[11px]">/sync</code> command.</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminIntegrationsPage() {
  const [selectedClientId, setSelectedClientId] = useState<string>('all')
  const { connections, loading, error, refetch, assignVerifiedRole, installUrl, campaignBotInstallUrl } = useClientDiscordConnections(selectedClientId === 'all' ? undefined : selectedClientId)
  const { profile } = useAuth()

  // Check if user is platform administrator
  const isPlatformAdmin = () => {
    const roleName = typeof profile?.role === 'string'
      ? profile.role.toLowerCase()
      : (profile as any)?.role?.name?.toLowerCase?.()
    return roleName === 'platform administrator' || roleName === 'admin'
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAssignVerifiedRole = async (connectionId: string, guildId: string, roleId: string, roleName: string) => {
    const result = await assignVerifiedRole(connectionId, guildId, roleId)
    if (result.success) {
      // Success feedback will be shown via toast in the hook
    } else {
      // Error feedback will be shown via toast in the hook
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "platform administrator"]}>
      <DashboardLayout>
        <div className="max-w-7xl p-6 mx-auto space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Platform Integrations</h1>
            <p className="text-muted-foreground">View and manage all client Discord connections across the platform.</p>
          </div>

          <div className="space-y-6">
            {/* Discord Integration Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" /> Discord Integration Management
                    </CardTitle>
                    <CardDescription>Monitor all client Discord server connections, manage their sync status, and install the bot for clients.</CardDescription>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All clients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All clients</SelectItem>
                        {/* Note: In production, you'd want to populate this with actual client data */}
                      </SelectContent>
                    </Select>
                    {isPlatformAdmin() && campaignBotInstallUrl ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" disabled={!installUrl && !campaignBotInstallUrl}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Install Bot
                            <ChevronDownIcon className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild>
                            <a href={installUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center w-full">
                              <Bot className="h-4 w-4 mr-2" />
                              Client Bot
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={campaignBotInstallUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center w-full">
                              <Bot className="h-4 w-4 mr-2" />
                              Campaign Bot
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button asChild disabled={!installUrl} size="sm">
                        <a href={installUrl || '#'} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" /> 
                          {installUrl ? 'Install Bot' : 'Loading...'}
                        </a>
                      </Button>
                    )}
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
                      {isPlatformAdmin() && !campaignBotInstallUrl && (
                        <><br />Campaign Bot installation is also unavailable - please configure DISCORD_CAMPAIGN_BOT_CLIENT_ID.</>
                      )}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{connections.length}</div>
                  <p className="text-xs text-muted-foreground">Discord servers connected</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {connections.filter(c => c.connection_status === 'connected' || (!c.connection_status && c.last_synced_at)).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Synced and active</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Setup</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {connections.filter(c => c.connection_status === 'pending' || (!c.connection_status && !c.last_synced_at)).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting sync command</p>
                </CardContent>
              </Card>
            </div>

            {/* Connected Servers */}
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="text-muted-foreground">Loading Discord connections...</span>
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
                      <h3 className="text-xl font-semibold">No Discord Connections Found</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        {selectedClientId !== 'all' ? 
                          'This client has not connected any Discord servers yet. You can install the bot for them using the "Install Bot" button above.' :
                          'No clients have connected their Discord servers yet. You can help by installing the bot using the "Install Bot" button above, or encourage your clients to set up their integrations.'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {selectedClientId !== 'all' ? 'Client' : 'All'} Discord Connections ({connections.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {connections.filter(c => c.connection_status === 'connected' || (!c.connection_status && c.last_synced_at)).length} active
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {connections.filter(c => c.connection_status === 'pending' || (!c.connection_status && !c.last_synced_at)).length} pending
                    </Badge>
                  </div>
                </div>
                
                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {connections.map((connection) => (
                    <DiscordServerCard 
                      key={`${connection.id}-${connection.guild_id}`} 
                      connection={connection}
                      onAssignVerifiedRole={handleAssignVerifiedRole}
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