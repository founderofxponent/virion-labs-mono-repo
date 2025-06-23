const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes, SlashCommandBuilder } = require('discord.js');
const OnboardingManager = require('./onboarding-manager');
require('dotenv').config();
const { supabase } = require('./supabase');
const express = require('express');
const cors = require('cors');

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000/api';
const DEBUG = process.env.DEBUG === 'true';

// Discord server configuration
const DEFAULT_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DEFAULT_JOIN_CAMPAIGNS_CHANNEL_ID = process.env.DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID;

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers
  ]
});

// Initialize REST for slash commands
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// Helper function for safe interaction replies
async function safeReply(interaction, options) {
  try {
    if (!interaction.replied && !interaction.deferred) {
      return await interaction.reply(options);
    } else if (interaction.deferred && !interaction.replied) {
      return await interaction.editReply(options);
    } else {
      return await interaction.followUp(options);
    }
  } catch (error) {
    console.error('❌ Error in safeReply:', error);
    throw error;
  }
}

// ===== SLASH COMMANDS CONFIGURATION =====
// Only essential commands - organized for future extensibility

const SLASH_COMMANDS = {
  // Core commands that should always be available
  CORE: [
    {
      name: 'campaigns',
      description: 'View and join available campaigns for this channel',
      handler: 'handleCampaignsCommand'
    },
    {
      name: 'start', 
      description: 'Start onboarding for the active campaign in this channel',
      handler: 'handleStartCommand'
    }
  ],
  
  // Future command categories can be added here
  // ADMIN: [],
  // MODERATION: [],
  // UTILITY: []
};

// Build slash command objects for Discord API
function buildSlashCommands() {
  const commands = [];
  
  // Add core commands
  SLASH_COMMANDS.CORE.forEach(cmd => {
    commands.push(
      new SlashCommandBuilder()
        .setName(cmd.name)
        .setDescription(cmd.description)
    );
  });
  
  // Future: Add other command categories here
  // SLASH_COMMANDS.ADMIN?.forEach(cmd => { ... });
  
  return commands;
}

// Register slash commands with Discord
async function registerSlashCommands() {
  try {
    console.log('🔄 Started refreshing application (/) commands.');
    
    const commands = buildSlashCommands();
    console.log(`📝 Registering ${commands.length} slash commands: ${commands.map(c => `/${c.name}`).join(', ')}`);

    // Clear ALL existing commands first (both global and guild-specific)
    console.log('🧹 Clearing all existing slash commands...');
    
    // Clear global commands
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [] }
    );
    
    // Clear guild-specific commands for all guilds the bot is in
    client.guilds.cache.forEach(async (guild) => {
      try {
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, guild.id),
          { body: [] }
        );
        console.log(`🧹 Cleared commands for guild: ${guild.name}`);
      } catch (error) {
        console.warn(`⚠️ Could not clear commands for guild ${guild.name}:`, error.message);
      }
    });

    // Wait a moment for Discord to process the deletions
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Now register only our essential commands globally
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands.map(cmd => cmd.toJSON()) }
    );

    console.log('✅ Successfully registered essential slash commands');
    console.log('🚫 All old commands have been removed from Discord');
    console.log('💡 Only /campaigns and /start are now available');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
}

// ===== SLASH COMMAND HANDLERS =====

// Main slash command dispatcher
async function handleSlashCommand(interaction) {
  const { commandName, user } = interaction;
  console.log(`⚡ Slash command /${commandName} from ${user.tag} in ${interaction.guild?.name || 'DM'}`);

  try {
    // Find the command configuration
    const coreCommand = SLASH_COMMANDS.CORE.find(cmd => cmd.name === commandName);
    
    if (coreCommand) {
      // Execute the handler function
      switch (coreCommand.handler) {
        case 'handleCampaignsCommand':
          await handleCampaignsCommand(interaction);
          break;
        case 'handleStartCommand':
          await handleStartCommand(interaction);
          break;
        default:
          console.error(`❌ No handler found for command: ${commandName}`);
          await safeReply(interaction, {
            content: '❌ Command handler not implemented.',
            ephemeral: true
          });
      }
    } else {
      console.error(`❌ Unknown slash command: ${commandName}`);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ Unknown command. Use `/campaigns` to see available options.',
            ephemeral: true
          });
        }
      } catch (replyError) {
        console.error('❌ Failed to send error reply:', replyError);
      }
    }
  } catch (error) {
    console.error(`❌ Error handling slash command ${commandName}:`, error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ An error occurred while processing your command. Please try again.',
          ephemeral: true
        });
      } else if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({
          content: '❌ An error occurred while processing your command. Please try again.'
        });
      } else {
        await interaction.followUp({
          content: '❌ An error occurred while processing your command. Please try again.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('❌ Failed to send error reply:', replyError);
    }
  }
}

