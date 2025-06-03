import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch all bots from database
    const { data: bots, error } = await supabase
      .from('bots')
      .select('*')

    if (error) {
      throw error
    }

    const botsArray = bots || []
    const totalBots = botsArray.length
    const onlineBots = botsArray.filter(bot => bot.status === 'Online').length
    const totalServers = botsArray.reduce((sum, bot) => sum + (bot.servers || 0), 0)
    const totalUsers = botsArray.reduce((sum, bot) => sum + (bot.users || 0), 0)
    const totalCommands = botsArray.reduce((sum, bot) => sum + (bot.commands_used || 0), 0)
    const avgUptime = totalBots > 0 
      ? botsArray.reduce((sum, bot) => sum + (bot.uptime_percentage || 0), 0) / totalBots 
      : 0

    const stats = {
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

    return NextResponse.json({
      stats
    })

  } catch (error) {
    console.error('Error fetching bot stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 