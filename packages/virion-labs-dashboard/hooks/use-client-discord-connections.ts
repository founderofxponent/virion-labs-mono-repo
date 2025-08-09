"use client"

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'

export interface DiscordChannel { id: string; name: string; type?: number; topic?: string | null }
export interface DiscordRole { id: string; name: string; color?: number; memberCount?: number }
export interface ClientDiscordConnection {
  id?: number
  documentId?: string
  client_id?: number
  guild_id: string
  guild_name?: string
  guild_icon_url?: string
  channels?: DiscordChannel[]
  roles?: DiscordRole[]
  status?: 'not_connected' | 'pending' | 'connected'
  last_synced_at?: string
}

export function useClientDiscordConnections() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const getToken = () => localStorage.getItem('auth_token')
  const { user } = useAuth()

  const [connections, setConnections] = useState<ClientDiscordConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/integrations/discord/client/connections`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.detail || 'Failed to load connections')
      }
      const data = await res.json()
      setConnections(data.connections || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { refetch() }, [refetch])

  const upsert = useCallback(async (payload: Partial<ClientDiscordConnection>) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/integrations/discord/client/connections`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guild_id: payload.guild_id,
          guild_name: payload.guild_name,
          guild_icon_url: payload.guild_icon_url,
          channels: payload.channels,
          roles: payload.roles,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.detail || 'Failed to save connection')
      }
      await refetch()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    } finally {
      setSaving(false)
    }
  }, [refetch])

  return { connections, loading, saving, error, upsert, refetch }
}
