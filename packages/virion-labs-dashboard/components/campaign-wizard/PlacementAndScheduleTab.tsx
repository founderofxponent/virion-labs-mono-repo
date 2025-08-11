import React, { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlacementAndScheduleTabProps } from "@/schemas/campaign-wizard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useClientDiscordConnections } from "@/hooks/use-client-discord-connections"
import type { ClientDiscordConnection } from "@/hooks/use-client-discord-connections"
import { useAuth } from "@/components/auth-provider"

export function PlacementAndScheduleTab({
  formData,
  handleFieldChange,
  clientId,
}: PlacementAndScheduleTabProps & { clientId?: string }) {
  const { profile } = useAuth()
  const { connections, loading, error } = useClientDiscordConnections(clientId)
  const [selectedConnection, setSelectedConnection] = useState<ClientDiscordConnection | null>(null)
  // For clients, connections are already filtered by backend
  // For admins, connections are filtered by clientId if provided
  const filteredConnections = React.useMemo(() => {
    // If user is a client, backend already filters to their connections
    if (profile?.role === 'client') {
      return connections
    }
    // If admin and clientId provided, connections are already filtered by backend
    // If admin and no clientId, show all connections
    return connections
  }, [connections, profile?.role])

  // When connections load or form guild changes, select the matching connection if any
  useEffect(() => {
    if (formData.guild_id && filteredConnections && filteredConnections.length > 0) {
      const matched = filteredConnections.find((c) => c.guild_id === formData.guild_id)
      if (matched) setSelectedConnection(matched)
    }
  }, [formData.guild_id, filteredConnections])

  // When client changes, clear selection if it no longer belongs to the selected client
  useEffect(() => {
    if (!clientId) return
    if (selectedConnection && selectedConnection.client_id !== Number(clientId)) {
      setSelectedConnection(null)
      handleFieldChange("guild_id", "")
      handleFieldChange("channel_id", "")
      handleFieldChange("target_role_ids", [])
    }
  }, [clientId])

  const handleServerSelect = (guildId: string) => {
    const connection = filteredConnections.find(c => c.guild_id === guildId)
    if (connection) {
      setSelectedConnection(connection)
      handleFieldChange("guild_id", guildId)
      // Clear channel selection when server changes
      handleFieldChange("channel_id", "")
    }
  }

  const handleChannelSelect = (channelId: string) => {
    handleFieldChange("channel_id", channelId)
  }

  const handleTargetRoleSelect = (roleId: string) => {
    handleFieldChange("target_role_ids", [roleId])
  }

  return (
    <div className="space-y-6">
      {/* Discord Server Selection */}
      <div className="space-y-2">
        <Label htmlFor="guild_id">Discord Server</Label>
        {error && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        {loading ? (
          <Input 
            disabled 
            placeholder="Loading Discord servers..." 
          />
        ) : filteredConnections.length > 0 ? (
          <Select
            value={formData.guild_id}
            onValueChange={handleServerSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a Discord server" />
            </SelectTrigger>
            <SelectContent>
              {filteredConnections.map(conn => (
                <SelectItem key={conn.guild_id} value={conn.guild_id}>
                  {conn.guild_name || conn.guild_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <Input
              id="guild_id"
              placeholder="Enter the ID of your Discord server"
              value={formData.guild_id}
              onChange={e => handleFieldChange("guild_id", e.target.value)}
            />
            {clientId && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No Discord servers have been synced. Please sync your Discord server in the Integrations section first, or manually enter the Guild ID.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>

      {/* Channel Selection */}
      <div className="space-y-2">
        <Label htmlFor="channel_id">Primary Channel</Label>
        {selectedConnection && selectedConnection.channels && selectedConnection.channels.length > 0 ? (
          <Select
            value={formData.channel_id}
            onValueChange={handleChannelSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a channel" />
            </SelectTrigger>
            <SelectContent>
              {selectedConnection.channels
                .filter(channel => channel.type === 0) // Only text channels
                .map(channel => (
                  <SelectItem key={channel.id} value={channel.id}>
                    #{channel.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="channel_id"
            placeholder="Enter the ID of the channel for the bot"
            value={formData.channel_id}
            onChange={e => handleFieldChange("channel_id", e.target.value)}
          />
        )}
      </div>

      {/* Target Role Selection */}
      <div className="space-y-2">
        <Label htmlFor="target_role_ids">Target Role</Label>
        {selectedConnection && selectedConnection.roles && selectedConnection.roles.length > 0 ? (
          <Select
            value={formData.target_role_ids?.[0] || ""}
            onValueChange={handleTargetRoleSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a target role" />
            </SelectTrigger>
            <SelectContent>
              {selectedConnection.roles.map(role => (
                <SelectItem key={role.id} value={role.id}>
                  @{role.name}
                  {role.memberCount && ` (${role.memberCount} members)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            placeholder="Enter the ID of the target role"
            value={formData.target_role_ids?.[0] || ""}
            onChange={e => handleFieldChange("target_role_ids", e.target.value ? [e.target.value] : [])}
          />
        )}
      </div>

      {/* Date Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="start_date">Campaign Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={e =>
              handleFieldChange("start_date", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Campaign End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={e =>
              handleFieldChange("end_date", e.target.value)
            }
          />
        </div>
      </div>
    </div>
  )
}
