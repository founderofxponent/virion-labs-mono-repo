import { supabase } from '@/lib/supabase'

export interface BotConfiguration {
  id: string
  client_id: string
  guild_id?: string
  display_name: string
  template: 'standard' | 'advanced' | 'custom'
  prefix: string
  description?: string
  avatar_url?: string
  features: Record<string, any>
  custom_commands: any[]
  response_templates: Record<string, any>
  brand_color: string
  embed_footer?: string
  welcome_message?: string
  webhook_url?: string
  api_endpoints: Record<string, any>
  external_integrations: Record<string, any>
  commands_used: number
  users_served: number
  last_activity_at?: string
  is_active: boolean
  configuration_version: number
  created_at: string
  updated_at: string
  client?: {
    id: string
    name: string
    industry: string
    logo?: string
  }
}

export interface DiscordActivity {
  id: string
  client_id: string
  activity_name: string
  activity_type: 'embedded_app' | 'activity' | 'mini_game'
  activity_config: Record<string, any>
  guild_id?: string
  channel_id?: string
  activity_url?: string
  custom_assets: Record<string, any>
  client_branding: Record<string, any>
  persistent_data: Record<string, any>
  user_data: Record<string, any>
  usage_stats: Record<string, any>
  last_used_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
  client?: {
    id: string
    name: string
    industry: string
    logo?: string
  }
}

export interface VirionBotInstance {
  id: string
  discord_application_id: string
  discord_bot_token: string
  bot_name: string
  deployment_strategy: 'centralized' | 'distributed'
  deployment_id?: string
  server_endpoint?: string
  status: 'Online' | 'Offline' | 'Maintenance' | 'Error'
  total_guilds: number
  total_users: number
  total_configurations: number
  uptime_percentage: number
  last_online?: string
  last_health_check?: string
  global_settings: Record<string, any>
  feature_flags: Record<string, any>
  created_at: string
  updated_at: string
}