// /campaigns command handler
async function handleCampaignsCommand(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const guildId = interaction.guild?.id;
    const channelId = interaction.channel?.id;
    
    if (!guildId) {
      await interaction.editReply({
        content: '❌ This command can only be used in a server, not in DMs.'
      });
      return;
    }

    console.log(`📋 Campaigns command from ${interaction.user.tag} in guild ${guildId}, channel ${channelId}`);
    
    // Fetch all campaigns for this guild
    const campaigns = await fetchAllCampaigns(guildId);
    
    if (!campaigns || campaigns.length === 0) {
      await interaction.editReply({
        content: '📭 No campaigns are configured for this server yet.\n\n💡 Server administrators can set up campaigns through the dashboard.'
      });
      return;
    }

    // Group campaigns by status for better organization
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const pausedCampaigns = campaigns.filter(c => c.status === 'paused');
    const archivedCampaigns = campaigns.filter(c => c.status === 'archived');
    const inactiveCampaigns = campaigns.filter(c => c.status === 'inactive');

    // Create main embed
    const embed = new EmbedBuilder()
      .setTitle('🎯 Campaign Center')
      .setColor('#6366f1')
      .setTimestamp();

    let description = `Welcome to the campaign center! Here's what's available in **${interaction.guild.name}**:\n\n`;

    // Add active campaigns section
    if (activeCampaigns.length > 0) {
      description += `## 🟢 Active Campaigns (${activeCampaigns.length})\n`;
      activeCampaigns.forEach(campaign => {
        description += `**${campaign.campaign_name}**\n`;
      });
      description += '\n';
    }

    // Add paused campaigns section
    if (pausedCampaigns.length > 0) {
      description += `## ⏸️ Paused Campaigns (${pausedCampaigns.length})\n`;
      pausedCampaigns.forEach(campaign => {
        description += `**${campaign.campaign_name}**\n`;
      });
      description += '\n';
    }

    // Add archived campaigns section (limit to 3 for brevity)
    if (archivedCampaigns.length > 0) {
      description += `## 📁 Recent Campaigns (${archivedCampaigns.length})\n`;
      archivedCampaigns.slice(0, 3).forEach(campaign => {
        description += `**${campaign.campaign_name}**\n`;
      });
      if (archivedCampaigns.length > 3) {
        description += `*...and ${archivedCampaigns.length - 3} more completed campaigns*\n`;
      }
      description += '\n';
    }

    // Add inactive campaigns (limit to 2 for brevity)
    if (inactiveCampaigns.length > 0) {
      description += `## ⚫ Other Campaigns (${inactiveCampaigns.length})\n`;
      inactiveCampaigns.slice(0, 2).forEach(campaign => {
        description += `**${campaign.campaign_name}**\n`;
      });
      if (inactiveCampaigns.length > 2) {
        description += `*...and ${inactiveCampaigns.length - 2} more campaigns*\n`;
      }
      description += '\n';
    }

    // Add instructions at the bottom - applies to all campaigns
    description += `---\n`;
    if (activeCampaigns.length > 0) {
      description += `🚀 **Ready to get started?** Use \`/start\` to join any active campaign!`;
    } else {
      description += `💡 No campaigns are currently accepting new participants. Check back soon!`;
    }

    embed.setDescription(description);

    // Add footer with helpful info
    let footerText = `${campaigns.length} total campaign${campaigns.length !== 1 ? 's' : ''}`;
    if (activeCampaigns.length > 0) {
      footerText += ` • ${activeCampaigns.length} active`;
    }
    
    embed.setFooter({
      text: footerText
    });

    // Send simple embed response without buttons
    await interaction.editReply({ embeds: [embed] });

    // Track the interaction
    await trackInteraction(guildId, channelId, {
      author: { id: interaction.user.id, tag: interaction.user.tag },
      id: interaction.id,
      content: '/campaigns'
    }, 'slash_command_campaigns');

  } catch (error) {
    console.error('❌ Error in campaigns command:', error);
    try {
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({
          content: '❌ Failed to fetch campaigns. Please try again later.'
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          content: '❌ Failed to fetch campaigns. Please try again later.',
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: '❌ Failed to fetch campaigns. Please try again later.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('❌ Failed to send error reply:', replyError);
    }
  }
}

// /start command handler  
async function handleStartCommand(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const guildId = interaction.guild?.id;
    const channelId = interaction.channel?.id;
    const userId = interaction.user.id;
    const username = interaction.user.tag;
    
    if (!guildId) {
      await interaction.editReply({
        content: '❌ This command can only be used in a server, not in DMs.'
      });
      return;
    }

    console.log(`🚀 Start command from ${username} in guild ${guildId}, channel ${channelId}`);
    
    // Fetch all active campaigns for this guild
    const activeCampaigns = await fetchActiveCampaigns(guildId);
    
    if (!activeCampaigns || activeCampaigns.length === 0) {
      await interaction.editReply({
        content: '❌ No active campaigns found for this server.\n\n💡 Server administrators can set up campaigns through the dashboard.'
      });
      return;
    }

    // Create the campaign selection embed
    const embed = new EmbedBuilder()
      .setTitle('🚀 Start Campaign Onboarding')
      .setColor('#6366f1')
      .setTimestamp();

    let description = `Welcome ${interaction.user.username}! Choose a campaign to start your onboarding journey:\n\n`;
    
    activeCampaigns.forEach((campaign, index) => {
      description += `**${index + 1}.** ${campaign.campaign_name}\n`;
    });
    
    description += `\n💡 **Select a campaign below to begin!**`;
    
    embed.setDescription(description);
    embed.setFooter({ text: `${activeCampaigns.length} active campaign${activeCampaigns.length !== 1 ? 's' : ''} available` });

    // Create buttons for each active campaign (max 5 per row, max 25 total)
    const components = [];
    let currentRow = new ActionRowBuilder();
    let buttonCount = 0;

    activeCampaigns.slice(0, 25).forEach((campaign, index) => { // Discord max 25 components
      if (buttonCount === 5) {
        components.push(currentRow);
        currentRow = new ActionRowBuilder();
        buttonCount = 0;
      }

      const button = new ButtonBuilder()
        .setCustomId(`start_onboarding_${campaign.id}_${userId}`)
        .setLabel(campaign.campaign_name.length > 80 ? 
          campaign.campaign_name.substring(0, 77) + '...' : 
          campaign.campaign_name)
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🚀');

      currentRow.addComponents(button);
      buttonCount++;
    });

    if (buttonCount > 0) {
      components.push(currentRow);
    }

    // Send the response with embed and buttons
    await interaction.editReply({ 
      embeds: [embed], 
      components: components 
    });

    // Track the interaction
    await trackInteraction(guildId, channelId, {
      author: { id: userId, tag: username },
      id: interaction.id,
      content: '/start'
    }, 'slash_command_start');

  } catch (error) {
    console.error('❌ Error in start command:', error);
    try {
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({
          content: '❌ Failed to load campaigns. Please try again later.'
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          content: '❌ Failed to load campaigns. Please try again later.',
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: '❌ Failed to load campaigns. Please try again later.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('❌ Failed to send error reply:', replyError);
    }
  }
}

// ===== END SLASH COMMANDS SECTION =====

// Cache for guild configurations to avoid repeated API calls
const configCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds (reduced from 5 minutes for faster updates)

// Cache for published campaign messages per guild
const publishedMessages = new Map();

// Initialize onboarding manager
const onboardingManager = new OnboardingManager();

// Create Express app for webhook handling
const app = express();
app.use(express.json());
app.use(cors());

// Webhook endpoint for automatic campaign publishing
app.post('/api/publish-campaigns', async (req, res) => {
  try {
    console.log('📡 Received webhook request to publish campaigns');
    
    const { guild_id, channel_id, campaigns } = req.body;
    
    // Use environment variables if not provided in request
    const targetGuildId = guild_id || DEFAULT_GUILD_ID;
    const targetChannelId = channel_id || DEFAULT_JOIN_CAMPAIGNS_CHANNEL_ID || 'join-campaigns';
    
    if (!targetGuildId) {
      console.error('❌ No guild ID provided');
      return res.status(400).json({ 
        success: false, 
        error: 'Guild ID is required' 
      });
    }
    
    console.log(`🎯 Auto-publishing campaigns to guild: ${targetGuildId}, channel: ${targetChannelId}`);
    
    // Automatically trigger publishing to the channel
    const success = await publishCampaignsToChannel(targetGuildId, targetChannelId, true);
    
    if (success) {
      console.log('✅ Campaigns published successfully via webhook');
      
      // Update bot stats
      await updateBotStats(targetGuildId, targetChannelId, {
        commands_used: 1,
        last_activity_at: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: 'Campaigns published to Discord successfully',
        guild_id: targetGuildId,
        channel_id: targetChannelId
      });
    } else {
      console.error('❌ Failed to publish campaigns via webhook');
      res.status(500).json({
        success: false,
        error: 'Failed to publish campaigns to Discord'
      });
    }
    
  } catch (error) {
    console.error('❌ Error handling publish webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    bot_ready: client.isReady(),
    timestamp: new Date().toISOString()
  });
});

// Start HTTP server for webhooks
const HTTP_PORT = process.env.BOT_HTTP_PORT || 3001;
const server = app.listen(HTTP_PORT, () => {
  console.log(`🌐 Discord Bot HTTP server listening on port ${HTTP_PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${HTTP_PORT}/api/publish-campaigns`);
});

// Bot ready event
client.once('ready', async () => {
  console.log('🤖 Virion Labs Discord Bot is ready!');
  console.log(`📡 Logged in as ${client.user.tag}`);
  console.log(`🔗 Dashboard API: ${DASHBOARD_API_URL}`);
  console.log(`🌐 HTTP Server: http://localhost:${HTTP_PORT}`);
  console.log(`🎯 Target Guild: ${DEFAULT_GUILD_ID || 'Not configured'}`);
  console.log(`📺 Target Channel: ${DEFAULT_JOIN_CAMPAIGNS_CHANNEL_ID || 'join-campaigns (by name)'}`);
  console.log(`🐛 Debug mode: ${DEBUG ? 'ON' : 'OFF'}`);
  
  // Register slash commands
  await registerSlashCommands();
  
  console.log('✅ Bot is now listening for slash commands, interactions, and webhook requests...\n');
  
  // Test dashboard connection on startup
  testDashboardConnection();
});

// Test dashboard connection
async function testDashboardConnection() {
  console.log('🧪 Testing dashboard connection...');
  
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/config?guild_id=test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      }
    });

    if (response.ok) {
      console.log('✅ Dashboard connection successful!');
    } else {
      console.log(`⚠️ Dashboard connection failed: ${response.status} ${response.statusText}`);
      console.log('❓ Bot will continue with basic functionality\n');
    }
  } catch (error) {
    console.log('❌ Dashboard connection error:', error.message);
    console.log('❓ Bot will continue with basic functionality\n');
  }
}

// Update the getBotConfig function to use the new unified API
async function getBotConfig(guildId, channelId = null, options = {}) {
  try {
    console.log('🔍 Fetching bot configuration for guild:', guildId, 'channel:', channelId);
    
    // Extract options for campaign selection
    const { 
      preferReferralCampaign = false, 
      hasReferralCode = false, 
      campaignType = null 
    } = options;
    
    // Check for ANY campaigns for this guild (not just active ones)
    const { data: guildCheck, error: guildError } = await supabase
      .from('discord_guild_campaigns')
      .select('*')
      .eq('guild_id', guildId)
      .eq('is_deleted', false); // Only exclude hard-deleted campaigns

    if (guildError) {
      console.error('❌ Error checking guild campaigns:', guildError);
    } else {
      console.log(`📊 Found ${guildCheck?.length || 0} campaigns for guild ${guildId}`);
      if (guildCheck && guildCheck.length > 0) {
        console.log('📋 Guild campaigns:', guildCheck.map(c => ({ 
          id: c.id, 
          name: c.campaign_name, 
          type: c.campaign_type,
          status: getCampaignStatus(c)
        })));
      }
    }
    
    // Use the dashboard API fallback which handles all campaign statuses
    console.log('🔄 Using dashboard API for comprehensive campaign data...');
    try {
      let apiUrl = `${DASHBOARD_API_URL}/discord-bot/config?guild_id=${guildId}${channelId ? `&channel_id=${channelId}` : ''}&include_inactive=true`;
      
      // Add campaign type preference based on use case
      if (preferReferralCampaign || hasReferralCode) {
        apiUrl += '&prefer_campaign_type=referral_onboarding';
        console.log('🔗 Preferring referral_onboarding campaign for referral user');
      } else if (campaignType) {
        apiUrl += `&prefer_campaign_type=${campaignType}`;
        console.log(`🎯 Preferring ${campaignType} campaign type`);
      } else {
        apiUrl += '&prefer_campaign_type=community_engagement';
        console.log('👥 Preferring community_engagement campaign for existing member');
      }
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        }
      });

      if (response.ok) {
        const apiData = await response.json();
        console.log('✅ Dashboard API response:', apiData);
        
        if (apiData.configured && apiData.campaign) {
          const campaign = apiData.campaign;
          console.log(`✅ Successfully got config from dashboard API: ${campaign.name} (${campaign.campaign_type})`);
          
          const config = {
            isActive: campaign.is_active,
            campaignStatus: getCampaignStatus(campaign),
            campaignId: campaign.id,
            campaignName: campaign.name,
            campaignType: campaign.campaign_type,
            clientName: campaign.client_name,
            config: {
              // Bot configuration
              bot_name: campaign.bot_name || 'Virion Bot',
              brand_color: campaign.brand_color || '#6366f1',
              welcome_message: campaign.welcome_message,
              prefix: campaign.prefix || '/',
              
              // Template and onboarding
              template: campaign.template || 'standard',
              onboarding_flow: campaign.onboarding_flow || {},
              onboarding_completion_requirements: campaign.onboarding_completion_requirements || {},
              
              // Features
              referral_tracking_enabled: campaign.referral_tracking_enabled || false,
              auto_role_assignment: campaign.auto_role_assignment || false,
              target_role_ids: campaign.target_role_ids || [],
              
              // Response configuration
              auto_responses: campaign.auto_responses || {},
              response_templates: campaign.response_templates || {},
              
              // Access control
              private_channel_setup: campaign.private_channel_setup || {},
              access_control_enabled: campaign.access_control_enabled || false,
              referral_only_access: campaign.referral_only_access || false,
              
              // Moderation
              moderation_enabled: campaign.moderation_enabled !== false,
              rate_limit_per_user: campaign.rate_limit_per_user || 5,
              allowed_channels: campaign.allowed_channels || [],
              blocked_users: campaign.blocked_users || [],
              content_filters: campaign.content_filters || []
            },
            
            // Referral information
            referralLinkId: campaign.referral_link_id,
            influencerId: campaign.influencer_id,
            referralCode: campaign.referral_code
          };
          
          // Note: Only /start and /campaigns slash commands are registered
          // All campaign functionality is accessed through these essential commands
          
          return config;
        }
      }
      
      console.log('⚠️ Dashboard API returned no configured campaign');
    } catch (apiError) {
      console.error('❌ Dashboard API error:', apiError);
    }
    
    console.log('❌ No valid campaign configuration found');
    return null;
  } catch (error) {
    console.error('❌ Error in getBotConfig:', error);
    return null;
  }
}

