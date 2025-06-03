"use client"

import { useState, useEffect } from 'react'

export interface Bot {
  id: string
  name: string
  client_id: string
  discord_bot_id?: string
  discord_token?: string
  status: 'Online' | 'Offline' | 'Maintenance' | 'Error'
  template: 'standard' | 'advanced' | 'custom'
  prefix?: string
  description?: string
  auto_deploy?: boolean
  servers?: number
  users?: number
  commands_used?: number
  uptime_percentage?: number
  last_online?: string | null
  avatar_url?: string
  invite_url?: string
  webhook_url?: string
  deployment_id?: string
  server_endpoint?: string
  created_at: string
  updated_at: string
  client?: {
    id: string
    name: string
    industry?: string
  }
}

export interface CreateBotData {
  name: string
  client_id: string
  template: 'standard' | 'advanced' | 'custom'
  prefix?: string
  description?: string
  auto_deploy?: boolean
  avatar_url?: string
  webhook_url?: string
  discord_application_id: string
  discord_bot_token: string
}

export interface BotStats {
  totalBots: number
  onlineBots: number
  totalServers: number
  totalUsers: number
  totalCommands: number
  avgUptime: number
  onlinePercentage: number
  avgServersPerBot: number
  avgUsersPerBot: number
}

export function useBots(clientId?: string) {
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBots = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = clientId ? `/api/bots?client_id=${clientId}` : '/api/bots'
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch bots')
      }
      
      const data = await response.json()
      setBots(data.bots || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bots')
    } finally {
      setLoading(false)
    }
  }

  const createBot = async (botData: CreateBotData): Promise<{ success: boolean; bot?: Bot; error?: string }> => {
    try {
      const response = await fetch('/api/bots/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(botData),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error }
      }

      // Refresh the bot list
      await fetchBots()

      return { success: true, bot: result.bot }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to create bot' 
      }
    }
  }

  // Alias for createBot to match component expectations
  const addBot = async (botData: CreateBotData): Promise<{ error?: string }> => {
    const result = await createBot(botData)
    return { error: result.error }
  }

  const controlBot = async (botId: string, action: 'start' | 'stop' | 'restart'): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/bots/${botId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error }
      }

      // Update the bot in local state
      setBots(prevBots => 
        prevBots.map(bot => 
          bot.id === botId ? { ...bot, ...result.bot } : bot
        )
      )

      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to control bot' 
      }
    }
  }

  const deleteBot = async (botId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        return { success: false, error: result.error }
      }

      // Remove the bot from local state
      setBots(prevBots => prevBots.filter(bot => bot.id !== botId))

      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete bot' 
      }
    }
  }

  const getBotById = async (botId: string): Promise<{ data?: Bot; error?: string }> => {
    try {
      const response = await fetch(`/api/bots/${botId}`)
      
      if (!response.ok) {
        const result = await response.json()
        return { error: result.error || 'Failed to fetch bot' }
      }
      
      const data = await response.json()
      return { data: data.bot }
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to fetch bot' 
      }
    }
  }

  const updateBot = async (botId: string, updates: Partial<Bot>): Promise<{ data?: Bot; error?: string }> => {
    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const result = await response.json()

      if (!response.ok) {
        return { error: result.error || 'Failed to update bot' }
      }

      // Update the bot in local state
      setBots(prevBots => 
        prevBots.map(bot => 
          bot.id === botId ? { ...bot, ...result.bot } : bot
        )
      )

      return { data: result.bot }
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to update bot' 
      }
    }
  }

  const getStats = (): BotStats => {
    const totalBots = bots.length
    const onlineBots = bots.filter(bot => bot.status === 'Online').length
    const totalServers = bots.reduce((sum, bot) => sum + (bot.servers || 0), 0)
    const totalUsers = bots.reduce((sum, bot) => sum + (bot.users || 0), 0)
    const totalCommands = bots.reduce((sum, bot) => sum + (bot.commands_used || 0), 0)
    const avgUptime = totalBots > 0 ? bots.reduce((sum, bot) => sum + (bot.uptime_percentage || 0), 0) / totalBots : 0
    const onlinePercentage = totalBots > 0 ? (onlineBots / totalBots) * 100 : 0
    const avgServersPerBot = totalBots > 0 ? totalServers / totalBots : 0
    const avgUsersPerBot = totalBots > 0 ? totalUsers / totalBots : 0

    return {
      totalBots,
      onlineBots,
      totalServers,
      totalUsers,
      totalCommands,
      avgUptime,
      onlinePercentage,
      avgServersPerBot,
      avgUsersPerBot
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
        return 'default'
      case 'offline':
        return 'secondary'
      case 'maintenance':
        return 'outline'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatLastOnline = (lastOnline: string | null): string => {
    if (!lastOnline) return 'Never'
    
    const now = new Date()
    const then = new Date(lastOnline)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return then.toLocaleDateString()
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getBotsStats = async (): Promise<BotStats | null> => {
    try {
      const response = await fetch('/api/bots/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch bot stats')
      }
      
      const data = await response.json()
      return data.stats
    } catch (err) {
      console.error('Error fetching bot stats:', err)
      return null
    }
  }

  useEffect(() => {
    fetchBots()
  }, [clientId])

  return {
    bots,
    loading,
    error,
    refreshBots: fetchBots,
    addBot,
    createBot,
    controlBot,
    deleteBot,
    getBotById,
    updateBot,
    getStats,
    getStatusVariant,
    formatLastOnline,
    formatDate,
    getBotsStats
  }
} 