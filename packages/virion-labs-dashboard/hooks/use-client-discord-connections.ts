"use client"

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'

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
  connection_status?: 'not_connected' | 'pending' | 'connected'
  last_synced_at?: string
  verified_role_id?: string
}

export function useClientDiscordConnections(clientId?: string) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const getToken = () => localStorage.getItem('auth_token')
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [connections, setConnections] = useState<ClientDiscordConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [assigningRole, setAssigningRole] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [installUrl, setInstallUrl] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      // Build URL based on user role and client selection
      let url = `${API_BASE_URL}/api/v1/integrations/discord/client/connections`
      
      // Normalize role to string and lowercase for comparisons
      const roleName = typeof profile?.role === 'string'
        ? profile.role.toLowerCase()
        : (profile as any)?.role?.name?.toLowerCase?.()

      const isPlatformAdmin = roleName === 'platform administrator' || roleName === 'admin'

      // If user is Platform Administrator and a specific client is selected, filter by that client
      if (isPlatformAdmin && clientId) {
        url += `?client_id=${clientId}`
      }
      // If user is client, the backend should automatically filter to their client
      
      const res = await fetch(url, {
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
  }, [user, profile?.role, clientId])

  useEffect(() => { refetch() }, [refetch])

  const fetchInstallUrl = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) {
        console.log('No auth token found for install URL fetch')
        return
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/integrations/discord/client/install-url`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Failed to fetch install URL:', res.status, errorText)
        setError(`Failed to get bot installation URL: ${res.status}`)
        return
      }

      const data = await res.json()
      console.log('Install URL response:', data)
      
      if (data.install_url) {
        setInstallUrl(data.install_url)
        console.log('Install URL set:', data.install_url)
      } else {
        console.error('No install_url in response:', data)
        setError('No installation URL received from server')
      }
    } catch (error) {
      console.error('Error fetching install URL:', error)
      setError('Failed to connect to server')
    }
  }, [])

  useEffect(() => { 
    if (user) {
      fetchInstallUrl() 
    }
  }, [fetchInstallUrl, user])

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

  const assignVerifiedRole = useCallback(async (connectionId: string, guildId: string, roleId: string) => {
    setAssigningRole(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/integrations/discord/client/assign-verified-role`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection_id: connectionId,
          guild_id: guildId,
          role_id: roleId,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.detail || 'Failed to assign verified role')
      }
      const result = await res.json()
      
      // Update the local connections state with the new verified role
      setConnections(prev => prev.map(conn => {
        if ((conn.documentId === connectionId || conn.id?.toString() === connectionId) && conn.guild_id === guildId) {
          return { ...conn, verified_role_id: roleId }
        }
        return conn
      }))
      
      // Show success toast
      toast({
        title: "✅ Verified role assigned!",
        description: result.message || "The verified role has been successfully assigned to this server.",
        duration: 4000,
      })
      
      await refetch() // Refresh to get the latest data
      return { success: true, message: result.message }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      
      // Show error toast
      toast({
        title: "❌ Failed to assign verified role",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
      
      return { success: false, error: errorMessage }
    } finally {
      setAssigningRole(false)
    }
  }, [refetch, toast])

  return { connections, loading, saving, assigningRole, error, upsert, refetch, installUrl, assignVerifiedRole }
}