// Helper function to determine campaign status
function getCampaignStatus(campaign) {
  // Priority order: deleted > archived > paused > active
  if (campaign.is_deleted) return 'deleted'
  if (!campaign.is_active && campaign.campaign_end_date) return 'archived'
  if (!campaign.is_active && campaign.paused_at) return 'paused'
  if (campaign.is_active) return 'active'
  return 'inactive' // fallback for edge cases
}

// Update bot stats in the unified campaign table
async function updateBotStats(guildId, channelId, statsUpdate) {
  try {
    const botConfig = await getBotConfig(guildId, channelId);
    if (!botConfig) return;

    // Update the campaign stats using the new unified structure
    const { error } = await supabase
      .from('discord_guild_campaigns')
      .update({
        commands_used: statsUpdate.commands_used || 0,
        users_served: statsUpdate.users_served || 0,
        last_activity_at: new Date().toISOString(),
        total_interactions: statsUpdate.total_interactions || 0,
        successful_onboardings: statsUpdate.successful_onboardings || 0,
        referral_conversions: statsUpdate.referral_conversions || 0
      })
      .eq('id', botConfig.campaignId);

    if (error) {
      console.error('❌ Error updating bot stats:', error);
    } else {
      console.log('✅ Updated bot stats for campaign:', botConfig.campaignId);
    }
  } catch (error) {
    console.error('❌ Unexpected error updating bot stats:', error);
  }
}

