import { useState, useEffect } from 'react'
import { adaptiveBotService, BotConfiguration, DiscordActivity, VirionBotInstance } from '@/lib/adaptive-bot-service'

// Hook for bot configurations
export function useBotConfigurations(filters?: { client_id?: string; guild_id?: string }) {
  const [configurations, setConfigurations] = useState<BotConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfigurations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adaptiveBotService.getBotConfigurations(filters)
      setConfigurations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch configurations')
    } finally {
      setLoading(false)
    }
  }

  const createConfiguration = async (config: Partial<BotConfiguration>) => {
    try {
      setError(null)
      const newConfig = await adaptiveBotService.createBotConfiguration(config)
      setConfigurations(prev => [newConfig, ...prev])
      return { success: true, configuration: newConfig }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create configuration'
      setError(error)
      return { success: false, error }
    }
  }

  const updateConfiguration = async (id: string, updates: Partial<BotConfiguration>) => {
    try {
      setError(null)
      const updatedConfig = await adaptiveBotService.updateBotConfiguration(id, updates)
      setConfigurations(prev => 
        prev.map(config => config.id === id ? updatedConfig : config)
      )
      return { success: true, configuration: updatedConfig }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update configuration'
      setError(error)
      return { success: false, error }
    }
  }

  const deleteConfiguration = async (id: string) => {
    try {
      setError(null)
      await adaptiveBotService.deleteBotConfiguration(id)
      setConfigurations(prev => prev.filter(config => config.id !== id))
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete configuration'
      setError(error)
      return { success: false, error }
    }
  }

  const refreshConfigurations = () => {
    fetchConfigurations()
  }

  useEffect(() => {
    fetchConfigurations()
  }, [filters?.client_id, filters?.guild_id])

  return {
    configurations,
    loading,
    error,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    refreshConfigurations
  }
}

// Hook for Discord activities
export function useDiscordActivities(filters?: { 
  client_id?: string
  guild_id?: string
  activity_type?: string 
}) {
  const [activities, setActivities] = useState<DiscordActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adaptiveBotService.getDiscordActivities(filters)
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities')
    } finally {
      setLoading(false)
    }
  }

  const createActivity = async (activity: Partial<DiscordActivity>) => {
    try {
      setError(null)
      const newActivity = await adaptiveBotService.createDiscordActivity(activity)
      setActivities(prev => [newActivity, ...prev])
      return { success: true, activity: newActivity }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create activity'
      setError(error)
      return { success: false, error }
    }
  }

  const updateActivity = async (id: string, updates: Partial<DiscordActivity>) => {
    try {
      setError(null)
      const updatedActivity = await adaptiveBotService.updateDiscordActivity(id, updates)
      setActivities(prev => 
        prev.map(activity => activity.id === id ? updatedActivity : activity)
      )
      return { success: true, activity: updatedActivity }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update activity'
      setError(error)
      return { success: false, error }
    }
  }

  const refreshActivities = () => {
    fetchActivities()
  }

  useEffect(() => {
    fetchActivities()
  }, [filters?.client_id, filters?.guild_id, filters?.activity_type])

  return {
    activities,
    loading,
    error,
    createActivity,
    updateActivity,
    refreshActivities
  }
}

// Hook for Virion bot instance management
export function useVirionBot() {
  const [bot, setBot] = useState<VirionBotInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBot = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adaptiveBotService.getVirionBotInstance()
      setBot(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bot instance')
    } finally {
      setLoading(false)
    }
  }

  const updateBot = async (updates: Partial<VirionBotInstance>) => {
    try {
      setError(null)
      const updatedBot = await adaptiveBotService.updateVirionBotInstance(updates)
      setBot(updatedBot)
      return { success: true, bot: updatedBot }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update bot'
      setError(error)
      return { success: false, error }
    }
  }

  const controlBot = async (action: 'start' | 'stop' | 'restart' | 'health_check') => {
    try {
      setError(null)
      const updatedBot = await adaptiveBotService.controlVirionBot(action)
      setBot(updatedBot)
      return { success: true, bot: updatedBot }
    } catch (err) {
      const error = err instanceof Error ? err.message : `Failed to ${action} bot`
      setError(error)
      return { success: false, error }
    }
  }

  const refreshBot = () => {
    fetchBot()
  }

  useEffect(() => {
    fetchBot()
  }, [])

  return {
    bot,
    loading,
    error,
    updateBot,
    controlBot,
    refreshBot
  }
}

// Hook for configuration statistics
export function useConfigurationStats() {
  const [stats, setStats] = useState<{
    total_configurations: number
    active_configurations: number
    configurations_by_template: Record<string, number>
    recent_activity: any[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adaptiveBotService.getConfigurationStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = () => {
    fetchStats()
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refreshStats
  }
}

// Hook for guild-specific configurations
export function useGuildConfiguration(guildId: string, clientId?: string) {
  const [configuration, setConfiguration] = useState<BotConfiguration | null>(null)
  const [activities, setActivities] = useState<DiscordActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGuildData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [configData, activitiesData] = await Promise.all([
        adaptiveBotService.getConfigurationForGuild(guildId, clientId),
        adaptiveBotService.getActivitiesForGuild(guildId, clientId)
      ])
      
      setConfiguration(configData)
      setActivities(activitiesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guild data')
    } finally {
      setLoading(false)
    }
  }

  const refreshGuildData = () => {
    fetchGuildData()
  }

  useEffect(() => {
    if (guildId) {
      fetchGuildData()
    }
  }, [guildId, clientId])

  return {
    configuration,
    activities,
    loading,
    error,
    refreshGuildData
  }
} 