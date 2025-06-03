import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
}

export class BotService {
  static async getAllBots(): Promise<Bot[]> {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bots:', error)
      return []
    }

    return data || []
  }

  static async getBotById(id: string): Promise<Bot | null> {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching bot:', error)
      return null
    }

    return data
  }

  static async updateBot(id: string, updates: Partial<Bot>): Promise<Bot | null> {
    const { data, error } = await supabase
      .from('bots')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating bot:', error)
      return null
    }

    return data
  }

  static async deleteBot(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('bots')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting bot:', error)
      return false
    }

    return true
  }

  static async getBotsByClientId(clientId: string): Promise<Bot[]> {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching client bots:', error)
      return []
    }

    return data || []
  }

  static async getBotsStats() {
    const bots = await this.getAllBots()
    
    const totalBots = bots.length
    const onlineBots = bots.filter(bot => bot.status === 'Online').length
    const totalServers = bots.reduce((sum, bot) => sum + (bot.servers || 0), 0)
    const totalUsers = bots.reduce((sum, bot) => sum + (bot.users || 0), 0)
    const totalCommands = bots.reduce((sum, bot) => sum + (bot.commands_used || 0), 0)
    const avgUptime = bots.length > 0 
      ? bots.reduce((sum, bot) => sum + (bot.uptime_percentage || 0), 0) / bots.length 
      : 0

    return {
      totalBots,
      onlineBots,
      totalServers,
      totalUsers,
      totalCommands,
      avgUptime,
      onlinePercentage: totalBots > 0 ? (onlineBots / totalBots) * 100 : 0,
      avgServersPerBot: totalBots > 0 ? totalServers / totalBots : 0,
      avgUsersPerBot: totalBots > 0 ? totalUsers / totalBots : 0
    }
  }
} 