async function fetchActiveCampaigns(guildId) {
  const { data, error } = await supabase
    .from('discord_guild_campaigns')
    .select('id, campaign_name, is_active, is_deleted, paused_at, campaign_end_date')
    .eq('guild_id', guildId)
    .eq('is_active', true)
    .eq('is_deleted', false);
  if (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
  return data || [];
}

// New function to fetch all campaigns with their status
async function fetchAllCampaigns(guildId) {
  const { data, error } = await supabase
    .from('discord_guild_campaigns')
    .select('id, campaign_name, is_active, is_deleted, paused_at, campaign_end_date')
    .eq('guild_id', guildId)
    .eq('is_deleted', false); // Only exclude hard-deleted campaigns
  
  if (error) {
    console.error('Error fetching all campaigns:', error);
    return [];
  }
  
  // Add status information to each campaign
  return (data || []).map(campaign => ({
    ...campaign,
    status: getCampaignStatus(campaign)
  }));
}

// Track interaction with dashboard
async function trackInteraction(guildId, channelId, message, interactionType, botResponse = null, referralCode = null) {
  try {
    if (DEBUG) {
      console.log(`🔍 Tracking interaction: ${interactionType} for ${message.author.tag} in guild ${guildId}`);
      if (referralCode) {
        console.log(`🎯 Referral code detected: ${referralCode}`);
      }
    }

    const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      },
      body: JSON.stringify({
        guild_id: guildId,
        channel_id: channelId,
        discord_user_id: message.author.id,
        discord_username: message.author.tag,
        message_id: message.id,
        interaction_type: interactionType,
        message_content: message.content,
        bot_response: botResponse,
        referral_code: referralCode
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to track interaction: ${response.status} ${response.statusText} - ${errorText}`);
    } else {
      const result = await response.json();
      if (DEBUG) {
        console.log(`✅ Successfully tracked interaction: ${result.interaction_id}`);
      }
    }
  } catch (error) {
    console.error('❌ Error tracking interaction:', error);
  }
}

// Extract referral code from message with enhanced patterns
function extractReferralCode(content) {
  // Look for common referral code patterns
  const patterns = [
    /(?:referral|ref|code)[\s:]*([a-zA-Z0-9\-_]+)/i,
    /\b([a-zA-Z0-9\-_]+-[a-zA-Z0-9\-_]+-[a-zA-Z0-9\-_]+)\b/,
    /(?:use|enter)[\s:]*([a-zA-Z0-9\-_]+)/i,
    /^([a-zA-Z0-9\-_]{6,20})$/,  // Direct code
    /(?:my code is|code:|ref:)\s*([a-zA-Z0-9\-_]+)/i // More specific patterns
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Get template-driven response based on message content and campaign config
function getTemplateResponse(config, messageContent) {
  if (!config.config) {
    return null;
  }

  const content = messageContent.toLowerCase();
  const autoResponses = config.config.auto_responses || {};
  const responseTemplates = config.config.response_templates || {};

  // Check auto responses first
  const responseKeys = Object.keys(autoResponses);
  for (const key of responseKeys) {
    if (content.includes(key.toLowerCase())) {
      return {
        title: `${getResponseIcon(key)} ${getResponseTitle(key)}`,
        message: autoResponses[key],
        color: config.config.brand_color || '#6366f1'
      };
    }
  }

  // Check response templates
  const templateKeys = Object.keys(responseTemplates);
  for (const key of templateKeys) {
    if (content.includes(key.toLowerCase())) {
      return {
        title: `${getResponseIcon(key)} ${getResponseTitle(key)}`,
        message: responseTemplates[key],
        color: config.config.brand_color || '#6366f1'
      };
    }
  }

  // Check for common variations
  if (content.includes('hi') || content.includes('hey')) {
    return autoResponses.hello ? {
      title: '👋 Hello!',
      message: autoResponses.hello,
      color: config.config.brand_color || '#6366f1'
    } : null;
  }

  if (content.includes('product') && autoResponses.products) {
    return {
      title: '🛍️ Products',
      message: autoResponses.products,
      color: config.config.brand_color || '#6366f1'
    };
  }

  if (content.includes('price') && autoResponses.price) {
    return {
      title: '💰 Pricing',
      message: autoResponses.price,
      color: config.config.brand_color || '#6366f1'
    };
  }

  return null;
}

// Get appropriate icon for response type
function getResponseIcon(responseType) {
  const icons = {
    'hello': '👋',
    'help': '🆘', 
    'products': '🛍️',
    'price': '💰',
    'order': '📦',
    'catalog': '📋',
    'offers': '🏷️',
    'events': '🎉',
    'guidelines': '📋',
    'connect': '🤝'
  };
  return icons[responseType] || '💬';
}

// Get appropriate title for response type
function getResponseTitle(responseType) {
  const titles = {
    'hello': 'Hello!',
    'help': 'How Can I Help?',
    'products': 'Our Products', 
    'price': 'Pricing Information',
    'order': 'Ready to Order?',
    'catalog': 'Product Catalog',
    'offers': 'Special Offers',
    'events': 'Community Events',
    'guidelines': 'Guidelines',
    'connect': 'Let\'s Connect'
  };
  return titles[responseType] || 'Information';
}

// Validate referral code with the dashboard
async function validateReferralCode(code, guildId, userId = null) {
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/referral/${code}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      },
      body: JSON.stringify({ 
        guild_id: guildId,
        user_id: userId 
      })
    });

    if (response.ok) {
      const result = await response.json();
      return result.valid ? result : null;
    }
    return null;
  } catch (error) {
    console.error('Error validating referral code:', error);
    return null;
  }
}

// Detect referral context from Discord invite and auto-assign
async function handleReferralInviteContext(member) {
  try {
    // Check if the member joined through a campaign-generated invite
    const invites = await member.guild.invites.fetch();
    
    for (const invite of invites.values()) {
      if (invite.code) {
        console.log(`🔍 Checking invite: ${invite.code} (uses: ${invite.uses})`);
        
        // Check if this invite is associated with any referral campaign
        try {
          const response = await fetch(`${DASHBOARD_API_URL}/discord/invite/${invite.code}/context`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Virion-Discord-Bot/2.0'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.invite_context?.referral_code) {
              const context = result.invite_context;
              console.log(`🎯 Auto-detected referral: ${context.referral_code} for ${member.user.tag} via invite ${invite.code}`);
              
              // Get guild configuration
              const config = await getBotConfig(member.guild.id);
              if (config) {
                // Create a synthetic message for referral processing
                const syntheticMessage = {
                  author: member.user,
                  member: member,
                  guild: member.guild,
                  channel: member.guild.systemChannel || { id: 'auto-referral' },
                  content: context.referral_code,
                  id: `auto-referral-${member.user.id}-${Date.now()}`,
                  reply: async (options) => {
                    // Send to system channel or DM
                    try {
                      await member.send(options);
                    } catch {
                      if (member.guild.systemChannel) {
                        await member.guild.systemChannel.send({
                          content: `${member.user}`,
                          ...options
                        });
                      }
                    }
                  },
                  followUp: async (options) => {
                    try {
                      await member.send(options);
                    } catch {
                      if (member.guild.systemChannel) {
                        await member.guild.systemChannel.send({
                          content: `${member.user}`,
                          ...options
                        });
                      }
                    }
                  }
                };
                
                // Validate the referral code first
                const validation = await validateReferralCode(
                  context.referral_code, 
                  member.guild.id, 
                  member.user.id
                );
                
                if (validation && validation.valid) {
                  console.log(`🤖 Auto-starting onboarding for ${member.user.tag} with referral code ${context.referral_code}`);
                  
                  // Start onboarding immediately with referral context
                  await onboardingManager.startOnboarding(syntheticMessage, config, {
                    referralCode: context.referral_code,
                    referralValidation: validation,
                    autoStart: true
                  });
                  
                  // Record the successful referral in the dashboard
                  try {
                    const completionResponse = await fetch(`${DASHBOARD_API_URL}/referral/complete`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Virion-Discord-Bot/2.0'
                      },
                      body: JSON.stringify({
                        referral_code: context.referral_code,
                        discord_user_id: member.user.id,
                        discord_username: member.user.tag,
                        guild_id: member.guild.id,
                        conversion_source: 'discord_auto_detection'
                      })
                    });
                    
                    if (completionResponse.ok) {
                      const completionResult = await completionResponse.json();
                      console.log(`✅ Referral completion recorded: ${completionResult.referral_id} (duplicate: ${completionResult.duplicate})`);
                    } else {
                      console.error('❌ Failed to record referral completion:', completionResponse.status);
                    }
                  } catch (error) {
                    console.error('❌ Error recording referral completion:', error);
                  }
                  
                  // Send welcome message with onboarding auto-start notification
                  const welcomeEmbed = createCampaignEmbed(
                    config,
                    '🎉 Welcome via Referral!',
                    `Great news! We automatically detected that you joined through **${context.influencer.name}'s** referral link for the **${context.campaign.name}** campaign.\n\n🚀 I'm starting your onboarding process right now to get you set up with all your exclusive benefits!`,
                    config.bot_config?.brand_color || '#00ff00'
                  );
                  
                  try {
                    await member.send({ embeds: [welcomeEmbed] });
                  } catch {
                    if (member.guild.systemChannel) {
                      await member.guild.systemChannel.send({
                        content: `${member.user} Welcome! 👋`,
                        embeds: [welcomeEmbed]
                      });
                    }
                  }
                } else {
                  console.log(`❌ Invalid referral code detected: ${context.referral_code} for ${member.user.tag}`);
                  
                  // Send a message about invalid referral but still welcome them
                  const displayName = config.clientName || config.campaignName || 'our community';
                  const welcomeEmbed = createCampaignEmbed(
                    config,
                    '🎉 Welcome!',
                    `Welcome to **${displayName}**! We detected a referral link, but it appears to be invalid or expired.\n\n✨ No worries though - you can still get started with our community!`,
                    config.bot_config?.brand_color || '#ff9900'
                  );
                  
                  try {
                    await member.send({ embeds: [welcomeEmbed] });
                  } catch {
                    if (member.guild.systemChannel) {
                      await member.guild.systemChannel.send({
                        content: `${member.user} Welcome! 👋`,
                        embeds: [welcomeEmbed]
                      });
                    }
                  }
                }
                
                return true;
              }
            }
          } else if (response.status !== 404) {
            // Log non-404 errors (404 is expected for non-campaign invites)
            console.log(`⚠️ API error checking invite ${invite.code}: ${response.status}`);
          }
        } catch (error) {
          console.error('Error fetching invite context:', error);
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error handling referral invite context:', error);
    return false;
  }
}

// Auto-start onboarding for new members
async function handleNewMemberOnboarding(member) {
  try {
    // Get community engagement campaign configuration for new Discord members
    const config = await getBotConfig(member.guild.id, null, {
      campaignType: 'community_engagement'
    });
    
    if (!config) {
      console.log(`⚠️ No community engagement campaign configured for guild: ${member.guild.id}`);
      return; // No campaign configured for this guild
    }

    console.log(`👥 New member onboarding using: ${config.campaignName} (${config.campaignType})`);
    
    // Wait a bit to let Discord settle the member join
    setTimeout(async () => {
      try {
        // Create a synthetic message for starting onboarding
        const syntheticMessage = {
          author: member.user,
          member: member,
          guild: member.guild,
          channel: member.guild.systemChannel || { id: 'auto-onboarding' },
          content: 'auto_start_onboarding',
          id: `auto-onboarding-${member.user.id}-${Date.now()}`,
          reply: async (options) => {
            // Send to user's DM
            try {
              await member.send(options);
            } catch {
              if (member.guild.systemChannel) {
                await member.guild.systemChannel.send({
                  content: `${member.user}`,
                  ...options
                });
              }
            }
          },
          followUp: async (options) => {
            try {
              await member.send(options);
            } catch {
              if (member.guild.systemChannel) {
                await member.guild.systemChannel.send({
                  content: `${member.user}`,
                  ...options
                });
              }
            }
          }
        };
        
        console.log(`🚀 Auto-starting community onboarding for ${member.user.tag} in ${config.campaignName}`);
        
        // Start onboarding immediately with community engagement campaign
        await onboardingManager.startOnboarding(syntheticMessage, config, {
          autoStart: true
        });
        
        console.log(`✅ Auto-started community onboarding for ${member.user.tag}`);
        
      } catch (error) {
        if (error.code === 50007) {
          console.log(`❌ Cannot send DM to ${member.user.tag} (DMs disabled)`);
          
                      // Fallback: try to send to system channel with instructions
            try {
              if (member.guild.systemChannel) {
                const displayName = config.clientName || config.campaignName || 'our community';
                const fallbackEmbed = new EmbedBuilder()
                  .setTitle(`🎉 Welcome ${member.user.username}!`)
                  .setDescription(`Welcome to **${displayName}**!\n\n📝 I tried to start your onboarding process in DMs, but it seems you have DMs disabled.\n\n💡 Please enable DMs from server members and type "start" to begin your onboarding journey!`)
                  .setColor(config.config?.brand_color || '#6366f1')
                  .setTimestamp();
              
              await member.guild.systemChannel.send({
                content: `${member.user}`,
                embeds: [fallbackEmbed]
              });
            }
          } catch (channelError) {
            console.error('Error sending fallback message to system channel:', channelError);
          }
        } else {
          console.error('Error in auto-onboarding:', error);
        }
      }
    }, 3000); // 3 second delay to ensure Discord has settled
    
  } catch (error) {
    console.error('Error handling new member onboarding:', error);
  }
}

// Create campaign-specific embed
function createCampaignEmbed(config, title, description, color = null) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  if (color) {
    embed.setColor(color);
  } else if (config.bot_config?.brand_color) {
    embed.setColor(config.bot_config.brand_color);
  }

  if (config.clientName) {
    embed.setFooter({ text: `${config.clientName} • Powered by Virion Labs` });
  }

  return embed;
}

// Handle referral onboarding flow with enhanced campaign integration
async function handleReferralOnboarding(message, config) {
  const userId = message.author.id;
  const campaignId = config.campaignId;
  
  // Check if user is in an active onboarding session
  if (onboardingManager.isInOnboardingSession(userId, campaignId)) {
    // Handle response to onboarding question
    return await onboardingManager.handleResponse(message, config);
  }
  
  const referralCode = extractReferralCode(message.content);
  
  if (referralCode) {
    // Validate the referral code against our new API
    const validation = await validateReferralCode(
      referralCode, 
      message.guild.id, 
      message.author.id
    );
    
    if (validation && validation.valid) {
      // Get referral-specific campaign configuration
      const referralConfig = await getBotConfig(message.guild.id, message.channel.id, {
        preferReferralCampaign: true,
        hasReferralCode: true,
        campaignType: 'referral_onboarding'
      });
      
      if (referralConfig && referralConfig.campaignType === 'referral_onboarding') {
        console.log(`🔗 Using referral onboarding campaign: ${referralConfig.campaignName}`);
        // Start dynamic onboarding process with referral context using referral campaign
        return await onboardingManager.startOnboarding(message, referralConfig, {
          referralCode,
          referralValidation: validation
        });
      } else {
        console.log(`⚠️ No referral onboarding campaign found, using default config`);
        // Fallback to regular config if no referral campaign available
        return await onboardingManager.startOnboarding(message, config, {
          referralCode,
          referralValidation: validation
        });
      }
    } else {
      // Invalid referral code - provide helpful feedback
      const embed = createCampaignEmbed(
        config,
        '❌ Invalid Referral Code',
        `The referral code **"${referralCode}"** is not valid for this server.\n\n💡 **Tips:**\n• Make sure you copied the code correctly\n• Check that the code hasn't expired\n• Verify you're in the right Discord server\n\nIf you need help, contact our support team!`,
        '#ff0000'
      );

      await message.reply({ embeds: [embed] });
      
      // Track failed referral attempt
      await trackInteraction(
        message.guild?.id,
        message.channel.id,
        message,
        'referral_failed',
        'Invalid referral code provided',
        referralCode
      );
      
      return true;
    }
  }
  
  // Check for general onboarding message patterns
  if (message.content.toLowerCase().includes('hello') || 
      message.content.toLowerCase().includes('hi') ||
      message.content.toLowerCase().includes('welcome') ||
      message.content.toLowerCase().includes('start')) {
    
    // For users without referral codes, prefer community engagement campaigns
    const communityConfig = await getBotConfig(message.guild.id, message.channel.id, {
      campaignType: 'community_engagement'
    });
    
    if (communityConfig && communityConfig.campaignType === 'community_engagement') {
      console.log(`👥 Using community engagement campaign: ${communityConfig.campaignName}`);
      return await onboardingManager.startOnboarding(message, communityConfig);
    } else {
      // Fallback to existing config
      return await onboardingManager.startOnboarding(message, config);
    }
  }
  
  return false;
}

// Function to publish/update campaigns in join-campaigns channel
async function publishCampaignsToChannel(guildId, channelIdentifier = 'join-campaigns', forceUpdate = false) {
  try {
    console.log(`📢 Publishing campaigns to ${channelIdentifier} in guild: ${guildId}`);
    
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      console.error(`❌ Guild not found: ${guildId}`);
      return false;
    }

    // Find the channel by ID first (if it looks like an ID), then by name
    let channel;
    if (/^\d+$/.test(channelIdentifier)) {
      // Channel ID provided
      channel = guild.channels.cache.get(channelIdentifier);
      if (!channel) {
        console.error(`❌ Channel with ID '${channelIdentifier}' not found in guild: ${guild.name}`);
        return false;
      }
    } else {
      // Channel name provided
      channel = guild.channels.cache.find(ch => 
        ch.name === channelIdentifier && ch.type === 0 // Text channel
      );
      if (!channel) {
        console.error(`❌ Channel '${channelIdentifier}' not found in guild: ${guild.name}`);
        return false;
      }
    }

    // Get campaigns data
    const activeCampaigns = await fetchActiveCampaigns(guildId);
    const allCampaigns = await fetchAllCampaigns(guildId);
    const inactiveCampaigns = allCampaigns.filter(c => !c.is_active);

    // Create the campaign embed
    const embed = new EmbedBuilder()
      .setTitle('🎯 Join Active Campaigns')
      .setColor('#6366f1')
      .setTimestamp()
      .setFooter({ text: 'Click the buttons below to join a campaign!' });

    let description = '';
    let components = [];

    if (activeCampaigns.length > 0) {
      description += `**Active Campaigns (${activeCampaigns.length}):**\nSelect a campaign to join:\n\n`;
      
      // Create buttons for active campaigns (max 5 per row)
      const rows = [];
      let currentRow = new ActionRowBuilder();
      let buttonCount = 0;

      activeCampaigns.slice(0, 25).forEach((campaign, index) => { // Discord max 25 components
        if (buttonCount === 5) {
          rows.push(currentRow);
          currentRow = new ActionRowBuilder();
          buttonCount = 0;
        }

        const button = new ButtonBuilder()
          .setCustomId(`join_${campaign.id}`)
          .setLabel(campaign.campaign_name.length > 80 ? 
            campaign.campaign_name.substring(0, 77) + '...' : 
            campaign.campaign_name)
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🚀');

        currentRow.addComponents(button);
        buttonCount++;
      });

      if (buttonCount > 0) {
        rows.push(currentRow);
      }
      components = rows;
    } else {
      description += `**No Active Campaigns Available**\n\nThere are currently no active campaigns to join.\n\n`;
    }

    // Add inactive campaign information
    if (inactiveCampaigns.length > 0) {
      description += `**Inactive Campaigns (${inactiveCampaigns.length}):**\n`;
      inactiveCampaigns.forEach(c => {
        const statusEmoji = c.status === 'paused' ? '⏸️' : c.status === 'archived' ? '📦' : '🚫';
        description += `${statusEmoji} ${c.campaign_name} (${c.status})\n`;
      });
    }

    embed.setDescription(description);

    // Check if we have an existing published message
    const messageKey = `${guildId}:${channel.id}`;
    const existingMessageId = publishedMessages.get(messageKey);

    let publishedMessage = null;

    if (existingMessageId && !forceUpdate) {
      try {
        // Try to update existing message
        const existingMessage = await channel.messages.fetch(existingMessageId);
        publishedMessage = await existingMessage.edit({
          embeds: [embed],
          components: components
        });
        console.log(`✅ Updated existing campaign message in ${channel.name}`);
      } catch (updateError) {
        console.log(`⚠️ Could not update existing message, creating new one:`, updateError.message);
        existingMessageId = null;
      }
    }

    if (!existingMessageId || forceUpdate) {
      // Create new message
      publishedMessage = await channel.send({
        embeds: [embed],
        components: components
      });
      
      // Store the message ID for future updates
      publishedMessages.set(messageKey, publishedMessage.id);
      console.log(`✅ Published new campaign message in ${channel.name}`);
      
      // Delete old message if we're forcing update
      if (forceUpdate && existingMessageId) {
        try {
          const oldMessage = await channel.messages.fetch(existingMessageId);
          await oldMessage.delete();
          console.log(`🗑️ Deleted old campaign message`);
        } catch (deleteError) {
          console.log(`⚠️ Could not delete old message:`, deleteError.message);
        }
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Error publishing campaigns to channel:', error);
    return false;
  }
}

// Function to handle publish requests from dashboard
async function handlePublishRequest(guildId = null, channelIdentifier = null) {
  // Use environment variables if not provided
  const targetGuildId = guildId || DEFAULT_GUILD_ID;
  const targetChannelId = channelIdentifier || DEFAULT_JOIN_CAMPAIGNS_CHANNEL_ID || 'join-campaigns';
  
  console.log(`📢 Received publish request for guild: ${targetGuildId}, channel: ${targetChannelId}`);
  
  if (!targetGuildId) {
    console.error('❌ No guild ID provided and DISCORD_GUILD_ID not configured');
    return false;
  }
  
  const success = await publishCampaignsToChannel(targetGuildId, targetChannelId, true);
  
  if (success) {
    // Update bot stats
    await updateBotStats(targetGuildId, targetChannelId, {
      commands_used: 1,
      last_activity_at: new Date().toISOString()
    });
  }
  
  return success;
}

// Message handler
client.on('messageCreate', async (message) => {
  // Skip bot messages to prevent loops
  if (message.author.bot) return;
  
  // Skip empty messages
  if (!message.content.trim()) return;

  const guildId = message.guild?.id;
  const channelId = message.channel.id;

  try {
    console.log(`📨 Message from ${message.author.tag} in ${message.guild?.name || 'DM'}: "${message.content}"`);
    if (DEBUG) {
      console.log(`   Guild ID: ${guildId}, Channel ID: ${channelId}`);
    }

    // Legacy support for join-campaigns channel (will be deprecated)
    if (message.guild && (message.channel.name === 'join-campaigns' || message.channel.id === DEFAULT_JOIN_CAMPAIGNS_CHANNEL_ID)) {
      // Only process non-command messages in join-campaigns channel
      if (!message.content.startsWith('/')) {
        await message.reply('💡 **Use Slash Commands:** Type `/campaigns` to view and join available campaigns, or `/start` to begin onboarding!\n\n✨ **Clean Interface:** We use only these two slash commands to keep Discord uncluttered!');
        return;
      }
    }

    // Handle DM messages - check all user's guilds for onboarding sessions
    if (!message.guild) {
      console.log(`💬 DM received from ${message.author.tag}: "${message.content}"`);
      
      // Get all guilds the user shares with the bot
      const userGuilds = client.guilds.cache.filter(guild => 
        guild.members.cache.has(message.author.id)
      );
      
      console.log(`👥 User ${message.author.tag} is in ${userGuilds.size} shared guilds: ${userGuilds.map(g => g.name).join(', ')}`);
      
      // Check for active onboarding sessions or incomplete sessions across all guilds
      let dmHandled = false;
      for (const [guildId, guild] of userGuilds) {
        const config = await getBotConfig(guildId);
        if (config) {
          // Handle all campaign statuses in DMs
          if (!config.isActive) {
            await handleInactiveCampaignDM(message, config);
            dmHandled = true;
            break;
          }
          
          // Check for active session first
          if (onboardingManager.isInOnboardingSession(message.author.id, config.campaignId)) {
            console.log(`💬 Handling DM onboarding response for ${message.author.tag} in campaign ${config.campaignId}`);
            await onboardingManager.handleResponse(message, config);
            dmHandled = true;
            break;
          } else {
            // Check database for incomplete session
            const existingSession = await onboardingManager.checkDatabaseSession(config.campaignId, message.author.id, message.author.tag);
            if (existingSession && !existingSession.is_completed && existingSession.next_field) {
              console.log(`🔄 Restoring DM onboarding session for ${message.author.tag} in campaign ${config.campaignId}`);
              await onboardingManager.resumeOnboarding(message, config, existingSession);
              dmHandled = true;
              break;
            }
          }
        }
      }
      
      if (dmHandled) {
        return;
      }
      
      // No active onboarding session found
      return;
    }

    // Get guild configuration (now includes inactive campaigns)
    const config = await getBotConfig(guildId, channelId);
    
    if (!config) {
      console.log(`⚠️ No campaign configuration found for guild: ${guildId}`);
      return;
    }

    console.log(`🎯 Found campaign configuration: ${config.campaignName} (${config.campaignType}) - Status: ${config.campaignStatus}`);

    // Handle inactive campaigns with appropriate messaging
    if (!config.isActive) {
      await handleInactiveCampaignMessage(message, config);
      return;
    }

    // Detect if this might be a referral interaction
    const hasReferralCode = extractReferralCode(message.content);
    const shouldUseReferralCampaign = hasReferralCode || 
      message.content.toLowerCase().includes('referral') ||
      message.content.toLowerCase().includes('invite');

    // Get appropriate config based on context
    let contextConfig = config;
    if (shouldUseReferralCampaign) {
      // Try to get referral onboarding campaign for referral interactions
      const referralConfig = await getBotConfig(guildId, channelId, {
        preferReferralCampaign: true,
        hasReferralCode: !!hasReferralCode,
        campaignType: 'referral_onboarding'
      });
      
      if (referralConfig && referralConfig.campaignType === 'referral_onboarding') {
        console.log(`🔗 Switching to referral campaign: ${referralConfig.campaignName}`);
        contextConfig = referralConfig;
      }
    } else {
      // For general interactions, prefer community engagement campaigns
      const communityConfig = await getBotConfig(guildId, channelId, {
        campaignType: 'community_engagement'
      });
      
      if (communityConfig && communityConfig.campaignType === 'community_engagement') {
        console.log(`👥 Using community campaign: ${communityConfig.campaignName}`);
        contextConfig = communityConfig;
      }
    }

    // Handle campaign-specific logic with template-driven responses (ACTIVE campaigns only)
    let handled = false;
    
    // Check if user has an active onboarding session first
    if (onboardingManager.isInOnboardingSession(message.author.id, contextConfig.campaignId)) {
      console.log(`💬 Handling onboarding response for ${message.author.tag} in campaign ${contextConfig.campaignId}`);
      handled = await onboardingManager.handleResponse(message, contextConfig);
      if (handled) return; // Exit early if onboarding handled the message
    } else {
      // Check database for incomplete onboarding session
      const existingSession = await onboardingManager.checkDatabaseSession(contextConfig.campaignId, message.author.id, message.author.tag);
      if (existingSession && !existingSession.is_completed && existingSession.next_field) {
        console.log(`🔄 Restoring onboarding session for ${message.author.tag} in campaign ${contextConfig.campaignId}`);
        await onboardingManager.resumeOnboarding(message, contextConfig, existingSession);
        return; // Exit early - resumeOnboarding handles the response
      } else if (!existingSession || !existingSession.is_completed) {
        // For community engagement campaigns, auto-start onboarding for new users
        if (contextConfig.campaignType === 'community_engagement') {
          console.log(`🚀 Auto-starting community onboarding for new user ${message.author.tag}`);
          handled = await onboardingManager.startOnboarding(message, contextConfig, { autoStart: true });
          if (handled) return; // Exit early if onboarding started
        }
      }
    }
    
    // First try template-driven auto responses
    console.log(`🔍 Checking for template response to: "${message.content}"`);
    const templateResponse = getTemplateResponse(contextConfig, message.content);
    if (templateResponse) {
      console.log(`✅ Found template response: ${templateResponse.title}`);
      const embed = createCampaignEmbed(
        contextConfig,
        templateResponse.title,
        templateResponse.message,
        templateResponse.color
      );
      await message.reply({ embeds: [embed] });
      handled = true;
    } else {
      console.log(`❌ No template response found for: "${message.content}"`);
    }

    // Handle onboarding status check with template requirements
    if (!handled && (message.content.toLowerCase().includes('onboarding') || 
                     message.content.toLowerCase().includes('status') || 
                     message.content.toLowerCase().includes('complete'))) {
      if (contextConfig.campaignId && contextConfig.campaignName) {
        try {
          const completionStatus = await onboardingManager.checkOnboardingCompletion(
            message.author.id,
            contextConfig.campaignId,
            contextConfig
          );

          const statusEmoji = completionStatus.isComplete ? '✅' : '⏳';
          const statusTitle = `${statusEmoji} Onboarding Status`;
          
          let statusMessage = completionStatus.message;
          if (!completionStatus.isComplete && completionStatus.completionPercentage > 0) {
            statusMessage += `\n\n📊 Progress: ${completionStatus.completionPercentage}% complete`;
          }
          
          statusMessage += `\n\n🔗 Continue here: ${process.env.DASHBOARD_URL}/onboarding/${contextConfig.campaignId}`;

          const embed = createCampaignEmbed(
            contextConfig,
            statusTitle,
            statusMessage,
            completionStatus.isComplete ? '#10b981' : '#f59e0b'
          );
          await message.reply({ embeds: [embed] });
          handled = true;
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          const embed = createCampaignEmbed(
            contextConfig,
            '📋 Onboarding Status',
            `Check your onboarding progress for the ${contextConfig.campaignName} campaign here: ${process.env.DASHBOARD_URL}/onboarding/${contextConfig.campaignId}`,
            '#3b82f6'
          );
          await message.reply({ embeds: [embed] });
          handled = true;
        }
      }
    }

    // Handle start/begin onboarding requests
    if (!handled && (message.content.toLowerCase().includes('start') || 
                     message.content.toLowerCase().includes('begin') || 
                     message.content.toLowerCase().includes('onboard'))) {
      console.log(`🚀 Onboarding start request from ${message.author.tag}`);
      handled = await handleReferralOnboarding(message, contextConfig);
    }

    // Only handle help and other commands for ACTIVE campaigns
    if (!handled && (message.content.toLowerCase().includes('help') || 
                     message.content.toLowerCase().includes('commands') || 
                     message.content.toLowerCase().includes('info'))) {
      const embed = createCampaignEmbed(
        contextConfig,
        '🆘 Help & Commands',
        `Welcome to **${contextConfig.campaignName}**!\n\n**Available Slash Commands:**\n• \`/campaigns\` - View and join available campaigns for this channel\n• \`/start\` - Start onboarding for the active campaign in this channel\n\n**✨ Clean Interface:** We've simplified to just these two commands to keep Discord uncluttered!\n\n**Tip:** Type \`/\` in any channel to see available commands!\n\n**Need more help?**\nContact the server administrators.`,
        contextConfig.config?.brand_color || '#6366f1'
      );
      await message.reply({ embeds: [embed] });
      handled = true;
    }

    // Track all interactions for analytics
    await trackInteraction(
      guildId,
      channelId,
      message,
      handled ? 'handled_message' : 'unhandled_message',
      handled ? 'Bot provided response' : 'No specific response',
      null
    );

  } catch (error) {
    console.error('❌ Error in message handler:', error);
    
    // Send a friendly error message
    try {
      const errorEmbed = createGenericEmbed(
        '⚠️ Oops!',
        'I encountered an error processing your message. Please try again in a moment!',
        '#ff6b6b'
      );
      await message.reply({ embeds: [errorEmbed] });
    } catch (replyError) {
      console.error('❌ Failed to send error message:', replyError);
    }
  }
});