export class AdaptiveBotService {
  // Bot Configurations
  async getBotConfigurations(filters?: {
    client_id?: string
    guild_id?: string
  }): Promise<BotConfiguration[]> {
    let query = supabase
      .from('bot_configurations')
      .select(`
        *,
        client:clients(id, name, industry, logo)
      `)
      .eq('is_active', true)

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id)
    }
    if (filters?.guild_id) {
      query = query.eq('guild_id', filters.guild_id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch bot configurations: ${error.message}`)
    }

    return data || []
  }

  async createBotConfiguration(config: Partial<BotConfiguration>): Promise<BotConfiguration> {
    const { data, error } = await supabase
      .from('bot_configurations')
      .insert(config)
      .select(`
        *,
        client:clients(id, name, industry, logo)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to create bot configuration: ${error.message}`)
    }

    return data
  }

  async updateBotConfiguration(id: string, updates: Partial<BotConfiguration>): Promise<BotConfiguration> {
    const { data, error } = await supabase
      .from('bot_configurations')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, industry, logo)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update bot configuration: ${error.message}`)
    }

    return data
  }

  async deleteBotConfiguration(id: string): Promise<void> {
    const { error } = await supabase
      .from('bot_configurations')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete bot configuration: ${error.message}`)
    }
  }

  // Discord Activities
  async getDiscordActivities(filters?: {
    client_id?: string
    guild_id?: string
    activity_type?: string
  }): Promise<DiscordActivity[]> {
    let query = supabase
      .from('discord_activities')
      .select(`
        *,
        client:clients(id, name, industry, logo)
      `)
      .eq('is_active', true)

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id)
    }
    if (filters?.guild_id) {
      query = query.eq('guild_id', filters.guild_id)
    }
    if (filters?.activity_type) {
      query = query.eq('activity_type', filters.activity_type)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch Discord activities: ${error.message}`)
    }

    return data || []
  }

  async createDiscordActivity(activity: Partial<DiscordActivity>): Promise<DiscordActivity> {
    const { data, error } = await supabase
      .from('discord_activities')
      .insert(activity)
      .select(`
        *,
        client:clients(id, name, industry, logo)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to create Discord activity: ${error.message}`)
    }

    return data
  }

  async updateDiscordActivity(id: string, updates: Partial<DiscordActivity>): Promise<DiscordActivity> {
    const { data, error } = await supabase
      .from('discord_activities')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, industry, logo)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update Discord activity: ${error.message}`)
    }

    return data
  }

  // Virion Bot Instance Management
  async getVirionBotInstance(): Promise<VirionBotInstance> {
    const { data, error } = await supabase
      .from('virion_bot_instances')
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to fetch Virion bot instance: ${error.message}`)
    }

    return data
  }

  async updateVirionBotInstance(updates: Partial<VirionBotInstance>): Promise<VirionBotInstance> {
    const { data: existingBot } = await supabase
      .from('virion_bot_instances')
      .select('id')
      .single()

    if (!existingBot) {
      throw new Error('Virion bot instance not found')
    }

    const { data, error } = await supabase
      .from('virion_bot_instances')
      .update(updates)
      .eq('id', existingBot.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update Virion bot instance: ${error.message}`)
    }

    return data
  }

  async controlVirionBot(action: 'start' | 'stop' | 'restart' | 'health_check'): Promise<VirionBotInstance> {
    const response = await fetch('/api/virion-bot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to control bot')
    }

    const result = await response.json()
    return result.bot
  }

  // Configuration Management
  async getConfigurationForGuild(guildId: string, clientId?: string): Promise<BotConfiguration | null> {
    let query = supabase
      .from('bot_configurations')
      .select(`
        *,
        client:clients(id, name, industry, logo)
      `)
      .eq('guild_id', guildId)
      .eq('is_active', true)

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Failed to fetch guild configuration: ${error.message}`)
    }

    return data || null
  }

  async getActivitiesForGuild(guildId: string, clientId?: string): Promise<DiscordActivity[]> {
    let query = supabase
      .from('discord_activities')
      .select(`
        *,
        client:clients(id, name, industry, logo)
      `)
      .eq('guild_id', guildId)
      .eq('is_active', true)

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch guild activities: ${error.message}`)
    }

    return data || []
  }

  // Analytics and Statistics
  async getConfigurationStats(): Promise<{
    total_configurations: number
    active_configurations: number
    configurations_by_template: Record<string, number>
    recent_activity: any[]
  }> {
    const { data: configs, error } = await supabase
      .from('bot_configurations')
      .select('template, is_active, last_activity_at, client:clients(name)')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch configuration stats: ${error.message}`)
    }

    const stats = {
      total_configurations: configs?.length || 0,
      active_configurations: configs?.filter(c => c.is_active).length || 0,
      configurations_by_template: configs?.reduce((acc, config) => {
        acc[config.template] = (acc[config.template] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      recent_activity: configs?.slice(0, 5) || []
    }

    return stats
  }

  // Bot Code Generation for Single Adaptive Bot
  generateAdaptiveBotCode(configurations: BotConfiguration[]): string {
    return `
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Load configurations from environment or API
const configurations = ${JSON.stringify(configurations, null, 2)};

// Map guild IDs to their configurations
const guildConfigs = new Map();
configurations.forEach(config => {
  if (config.guild_id) {
    guildConfigs.set(config.guild_id, config);
  }
});

client.once('ready', async () => {
  console.log('✅ Virion Labs bot is ready!');
  console.log(\`Logged in as \${client.user.tag}!\`);
  console.log(\`Serving \${guildConfigs.size} configured guilds\`);
  
  // Set bot status
  client.user.setActivity('Adaptively serving clients', { type: ActivityType.Custom });
});

client.on('guildCreate', async (guild) => {
  console.log(\`Joined new guild: \${guild.name} (\${guild.id})\`);
  
  // Check if we have a configuration for this guild
  const config = guildConfigs.get(guild.id);
  if (!config) {
    console.log(\`No configuration found for guild \${guild.id}\`);
    return;
  }
  
  // Send welcome message if configured
  if (config.welcome_message) {
    const systemChannel = guild.systemChannel;
    if (systemChannel) {
      try {
        await systemChannel.send(config.welcome_message);
      } catch (error) {
        console.error('Failed to send welcome message:', error);
      }
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  
  // Get configuration for this guild
  const config = guildConfigs.get(message.guild.id);
  if (!config || !config.is_active) return;
  
  const prefix = config.prefix || '!';
  if (!message.content.startsWith(prefix)) return;
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  
  try {
    await handleCommand(message, command, args, config);
  } catch (error) {
    console.error('Error handling command:', error);
    await message.reply('❌ An error occurred while processing your command.');
  }
});

async function handleCommand(message, command, args, config) {
  const brandColor = parseInt(config.brand_color?.replace('#', '') || '7289DA', 16);
  const footerText = config.embed_footer || \`Powered by \${config.client?.name || 'Virion Labs'}\`;
  
  switch (command) {
    case 'help':
      const helpEmbed = new EmbedBuilder()
        .setTitle(\`🤖 \${config.display_name}\`)
        .setDescription(config.description || 'Welcome to our Discord bot!')
        .setColor(brandColor)
        .addFields(
          { name: \`\${config.prefix}refer\`, value: 'Get your referral link', inline: true },
          { name: \`\${config.prefix}stats\`, value: 'View your statistics', inline: true },
          { name: \`\${config.prefix}info\`, value: 'Bot information', inline: true }
        )
        .setFooter({ text: footerText });
      
      if (config.avatar_url) {
        helpEmbed.setThumbnail(config.avatar_url);
      }
      
      await message.reply({ embeds: [helpEmbed] });
      break;
      
    case 'refer':
      const referEmbed = new EmbedBuilder()
        .setTitle('🔗 Referral Program')
        .setDescription('Join our referral program and earn rewards!')
        .setColor(brandColor)
        .addFields(
          { name: 'Your Referral Link', value: \`https://\${config.client?.name?.toLowerCase().replace(/\\s+/g, '-') || 'example'}.com/ref/\${message.author.id}\` },
          { name: 'How it works', value: '1. Share your link\\n2. Friends sign up\\n3. Earn rewards!' }
        )
        .setFooter({ text: footerText });
      
      await message.reply({ embeds: [referEmbed] });
      break;
      
    case 'stats':
      const statsEmbed = new EmbedBuilder()
        .setTitle('📊 Your Statistics')
        .setColor(brandColor)
        .addFields(
          { name: 'Total Referrals', value: '0', inline: true },
          { name: 'Active Referrals', value: '0', inline: true },
          { name: 'Rewards Earned', value: '0 points', inline: true }
        )
        .setFooter({ text: footerText });
      
      await message.reply({ embeds: [statsEmbed] });
      break;
      
    case 'info':
      const infoEmbed = new EmbedBuilder()
        .setTitle(\`ℹ️ \${config.display_name}\`)
        .setDescription('An adaptive Discord bot powered by Virion Labs')
        .setColor(brandColor)
        .addFields(
          { name: 'Client', value: config.client?.name || 'Unknown', inline: true },
          { name: 'Template', value: config.template, inline: true },
          { name: 'Version', value: \`v\${config.configuration_version}\`, inline: true }
        )
        .setFooter({ text: footerText });
      
      await message.reply({ embeds: [infoEmbed] });
      break;
      
    default:
      // Check for custom commands
      const customCommand = config.custom_commands?.find(cmd => cmd.name === command);
      if (customCommand) {
        const response = customCommand.response || 'Custom command executed!';
        await message.reply(response);
      } else {
        await message.reply(\`❓ Unknown command. Use \${config.prefix}help for available commands.\`);
      }
  }
  
  // Update usage statistics
  await updateCommandUsage(config.id, command);
}

async function updateCommandUsage(configId, command) {
  try {
    // Call API to update command usage
    await fetch(\`\${process.env.API_BASE_URL}/api/bot-configurations/\${configId}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands_used: 1, // Increment by 1
        last_activity_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to update command usage:', error);
  }
}

client.on('error', console.error);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Virion Labs bot...');
  client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
`;
  }
}

export const adaptiveBotService = new AdaptiveBotService() 