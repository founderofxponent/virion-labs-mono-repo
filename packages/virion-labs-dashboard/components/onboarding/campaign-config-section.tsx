import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Hash, Users, Shield, Zap, Link, Settings } from "lucide-react"

interface CampaignConfigSectionProps {
  data: {
    guild_id: string
    channel_id: string
    target_role_ids: string[]
    auto_role_assignment: boolean
    moderation_enabled: boolean
    rate_limit_per_user: number
    referral_tracking_enabled: boolean
    webhook_url: string
    campaign_start_date: string
    campaign_end_date: string
  }
  syncedServers: any[]
  onUpdate: (updates: any) => void
}

export function CampaignConfigSection({ data, syncedServers, onUpdate }: CampaignConfigSectionProps) {
  const selectedServer = syncedServers.find(server => server.guild_id === data.guild_id)
  const availableChannels = selectedServer?.channels || []
  const availableRoles = selectedServer?.roles || []

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    const updatedRoles = checked
      ? [...data.target_role_ids, roleId]
      : data.target_role_ids.filter(id => id !== roleId)
    onUpdate({ target_role_ids: updatedRoles })
  }

  // Auto-select first server if none selected
  React.useEffect(() => {
    if (!data.guild_id && syncedServers.length > 0) {
      onUpdate({ guild_id: syncedServers[0].guild_id })
    }
  }, [syncedServers, data.guild_id, onUpdate])

  if (syncedServers.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Connected Servers</h3>
        <p className="text-muted-foreground">
          Please go back to Step 3 and connect your Discord server first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Server Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Server Selection
          </CardTitle>
          <CardDescription>
            Choose which Discord server you want to run this campaign in. Manage connections in Clients → Integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="guild_id">Discord Server *</Label>
            <Select value={data.guild_id} onValueChange={value => onUpdate({ guild_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a server" />
              </SelectTrigger>
              <SelectContent>
                {syncedServers.map(server => (
                  <SelectItem key={server.guild_id} value={server.guild_id}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                        {server.guild_icon ? (
                          <img 
                            src={server.guild_icon} 
                            alt={server.guild_name}
                            className="w-full h-full rounded object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold">
                            {server.guild_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{server.guild_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {server.member_count.toLocaleString()} members
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedServer && (
        <>
          {/* Channel Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Channel Configuration
              </CardTitle>
              <CardDescription>
                Select the channel where campaign activities will take place.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="channel_id">Campaign Channel *</Label>
                <Select value={data.channel_id} onValueChange={value => onUpdate({ channel_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChannels.map((channel: any) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{channel.name}</div>
                            {channel.topic && (
                              <div className="text-xs text-muted-foreground">{channel.topic}</div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  This is where users will interact with your campaign bot.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Target Audience
              </CardTitle>
              <CardDescription>
                Select which roles can participate in this campaign. Leave empty to target all members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableRoles.map((role: any) => (
                    <div key={role.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={data.target_role_ids.includes(role.id)}
                        onCheckedChange={(checked) => handleRoleToggle(role.id, checked === true)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: `#${role.color.toString(16).padStart(6, '0')}` }}
                          />
                          <label 
                            htmlFor={`role-${role.id}`} 
                            className="font-medium cursor-pointer"
                          >
                            {role.name}
                          </label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {role.memberCount} members
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {data.target_role_ids.length > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Selected Roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {data.target_role_ids.map(roleId => {
                        const role = availableRoles.find((r: any) => r.id === roleId)
                        return role ? (
                          <Badge key={roleId} variant="secondary">
                            {role.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Campaign Schedule
              </CardTitle>
              <CardDescription>
                Set when your campaign will be active. Leave empty for no time restrictions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign_start_date">Start Date (Optional)</Label>
                  <Input
                    id="campaign_start_date"
                    type="datetime-local"
                    value={data.campaign_start_date}
                    onChange={e => onUpdate({ campaign_start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign_end_date">End Date (Optional)</Label>
                  <Input
                    id="campaign_end_date"
                    type="datetime-local"
                    value={data.campaign_end_date}
                    onChange={e => onUpdate({ campaign_end_date: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Configure advanced features for your campaign.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Role Assignment */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto_role_assignment">Auto Role Assignment</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign roles to users who complete the campaign
                  </p>
                </div>
                <Switch
                  id="auto_role_assignment"
                  checked={data.auto_role_assignment}
                  onCheckedChange={value => onUpdate({ auto_role_assignment: value })}
                />
              </div>

              {/* Moderation */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="moderation_enabled">Enable Moderation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically moderate spam and inappropriate content
                  </p>
                </div>
                <Switch
                  id="moderation_enabled"
                  checked={data.moderation_enabled}
                  onCheckedChange={value => onUpdate({ moderation_enabled: value })}
                />
              </div>

              {/* Referral Tracking */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="referral_tracking_enabled">Referral Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Track referrals and reward users for inviting others
                  </p>
                </div>
                <Switch
                  id="referral_tracking_enabled"
                  checked={data.referral_tracking_enabled}
                  onCheckedChange={value => onUpdate({ referral_tracking_enabled: value })}
                />
              </div>

              {/* Rate Limiting */}
              <div className="space-y-2">
                <Label htmlFor="rate_limit_per_user">Rate Limit (interactions per minute)</Label>
                <Input
                  id="rate_limit_per_user"
                  type="number"
                  min="1"
                  max="60"
                  value={data.rate_limit_per_user}
                  onChange={e => onUpdate({ rate_limit_per_user: parseInt(e.target.value) || 5 })}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of bot interactions per user per minute (1-60)
                </p>
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://your-app.com/webhook"
                  value={data.webhook_url}
                  onChange={e => onUpdate({ webhook_url: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Receive real-time notifications about campaign events
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}