// Handle messages for inactive campaigns
async function handleInactiveCampaignMessage(message, config) {
  let statusMessage = '';
  let color = '#ffa500'; // Orange by default
  
  switch (config.campaignStatus) {
    case 'paused':
      statusMessage = `⏸️ **Campaign Temporarily Paused**\n\nThe **${config.campaignName}** campaign is currently paused.\n\n💡 **What this means:**\n• The campaign will resume soon\n• Your progress is saved\n• You'll be notified when it's back\n\n📧 Contact support for more information.`;
      color = '#f59e0b'; // Yellow/amber
      break;
      
    case 'archived':
      statusMessage = `📦 **Campaign Completed**\n\nThe **${config.campaignName}** campaign has been completed and archived.\n\n✨ **Thank you for participating!**\n\n🔍 **Looking for active campaigns?**\nCheck with the server administrators for current opportunities.`;
      color = '#6b7280'; // Gray
      break;
      
    case 'deleted':
      statusMessage = `🚫 **Campaign No Longer Available**\n\nThe **${config.campaignName}** campaign is no longer available.\n\n🔍 **Looking for active campaigns?**\nCheck with the server administrators for current opportunities.`;
      color = '#ef4444'; // Red
      break;
      
    default:
      statusMessage = `ℹ️ **Campaign Currently Inactive**\n\nThe **${config.campaignName}** campaign is currently inactive.\n\n📧 Contact the server administrators for more information.`;
      break;
  }
  
  const embed = createCampaignEmbed(
    config,
    '🏷️ Campaign Status',
    statusMessage,
    color
  );
  
  await message.reply({ embeds: [embed] });
  
  // Track interaction for analytics
  await trackInteraction(
    message.guild.id,
    message.channel.id,
    message,
    'inactive_campaign_interaction',
    `Campaign status: ${config.campaignStatus}`,
    null
  );
}

