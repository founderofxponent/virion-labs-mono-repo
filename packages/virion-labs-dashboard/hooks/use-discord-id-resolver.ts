"use client"

import { useMemo } from 'react'
import { useClientDiscordConnections, ClientDiscordConnection } from '@/hooks/use-client-discord-connections'
import { CampaignListItem } from '@/schemas/campaign'

interface ResolvedDiscordNames {
  guildName: string | null
  channelName: string | null
  roleNames: string[]
}

export function useDiscordIdResolver() {
  const { connections } = useClientDiscordConnections()

  const resolveCampaignDiscordNames = useMemo(() => {
    return (campaign: CampaignListItem): ResolvedDiscordNames => {
      const connection = connections.find(conn => conn.guild_id === campaign.guild_id)
      
      if (!connection) {
        return {
          guildName: null,
          channelName: null,
          roleNames: []
        }
      }

      // Resolve guild name
      const guildName = connection.guild_name || null

      // Resolve channel name
      let channelName: string | null = null
      if (campaign.channel_id && connection.channels) {
        const channel = connection.channels.find(ch => ch.id === campaign.channel_id)
        channelName = channel?.name || null
      }

      // Resolve role names (if target_role_ids exists)
      let roleNames: string[] = []
      if ((campaign as any).target_role_ids && connection.roles) {
        const targetRoleIds = Array.isArray((campaign as any).target_role_ids) 
          ? (campaign as any).target_role_ids 
          : []
        
        roleNames = targetRoleIds
          .map((roleId: string) => {
            const role = connection.roles?.find(r => r.id === roleId)
            return role?.name
          })
          .filter(Boolean) as string[]
      }

      return {
        guildName,
        channelName,
        roleNames
      }
    }
  }, [connections])

  return {
    connections,
    resolveCampaignDiscordNames
  }
}