// Handle DM messages for inactive campaigns
async function handleInactiveCampaignDM(message, config) {
  let statusMessage = '';
  
  switch (config.campaignStatus) {
    case 'paused':
      statusMessage = `⏸️ **Campaign Paused**\n\nHi ${message.author.username}! The **${config.campaignName}** campaign is temporarily paused. I'll be back soon! 🚀`;
      break;
      
    case 'archived':
      statusMessage = `📦 **Campaign Completed**\n\nHi ${message.author.username}! The **${config.campaignName}** campaign has been completed. Thank you for your participation! ✨`;
      break;
      
    case 'deleted':
      statusMessage = `🚫 **Campaign Unavailable**\n\nHi ${message.author.username}! The **${config.campaignName}** campaign is no longer available.`;
      break;
      
    default:
      statusMessage = `ℹ️ **Campaign Inactive**\n\nHi ${message.author.username}! The **${config.campaignName}** campaign is currently inactive.`;
      break;
  }
  
  const embed = createCampaignEmbed(
    config,
    '🏷️ Campaign Status',
    statusMessage,
    '#ffa500'
  );
  
  await message.reply({ embeds: [embed] });
}

// Create a generic embed for error messages
function createGenericEmbed(title, description, color = null) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  if (color) {
    embed.setColor(color);
  }

  return embed;
}

// Guild member add event for enhanced campaign-specific onboarding
client.on('guildMemberAdd', async (member) => {
  try {
    const config = await getBotConfig(member.guild.id);
    
    if (config) {
      console.log(`👤 New member ${member.user.tag} joined ${member.guild.name} with campaign: ${config.campaignName}`);
      
      // Check for automatic referral context from invite links
      const autoReferralProcessed = await handleReferralInviteContext(member);
      if (autoReferralProcessed) {
        console.log(`✅ Auto-processed referral for ${member.user.tag}`);
        return; // Skip general welcome if referral was processed
      }
      
      // Trigger new member onboarding process
      await handleNewMemberOnboarding(member);
      
      let welcomeTitle = '🎉 Welcome to the Server!';
      const displayName = config.clientName || config.campaignName || 'our community';
      let welcomeMessage = `Welcome to ${displayName}, ${member.user.username}!`;
      
      // Customize message based on campaign type
      switch (config.campaignType) {
        case 'referral_onboarding':
          welcomeMessage += `\n\n🎯 **Referral Campaign**: ${config.campaignName}`;
          welcomeMessage += `\n\n💎 **Got a referral code?** Share it in any channel to unlock exclusive benefits and connect with your referrer!`;
          welcomeMessage += `\n\n🏷️ **How to use:** Simply type your referral code in any channel, and I'll help you get started with special perks.`;
          break;
          
        case 'community_engagement':
          welcomeMessage += `\n\n🌟 **Community Campaign**: ${config.campaignName}`;
          welcomeMessage += `\n\n💬 **Let's connect!** This server is all about building an amazing community together.`;
          welcomeMessage += `\n\n🤝 **Get started:** Say hello in the chat, and I'll help you navigate your journey here!`;
          break;
          
        case 'gaming_community':
          welcomeMessage += `\n\n🎮 **Gaming Campaign**: ${config.campaignName}`;
          welcomeMessage += `\n\n🕹️ **Ready to game?** Share your favorite games and connect with fellow gamers!`;
          welcomeMessage += `\n\n🏆 **Tip:** Use any referral codes to unlock gaming perks and exclusive content!`;
          break;
          
        default:
          welcomeMessage += `\n\n✨ **Campaign**: ${config.campaignName}`;
          welcomeMessage += `\n\n📢 I'm here to help you get the most out of this community!`;
      }
      
      // Add campaign-specific instructions
      if (config.config.description) {
        welcomeMessage += `\n\n📝 **About this campaign:**\n${config.config.description}`;
      }
      
      // Add call to action
      welcomeMessage += `\n\n🚀 **Ready to start?** Drop a message in any channel and I'll assist you!`;

      const embed = createCampaignEmbed(
        config,
        welcomeTitle,
        welcomeMessage
      );

      // Try to send DM first, fallback to system channel
      let messageSent = false;
      try {
        await member.send({ embeds: [embed] });
        messageSent = true;
        console.log(`📩 Sent welcome DM to ${member.user.tag}`);
      } catch (dmError) {
        console.log(`⚠️ Could not DM ${member.user.tag}, trying system channel...`);
        
        const systemChannel = member.guild.systemChannel;
        if (systemChannel) {
          try {
            await systemChannel.send({ 
              content: `${member.user} Welcome! 👋`, 
              embeds: [embed] 
            });
            messageSent = true;
            console.log(`📢 Sent welcome message to system channel for ${member.user.tag}`);
          } catch (channelError) {
            console.error(`Failed to send to system channel:`, channelError);
          }
        }
      }

      // Track the join event
      await trackInteraction(
        member.guild.id,
        member.guild.systemChannel?.id || 'dm',
        { 
          author: member.user, 
          id: `join-${member.user.id}`, 
          content: 'User joined server',
          guild: member.guild,
          channel: { id: member.guild.systemChannel?.id || 'dm' }
        },
        'guild_join',
        messageSent ? 'Campaign-specific welcome message sent' : 'Welcome message failed',
        null
      );
      
      console.log(`✅ Processed guild join for ${member.user.tag} in campaign ${config.campaignName}`);
    }
  } catch (error) {
    console.error('Error handling guild member add:', error);
  }
});

// Error handling
client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

client.on('warn', (warning) => {
  console.warn('⚠️ Discord client warning:', warning);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// Validate environment and start bot
if (!DISCORD_TOKEN) {
  console.error('❌ Error: DISCORD_BOT_TOKEN environment variable is required');
  console.log('\n📋 Setup checklist:');
  console.log('1. Create a Discord bot at https://discord.com/developers/applications');
  console.log('2. Copy the bot token');
  console.log('3. Create a .env file with: DISCORD_BOT_TOKEN=your_token_here');
  console.log('4. Enable "Message Content Intent" in the bot settings');
  console.log('5. Invite the bot to your server with appropriate permissions');
  console.log('6. Set DASHBOARD_API_URL to your Virion Labs dashboard API endpoint');
  process.exit(1);
}

console.log('🚀 Starting Virion Labs Discord Bot...');
console.log('📡 Connecting to Discord...');

// Login to Discord
client.login(DISCORD_TOKEN).catch((error) => {
  console.error('❌ Failed to login to Discord:', error);
  console.log('\n❓ Troubleshooting:');
  console.log('1. Check if your DISCORD_BOT_TOKEN is correct');
  console.log('2. Ensure the bot token has proper permissions');
  console.log('3. Verify your internet connection is stable');
  console.log('4. Make sure the bot isn\'t already running elsewhere');
  console.log('5. Check if "Message Content Intent" is enabled in Discord Developer Portal');
  process.exit(1);
});

// Function to clear cache for a specific guild
function clearGuildCache(guildId) {
  const keysToDelete = [];
  for (const key of configCache.keys()) {
    if (key.startsWith(`${guildId}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => configCache.delete(key));
  console.log(`🗑️ Cleared cache for guild ${guildId} (${keysToDelete.length} entries)`);
}

// Function to clear all cache
function clearAllCache() {
  const size = configCache.size;
  configCache.clear();
  console.log(`🗑️ Cleared all config cache (${size} entries)`);
}

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(interaction);
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('onboarding_modal_')) {
        await handleOnboardingModalSubmission(interaction);
      }
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('start_onboarding_')) {
        await handleOnboardingStartButton(interaction);
      }
    }
  } catch (error) {
    console.error('❌ Error handling interaction:', error);
    
    // Try to respond with an error message if possible
    try {
      const errorMessage = '❌ An error occurred while processing your command. Please try again.';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('❌ Failed to send error reply:', replyError);
    }
  }
});

// Create and store modal session for a campaign
async function createCampaignModalSession(campaignId, userId, username, config) {
  try {
    console.log(`📦 Creating campaign modal session for ${username} in campaign ${campaignId}`);
    
    // Step 1: Get or create the onboarding session from the dashboard API
    const sessionResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding?campaign_id=${campaignId}&discord_user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      }
    });

    let onboardingSession;
    
    if (sessionResponse.ok) {
      onboardingSession = await sessionResponse.json();
      console.log(`✅ Retrieved existing onboarding session for ${username}: completed=${onboardingSession.is_completed}`);
      
      if (onboardingSession.is_completed) {
        console.log(`⚠️ User ${username} has already completed onboarding for campaign ${campaignId}`);
        return { completed: true };
      }
    } else {
      // Create new session
      console.log(`📝 Creating new onboarding session for ${username}`);
      const createResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          discord_user_id: userId,
          discord_username: username
        })
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error(`❌ Failed to create onboarding session: ${createResponse.status} - ${errorText}`);
        return null;
      }

      onboardingSession = await createResponse.json();
      console.log(`✅ Created new onboarding session for ${username}: fields=${onboardingSession.fields?.length || 0}`);
    }

    // Step 2: Process the fields to determine what needs to be shown
    if (!onboardingSession.fields || onboardingSession.fields.length === 0) {
      console.log(`⚠️ No fields configured for campaign ${campaignId}`);
      return { fields: [] };
    }

    // Get incomplete fields
    const completedFieldKeys = new Set(
      onboardingSession.existing_responses?.filter(r => r.field_value && r.field_value.trim() !== '').map(r => r.field_key) || []
    );

    const incompleteFields = onboardingSession.fields.filter(field => !completedFieldKeys.has(field.field_key));
    console.log(`🔍 Found ${incompleteFields.length} incomplete fields out of ${onboardingSession.fields.length} total`);

    if (incompleteFields.length === 0) {
      console.log(`✅ All fields completed for ${username} in campaign ${campaignId}`);
      return { completed: true };
    }

    // Step 3: Store the modal session in the database
    const modalSessionData = {
      fields: incompleteFields,
      config,
      username: username,
      created_at: new Date().toISOString(),
      field_keys: incompleteFields.map(f => f.field_key)
    };

    console.log(`📦 Storing modal session data for ${username}`);
    
    // Clear any existing session first
    await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding/modal-session?campaign_id=${campaignId}&discord_user_id=${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      }
    });

    // Store new session
    const storeResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding/modal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        discord_user_id: userId,
        discord_username: username,
        session_data: modalSessionData
      })
    });

    if (!storeResponse.ok) {
      const errorText = await storeResponse.text();
      console.error(`❌ Failed to store modal session: ${storeResponse.status} - ${errorText}`);
      // Continue anyway - we can still show the modal with the data we have
    } else {
      console.log(`✅ Modal session stored successfully for ${username}`);
    }

    // Step 4: Return the session data ready for modal creation
    return modalSessionData;

  } catch (error) {
    console.error('❌ Error creating campaign modal session:', error);
    return null;
  }
}

// Handle onboarding start button interactions
async function handleOnboardingStartButton(interaction) {
  try {
    // Don't defer reply when showing modals - Discord doesn't allow both
    
    // Parse the custom ID: start_onboarding_{campaignId}_{userId}
    const customIdParts = interaction.customId.split('_');
    if (customIdParts.length < 4) {
      await interaction.reply({
        content: '❌ Invalid button interaction. Please try again.',
        flags: 64 // MessageFlags.Ephemeral
      });
      return;
    }
    
    const campaignId = customIdParts[2];
    const expectedUserId = customIdParts[3];
    const actualUserId = interaction.user.id;
    
    // Verify the user ID matches (security check)
    if (expectedUserId !== actualUserId) {
      await interaction.reply({
        content: '❌ This button is not for you. Please use `/start` to begin your own onboarding.',
        flags: 64 // MessageFlags.Ephemeral
      });
      return;
    }
    
    console.log(`🔘 Onboarding start button clicked by ${interaction.user.tag} for campaign ${campaignId}`);
    
    // Get campaign configuration using the campaign ID
    const { data: campaignData, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('is_deleted', false)
      .single();
      
    if (campaignError || !campaignData) {
      console.error('❌ Error fetching campaign:', campaignError);
      await interaction.reply({
        content: '❌ Campaign not found or no longer available.',
        flags: 64 // MessageFlags.Ephemeral
      });
      return;
    }
    
    // Check if campaign is still active
    if (!campaignData.is_active) {
      const status = getCampaignStatus(campaignData);
      await interaction.reply({
        content: `❌ The campaign "${campaignData.campaign_name}" is currently ${status} and not accepting new participants.`,
        flags: 64 // MessageFlags.Ephemeral
      });
      return;
    }
    
    // Build config object for the onboarding manager
    const config = {
      isActive: campaignData.is_active,
      campaignStatus: getCampaignStatus(campaignData),
      campaignId: campaignData.id,
      campaignName: campaignData.campaign_name,
      campaignType: campaignData.campaign_type,
      clientName: campaignData.client_name,
      config: {
        bot_name: campaignData.bot_name || 'Virion Bot',
        brand_color: campaignData.brand_color || '#6366f1',
        welcome_message: campaignData.welcome_message,
        prefix: campaignData.prefix || '/',
        template: campaignData.template || 'standard',
        onboarding_flow: campaignData.onboarding_flow || {},
        onboarding_completion_requirements: campaignData.onboarding_completion_requirements || {},
        referral_tracking_enabled: campaignData.referral_tracking_enabled || false,
        auto_role_assignment: campaignData.auto_role_assignment || false,
        target_role_ids: campaignData.target_role_ids || [],
        auto_responses: campaignData.auto_responses || {},
        response_templates: campaignData.response_templates || {},
        private_channel_setup: campaignData.private_channel_setup || {},
        access_control_enabled: campaignData.access_control_enabled || false,
        referral_only_access: campaignData.referral_only_access || false,
        moderation_enabled: campaignData.moderation_enabled !== false,
        rate_limit_per_user: campaignData.rate_limit_per_user || 5,
        allowed_channels: campaignData.allowed_channels || [],
        blocked_users: campaignData.blocked_users || [],
        content_filters: campaignData.content_filters || []
      },
      referralLinkId: campaignData.referral_link_id,
      influencerId: campaignData.influencer_id,
      referralCode: campaignData.referral_code
    };
    

    
        // Create and store modal session directly for this campaign
    console.log(`🚀 Creating modal session for ${interaction.user.tag} in campaign ${config.campaignName}`);
    const modalSession = await createCampaignModalSession(campaignId, actualUserId, interaction.user.tag, config);
    
    if (!modalSession) {
      await interaction.reply({
        content: `❌ Failed to create onboarding session for **${config.campaignName}**. Please try again later.`,
        flags: 64 // MessageFlags.Ephemeral
      });
      return;
    }
    
    // Check if user has already completed onboarding
    if (modalSession.completed) {
      await interaction.reply({
        content: `✅ You've already completed onboarding for **${config.campaignName}**!\n\nWelcome back! You're all set to enjoy the community features.`,
        flags: 64 // MessageFlags.Ephemeral
      });
      return;
    }
    
    // Check if no fields are configured
    if (!modalSession.fields || modalSession.fields.length === 0) {
      console.log(`⚠️ No fields configured for campaign ${config.campaignName}`);
      
      // No fields configured - complete onboarding immediately
      await interaction.reply({
        content: `🎉 Welcome to **${config.campaignName}**!\n\nNo additional information is needed. You're all set to enjoy the community features!`,
        flags: 64 // MessageFlags.Ephemeral
      });
      
      // Track completion
      await trackInteraction(interaction.guild?.id, interaction.channel?.id, {
        author: { id: actualUserId, tag: interaction.user.tag },
        id: interaction.id,
        content: `onboarding_completed_no_fields_${campaignId}`
      }, 'onboarding_completed');
      
      return;
    }

    // Create and show the actual modal
    console.log(`📝 Creating modal with ${modalSession.fields.length} fields for ${interaction.user.tag}`);
    
    const modal = new ModalBuilder()
      .setCustomId(`onboarding_modal_${campaignId}_${actualUserId}`)
      .setTitle(`${config.campaignName} - Onboarding`);

    const components = [];
    
    // Add up to 5 fields to the modal (Discord's limit)
    const fieldsToShow = modalSession.fields.slice(0, 5);
    
    for (const field of fieldsToShow) {
      // Truncate label to Discord's 45-character limit
      const label = field.field_label || field.field_key;
      const truncatedLabel = label.length > 45 ? label.substring(0, 42) + '...' : label;
      
      const textInput = new TextInputBuilder()
        .setCustomId(field.field_key)
        .setLabel(truncatedLabel)
        .setStyle(field.field_type === 'textarea' ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setPlaceholder(field.field_placeholder || `Enter your ${field.field_label || field.field_key}`)
        .setRequired(field.is_required || false);

      if (field.field_type === 'textarea') {
        textInput.setMaxLength(1000);
      } else {
        textInput.setMaxLength(100);
      }

      const actionRow = new ActionRowBuilder().addComponents(textInput);
      components.push(actionRow);
    }

    modal.addComponents(...components);

    // Show the modal
    try {
      await interaction.showModal(modal);
      console.log(`✅ Modal shown successfully to ${interaction.user.tag} for campaign ${config.campaignName}`);
         } catch (modalError) {
       console.error('❌ Error showing modal:', modalError);
       await interaction.reply({
         content: `❌ Failed to show onboarding form. Please try again later.`,
         flags: 64 // MessageFlags.Ephemeral
       });
     }
    
    // Track the interaction
    await trackInteraction(interaction.guild?.id, interaction.channel?.id, {
      author: { id: actualUserId, tag: interaction.user.tag },
      id: interaction.id,
      content: `start_onboarding_button_${campaignId}`
    }, 'onboarding_start_button');
    
  } catch (error) {
    console.error('❌ Error in onboarding start button handler:', error);
    try {
      if (!interaction.replied) {
        await interaction.reply({
          content: '❌ An error occurred while starting onboarding. Please try again later.',
          flags: 64 // MessageFlags.Ephemeral
        });
      } else {
        await interaction.followUp({
          content: '❌ An error occurred while starting onboarding. Please try again later.',
          flags: 64 // MessageFlags.Ephemeral
        });
      }
    } catch (replyError) {
      console.error('❌ Failed to send error reply:', replyError);
    }
  }
}

// Handle onboarding modal submission interactions
async function handleOnboardingModalSubmission(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // Parse the custom ID: onboarding_modal_{campaignId}_{userId}
    const customIdParts = interaction.customId.split('_');
    if (customIdParts.length < 4) {
      await interaction.editReply({
        content: '❌ Invalid modal submission. Please try again.'
      });
      return;
    }
    
    const campaignId = customIdParts[2];
    const expectedUserId = customIdParts[3];
    const actualUserId = interaction.user.id;
    
    // Verify the user ID matches (security check)
    if (expectedUserId !== actualUserId) {
      await interaction.editReply({
        content: '❌ This modal submission is not valid for your account.'
      });
      return;
    }
    
    console.log(`📝 Onboarding modal submitted by ${interaction.user.tag} for campaign ${campaignId}`);
    
    // Get campaign configuration
    const { data: campaignData, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('is_deleted', false)
      .single();
      
    if (campaignError || !campaignData) {
      console.error('❌ Error fetching campaign:', campaignError);
      await interaction.editReply({
        content: '❌ Campaign not found. Your responses could not be saved.'
      });
      return;
    }
    
    // Build config object
    const config = {
      isActive: campaignData.is_active,
      campaignStatus: getCampaignStatus(campaignData),
      campaignId: campaignData.id,
      campaignName: campaignData.campaign_name,
      campaignType: campaignData.campaign_type,
      clientName: campaignData.client_name,
      config: {
        bot_name: campaignData.bot_name || 'Virion Bot',
        brand_color: campaignData.brand_color || '#6366f1',
        welcome_message: campaignData.welcome_message,
        completion_message: campaignData.completion_message,
        auto_role_assignment: campaignData.auto_role_assignment || false,
        target_role_ids: campaignData.target_role_ids || []
      }
    };
    
    // Process the modal field responses
    const responses = {};
    interaction.fields.fields.forEach((field, fieldId) => {
      responses[fieldId] = field.value;
    });
    
    console.log(`📋 Processing ${Object.keys(responses).length} field responses`);
    
    // Save each response to the dashboard
    let allSaved = true;
    let lastSaveResult = null;
    
    for (const [fieldKey, fieldValue] of Object.entries(responses)) {
      try {
        const saveResult = await onboardingManager.saveResponse(
          campaignId,
          actualUserId,
          interaction.user.tag,
          fieldKey,
          fieldValue
        );
        
        if (!saveResult.success) {
          console.error(`❌ Failed to save response for field ${fieldKey}:`, saveResult.error);
          allSaved = false;
          break;
        }
        
        lastSaveResult = saveResult;
        console.log(`✅ Saved response for field ${fieldKey}`);
      } catch (error) {
        console.error(`❌ Error saving response for field ${fieldKey}:`, error);
        allSaved = false;
        break;
      }
    }
    
    if (!allSaved) {
      await interaction.editReply({
        content: '❌ There was an error saving your responses. Please try again.'
      });
      return;
    }
    
    // Check if onboarding is now complete
    if (lastSaveResult && lastSaveResult.is_completed) {
      // Fetch the member object for role assignment
      let member = null;
      try {
        member = await interaction.guild.members.fetch(actualUserId);
        console.log(`✅ Fetched member object for role assignment: ${member.user.tag}`);
      } catch (memberError) {
        console.error(`❌ Failed to fetch member object for ${interaction.user.tag}:`, memberError);
      }
      
      // Create synthetic message for completion
      const syntheticMessage = {
        author: interaction.user,
        user: interaction.user,
        member: member, // Add the member object for role assignment
        guild: interaction.guild,
        channel: interaction.channel,
        content: 'onboarding_modal_completed',
        id: interaction.id,
        reply: async (options) => {
          return await interaction.editReply(options);
        },
        followUp: async (options) => {
          return await interaction.followUp({ ...options, ephemeral: true });
        },
        isButton: () => true
      };
      
      await onboardingManager.completeOnboarding(syntheticMessage, config);
    } else {
      // More fields to complete
      const nextField = lastSaveResult?.next_field;
      if (nextField) {
        await interaction.editReply({
          content: `✅ **Responses Saved!**\n\nThank you for your responses. There are still more fields to complete for **${config.campaignName}**.\n\n📝 You can continue your onboarding through the dashboard or wait for the next modal.`
        });
      } else {
        await interaction.editReply({
          content: `✅ **Responses Saved!**\n\nThank you for your responses to **${config.campaignName}**. Your onboarding is being processed.`
        });
      }
    }
    
    // Track the interaction
    await trackInteraction(interaction.guild?.id, interaction.channel?.id, {
      author: { id: actualUserId, tag: interaction.user.tag },
      id: interaction.id,
      content: `onboarding_modal_submission_${campaignId}`
    }, 'onboarding_modal_submission');
    
  } catch (error) {
    console.error('❌ Error in onboarding modal submission handler:', error);
    try {
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({
          content: '❌ An error occurred while processing your responses. Please try again later.'
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          content: '❌ An error occurred while processing your responses. Please try again later.',
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: '❌ An error occurred while processing your responses. Please try again later.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('❌ Failed to send error reply:', replyError);
    }
  }
}


