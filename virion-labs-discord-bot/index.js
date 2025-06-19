const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
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
client.once('ready', () => {
  console.log('🤖 Virion Labs Discord Bot is ready!');
  console.log(`📡 Logged in as ${client.user.tag}`);
  console.log(`🔗 Dashboard API: ${DASHBOARD_API_URL}`);
  console.log(`🌐 HTTP Server: http://localhost:${HTTP_PORT}`);
  console.log(`🎯 Target Guild: ${DEFAULT_GUILD_ID || 'Not configured'}`);
  console.log(`📺 Target Channel: ${DEFAULT_JOIN_CAMPAIGNS_CHANNEL_ID || 'join-campaigns (by name)'}`);
  console.log(`🐛 Debug mode: ${DEBUG ? 'ON' : 'OFF'}`);
  console.log('✅ Bot is now listening for messages, interactions, and webhook requests...\n');
  
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
async function getBotConfig(guildId, channelId = null) {
  try {
    console.log('🔍 Fetching bot configuration for guild:', guildId, 'channel:', channelId);
    
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
      const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/config?guild_id=${guildId}${channelId ? `&channel_id=${channelId}` : ''}&include_inactive=true`, {
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
          console.log('✅ Successfully got config from dashboard API:', campaign.name);
          return {
            campaignId: campaign.id,
            campaignName: campaign.name,
            campaignType: campaign.type,
            clientId: campaign.client?.id,
            clientName: campaign.client?.name,
            config: campaign.bot_config || {},
            templateConfig: campaign.template_config || null,
            campaignStatus: campaign.status || 'unknown',
            isActive: campaign.is_active || false
          };
        } else {
          console.log('❌ Dashboard API says not configured:', apiData);
        }
      } else {
        console.error('❌ Dashboard API failed:', response.status, await response.text());
      }
    } catch (apiError) {
      console.error('❌ Dashboard API error:', apiError);
    }
    
    console.log('❌ All methods failed - no campaign configuration found');
    return null;
    
  } catch (error) {
    console.error('❌ Unexpected error fetching bot config:', error);
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
                  const welcomeEmbed = createCampaignEmbed(
                    config,
                    '🎉 Welcome!',
                    `Welcome to **${config.clientName}**! We detected a referral link, but it appears to be invalid or expired.\n\n✨ No worries though - you can still get started with our community!`,
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
    // Get guild configuration
    const config = await getBotConfig(member.guild.id);
    
    if (!config) {
      return; // No campaign configured for this guild
    }
    
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
        
        console.log(`🚀 Auto-starting onboarding for ${member.user.tag} in ${config.campaignName}`);
        
        // Start onboarding immediately
        await onboardingManager.startOnboarding(syntheticMessage, config, {
          autoStart: true
        });
        
        console.log(`✅ Auto-started onboarding for ${member.user.tag}`);
        
      } catch (error) {
        if (error.code === 50007) {
          console.log(`❌ Cannot send DM to ${member.user.tag} (DMs disabled)`);
          
          // Fallback: try to send to system channel with instructions
          try {
            if (member.guild.systemChannel) {
              const fallbackEmbed = new EmbedBuilder()
                .setTitle(`🎉 Welcome ${member.user.username}!`)
                .setDescription(`Welcome to **${config.clientName}**!\n\n📝 I tried to start your onboarding process in DMs, but it seems you have DMs disabled.\n\n💡 Please enable DMs from server members and type "start" to begin your onboarding journey!`)
                .setColor(config.bot_config?.brand_color || '#6366f1')
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
      // Start dynamic onboarding process with referral context
      return await onboardingManager.startOnboarding(message, config, {
        referralCode,
        referralValidation: validation
      });
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
    
    // Start onboarding without referral context
    return await onboardingManager.startOnboarding(message, config);
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

    if (message.guild && (message.channel.name === 'join-campaigns' || message.channel.id === DEFAULT_JOIN_CAMPAIGNS_CHANNEL_ID || message.content.toLowerCase().startsWith('!campaigns'))) {
      // Check if this is a publish command from admin
      if (message.content.toLowerCase().startsWith('!publish') || message.content.toLowerCase().startsWith('!update')) {
        // Only allow admins/mods to publish
        if (message.member?.permissions?.has('MANAGE_CHANNELS') || message.member?.permissions?.has('ADMINISTRATOR')) {
          // Use channel ID if configured, otherwise use channel name
          const channelIdentifier = DEFAULT_JOIN_CAMPAIGNS_CHANNEL_ID || message.channel.name;
          const success = await publishCampaignsToChannel(guildId, channelIdentifier, true);
          if (success) {
            await message.reply('✅ Campaign list updated successfully!');
          } else {
            await message.reply('❌ Failed to update campaign list. Please try again.');
          }
          return;
        } else {
          await message.reply('❌ You need Manage Channels or Administrator permission to publish campaigns.');
          return;
        }
      }

      const activeCampaigns = await fetchActiveCampaigns(guildId);
      const allCampaigns = await fetchAllCampaigns(guildId);
      
      if (!allCampaigns.length) {
        await message.reply('No campaigns found for this server.');
        return;
      }
      
      // Show active campaigns as buttons if available
      if (activeCampaigns.length > 0) {
        const row = new ActionRowBuilder();
        activeCampaigns.slice(0,5).forEach(c => {
          row.addComponents(new ButtonBuilder()
            .setCustomId(`join_${c.id}`)
            .setLabel(c.campaign_name)
            .setStyle(ButtonStyle.Primary));
        });
        
        let statusMessage = `**Active Campaigns (${activeCampaigns.length}):**\nSelect a campaign to join:`;
        
        // Add inactive campaign information if any exist
        const inactiveCampaigns = allCampaigns.filter(c => !c.is_active);
        if (inactiveCampaigns.length > 0) {
          statusMessage += `\n\n**Inactive Campaigns (${inactiveCampaigns.length}):**`;
          inactiveCampaigns.forEach(c => {
            const statusEmoji = c.status === 'paused' ? '⏸️' : c.status === 'archived' ? '📦' : '🚫';
            statusMessage += `\n${statusEmoji} ${c.campaign_name} (${c.status})`;
          });
        }
        
        await message.reply({ content: statusMessage, components: [row] });
      } else {
        // No active campaigns, show status of all campaigns
        let statusMessage = '**All Campaigns:**\n';
        allCampaigns.forEach(c => {
          const statusEmoji = c.status === 'paused' ? '⏸️' : c.status === 'archived' ? '📦' : '🚫';
          statusMessage += `\n${statusEmoji} ${c.campaign_name} (${c.status})`;
        });
        statusMessage += '\n\n*No active campaigns available to join right now.*';
        
        await message.reply(statusMessage);
      }
      return;
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

    // Handle campaign-specific logic with template-driven responses (ACTIVE campaigns only)
    let handled = false;
    
    // Check if user has an active onboarding session first
    if (onboardingManager.isInOnboardingSession(message.author.id, config.campaignId)) {
      console.log(`💬 Handling onboarding response for ${message.author.tag} in campaign ${config.campaignId}`);
      handled = await onboardingManager.handleResponse(message, config);
      if (handled) return; // Exit early if onboarding handled the message
    } else {
      // Check database for incomplete onboarding session
      const existingSession = await onboardingManager.checkDatabaseSession(config.campaignId, message.author.id, message.author.tag);
      if (existingSession && !existingSession.is_completed && existingSession.next_field) {
        console.log(`🔄 Restoring onboarding session for ${message.author.tag} in campaign ${config.campaignId}`);
        await onboardingManager.resumeOnboarding(message, config, existingSession);
        return; // Exit early - resumeOnboarding handles the response
      } else if (!existingSession || !existingSession.is_completed) {
        // For community engagement campaigns, auto-start onboarding for new users
        if (config.campaignType === 'community_engagement') {
          console.log(`🚀 Auto-starting onboarding for new user ${message.author.tag} in community engagement campaign`);
          handled = await onboardingManager.startOnboarding(message, config, { autoStart: true });
          if (handled) return; // Exit early if onboarding started
        }
      }
    }
    
    // First try template-driven auto responses
    console.log(`🔍 Checking for template response to: "${message.content}"`);
    const templateResponse = getTemplateResponse(config, message.content);
    if (templateResponse) {
      console.log(`✅ Found template response: ${templateResponse.title}`);
      const embed = createCampaignEmbed(
        config,
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
      if (config.campaignId && config.campaignName) {
        try {
          const completionStatus = await onboardingManager.checkOnboardingCompletion(
            message.author.id,
            config.campaignId,
            config
          );

          const statusEmoji = completionStatus.isComplete ? '✅' : '⏳';
          const statusTitle = `${statusEmoji} Onboarding Status`;
          
          let statusMessage = completionStatus.message;
          if (!completionStatus.isComplete && completionStatus.completionPercentage > 0) {
            statusMessage += `\n\n📊 Progress: ${completionStatus.completionPercentage}% complete`;
          }
          
          statusMessage += `\n\n🔗 Continue here: ${process.env.DASHBOARD_URL}/onboarding/${config.campaignId}`;

          const embed = createCampaignEmbed(
            config,
            statusTitle,
            statusMessage,
            completionStatus.isComplete ? '#10b981' : '#f59e0b'
          );
          await message.reply({ embeds: [embed] });
          handled = true;
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          const embed = createCampaignEmbed(
            config,
            '📋 Onboarding Status',
            `Check your onboarding progress for the ${config.campaignName} campaign here: ${process.env.DASHBOARD_URL}/onboarding/${config.campaignId}`,
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
      handled = await handleReferralOnboarding(message, config);
    }

    // Only handle help and other commands for ACTIVE campaigns
    if (!handled && (message.content.toLowerCase().includes('help') || 
                     message.content.toLowerCase().includes('commands') || 
                     message.content.toLowerCase().includes('info'))) {
      const embed = createCampaignEmbed(
        config,
        '🆘 Help & Commands',
        `Welcome to **${config.campaignName}**!\n\n**Available Commands:**\n• Type any message to interact with me\n• Use "start" or "begin" to start onboarding\n• Use "status" to check your onboarding progress\n\n**Need more help?**\nContact our support team!`,
        config.config?.brand_color || '#6366f1'
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
      let welcomeMessage = `Welcome to ${config.clientName}, ${member.user.username}!`;
      
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
  if (!interaction.isButton()) return;
  if (interaction.customId.startsWith('join_')) {
    const campaignId = interaction.customId.replace('join_', '');
    
    try {
      const { data, error } = await supabase
        .from('discord_guild_campaigns')
        .select(`
          *,
          clients:client_id(name, industry)
        `)
        .eq('id', campaignId)
        .single();
        
      if (error || !data) {
        await interaction.reply({ 
          content: '❌ Campaign not found or no longer available.',
          flags: 64 
        });
        return;
      }

      const config = {
        campaignId: data.id,
        campaignName: data.campaign_name,
        campaignType: data.campaign_type,
        clientId: data.client_id,
        clientName: data.clients?.name || 'Unknown Client',
        config: data,
        templateConfig: null
      };

      // Get or create onboarding session
      const userId = interaction.user.id;
      const username = interaction.user.tag;
      
      const session = await onboardingManager.getOrCreateSession(campaignId, userId, username, {});
      
      if (!session.success) {
        await interaction.reply({
          content: '❌ Failed to start onboarding. Please try again later.',
          flags: 64
        });
        return;
      }

      // Check if already completed
      if (session.is_completed) {
        await interaction.reply({
          content: `✅ **Welcome back!**\n\nYou've already completed the onboarding process for **${config.campaignName}**.\n\nYou're all set to enjoy all the community features!`,
          flags: 64
        });
        return;
      }

      // Check if there are no fields (immediate completion)
      if (!session.fields || session.fields.length === 0) {
        await interaction.reply({
          content: `🎉 **Welcome to ${config.clientName}!**\n\nNo additional information needed - you're all set!`,
          flags: 64
        });
        
        // Complete onboarding immediately
        await onboardingManager.completeOnboarding({
          author: interaction.user,
          member: interaction.member,
          guild: interaction.guild,
          channel: interaction.channel,
          reply: async (options) => {
            await interaction.followUp({ ...options, flags: 64 });
          },
          followUp: async (options) => {
            await interaction.followUp({ ...options, flags: 64 });
          }
        }, config, null);
        return;
      }

      // Get incomplete fields
      const incompleteFields = onboardingManager.getIncompleteFields(session);
      
      if (incompleteFields.length === 0) {
        await interaction.reply({
          content: `🎉 **Welcome back to ${config.clientName}!**\n\nLooks like you've already provided all the required information. You're all set!`,
          flags: 64
        });
        
        // Complete onboarding 
        await onboardingManager.completeOnboarding({
          author: interaction.user,
          member: interaction.member,
          guild: interaction.guild,
          channel: interaction.channel,
          reply: async (options) => {
            await interaction.followUp({ ...options, flags: 64 });
          },
          followUp: async (options) => {
            await interaction.followUp({ ...options, flags: 64 });
          }
        }, config, null);
        return;
      }

      // **SHOW MODAL IMMEDIATELY** - This is the key change!
      const modal = createOnboardingModal(incompleteFields, 1, config);
      await interaction.showModal(modal);
      
      console.log(`✅ Showed onboarding modal immediately for ${username} in campaign ${config.campaignName}`);
      
      // Store session data for when the modal is submitted
      await onboardingManager.storeSessionForModal(campaignId, userId, {
        fields: incompleteFields,
        config,
        referralValidation: null
      });

    } catch (error) {
      console.error('Error handling campaign join button:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ An error occurred while starting the onboarding process. Please try again.',
          flags: 64
        });
      }
    }
  }
});

// Handle modal interactions
client.on('interactionCreate', async (interaction) => {
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('onboarding_modal_')) {
      await handleOnboardingModalSubmission(interaction);
    }
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith('start_onboarding_')) {
      await handleOnboardingStartButton(interaction);
    }
  }
});

// Handle onboarding modal submissions
async function handleOnboardingModalSubmission(interaction) {
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const username = interaction.user.tag;
  let hasReplied = false;

  try {
    // ═══════════════════════════════════════════════════════════════
    // SCENARIO 1: CONFIGURATION VALIDATION
    // ═══════════════════════════════════════════════════════════════
    const config = await getBotConfig(guildId, interaction.channel.id);
    if (!config) {
      await safeReply(interaction, {
        content: '❌ **Configuration Error**\nNo campaign configuration found for this server. Please contact an administrator.',
        flags: 64
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO 2: INPUT VALIDATION & PROCESSING
    // ═══════════════════════════════════════════════════════════════
    const modalPart = parseInt(interaction.customId.split('_').pop()) || 1;
    const responses = {};
    
    // Validate and sanitize responses
    try {
      interaction.fields.fields.forEach((field, fieldId) => {
        const value = field.value?.trim();
        if (!value) {
          throw new Error(`Field '${fieldId}' cannot be empty`);
        }
        responses[fieldId] = value;
      });
    } catch (validationError) {
      await safeReply(interaction, {
        content: `❌ **Validation Error**\n${validationError.message}\n\nPlease fill out all required fields.`,
        flags: 64
      });
      return;
    }

    console.log(`📝 Processing modal ${modalPart} submission for ${username}:`, Object.keys(responses));

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO 3: SESSION DATA RETRIEVAL
    // ═══════════════════════════════════════════════════════════════
    let sessionData;
    try {
      sessionData = await onboardingManager.getStoredModalSession(config.campaignId, userId);
    } catch (sessionError) {
      console.error('Error retrieving session data:', sessionError);
      await safeReply(interaction, {
        content: '❌ **Session Error**\nYour onboarding session could not be retrieved. Please restart the process.',
        flags: 64
      });
      return;
    }

    const referralValidation = sessionData?.referralValidation || null;

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO 4: API SUBMISSION & ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════
    let saveResult;
    try {
      saveResult = await saveOnboardingModalResponses({
        campaign_id: config.campaignId,
        discord_user_id: userId,
        discord_username: username,
        responses: responses,
        modal_part: modalPart,
        referral_id: referralValidation?.referral_id,
        referral_link_id: referralValidation?.referral_link_id
      });
    } catch (apiError) {
      console.error('API submission error:', apiError);
      await safeReply(interaction, {
        content: `❌ **Network Error**\nFailed to submit your responses due to a connection issue.\n\n🔄 **Please try again in a moment.** Your progress has been saved.`,
        flags: 64
      });
      return;
    }

    // Handle API response errors
    if (!saveResult) {
      await safeReply(interaction, {
        content: '❌ **Server Error**\nReceived an invalid response from the server. Please try again.',
        flags: 64
      });
      return;
    }

    if (!saveResult.success) {
      const errorMessage = saveResult.error || 'Unknown error occurred';
      console.error('Save failed:', errorMessage);
      
      // Categorize error types for better user feedback
      let userMessage;
      if (errorMessage.includes('validation')) {
        userMessage = `❌ **Validation Error**\n${errorMessage}\n\nPlease check your responses and try again.`;
      } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        userMessage = '❌ **Network Error**\nThe request timed out. Please try submitting again.';
      } else if (errorMessage.includes('database') || errorMessage.includes('connection')) {
        userMessage = '❌ **Database Error**\nTemporary database issue. Please try again in a few moments.';
      } else {
        userMessage = `❌ **Submission Error**\n${errorMessage}\n\nIf this persists, please contact support.`;
      }
      
      await safeReply(interaction, {
        content: userMessage,
        flags: 64
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO 5: SUCCESS PATHS
    // ═══════════════════════════════════════════════════════════════
    
    if (saveResult.is_completed) {
      // 🎉 ONBOARDING COMPLETE
      await safeReply(interaction, {
        content: '🎉 **Onboarding Complete!**\nProcessing your responses and setting up your access...',
        flags: 64
      });
      hasReplied = true;

      try {
        await onboardingManager.completeOnboarding({
          author: interaction.user,
          member: interaction.member,
          guild: interaction.guild,
          channel: interaction.channel,
          reply: async (options) => {
            try {
              await interaction.followUp({ ...options, flags: 64 });
            } catch (error) {
              console.error('Error sending completion message:', error);
              // Fallback to channel message
              if (interaction.channel) {
                await interaction.channel.send({
                  content: `${interaction.user} ${options.content || 'Onboarding completed!'}`,
                  embeds: options.embeds
                });
              }
            }
          },
          followUp: async (options) => {
            try {
              await interaction.followUp({ ...options, flags: 64 });
            } catch (error) {
              console.error('Error sending follow-up:', error);
            }
          }
        }, config, referralValidation);
        
        // Clear session after successful completion
        await onboardingManager.clearModalSession(config.campaignId, userId);
      } catch (completionError) {
        console.error('Error completing onboarding:', completionError);
        await interaction.followUp({
          content: '⚠️ **Completion Warning**\nYour responses were saved, but there was an issue finalizing your setup. An administrator will review this.',
          flags: 64
        });
      }
      
    } else if (saveResult.next_modal_fields && saveResult.next_modal_fields.length > 0) {
      // 📋 MORE FORMS TO SHOW
      const nextModalPart = modalPart + 1;
      const totalParts = Math.ceil((saveResult.progress?.total || 1) / 5); // Assuming 5 fields per modal
      
      try {
        const nextModal = createOnboardingModal(saveResult.next_modal_fields, nextModalPart, config);
        
        // Add progress indicator to modal title
        if (totalParts > 1) {
          nextModal.setTitle(`${config.campaignName} - Part ${nextModalPart}/${totalParts}`);
        }
        
        await interaction.showModal(nextModal);
        hasReplied = true;
        console.log(`✅ Showed modal part ${nextModalPart} for ${username} (${saveResult.progress?.completed || 0}/${saveResult.progress?.total || 0} completed)`);
        
      } catch (modalError) {
        console.error('Error showing next modal:', modalError);
        
        // Check if it's a Discord API limitation
        if (modalError.message?.includes('Unknown interaction') || modalError.code === 10062) {
          await safeReply(interaction, {
            content: '❌ **Form Display Error**\nThe next form could not be displayed due to timing. Please restart the onboarding process.',
            flags: 64
          });
        } else {
          await safeReply(interaction, {
            content: '❌ **Modal Error**\nFailed to show the next form. Please contact support if this continues.',
            flags: 64
          });
        }
      }
      
    } else {
      // 💾 PARTIAL SAVE SUCCESS
      const progress = saveResult.progress || { completed: modalPart, total: modalPart };
      await safeReply(interaction, {
        content: `✅ **Progress Saved!**\nResponses saved successfully (${progress.completed}/${progress.total} completed)\n\n⏳ Your onboarding will be processed shortly...`,
        flags: 64
      });
      hasReplied = true;
    }

  } catch (error) {
    console.error('Unexpected error in modal submission:', error);
    console.error('Error stack:', error.stack);
    
    // ═══════════════════════════════════════════════════════════════
    // SCENARIO 6: CATASTROPHIC ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════
    if (!hasReplied) {
      await safeReply(interaction, {
        content: '❌ **Unexpected Error**\nSomething went wrong while processing your submission.\n\n🔄 Please try again. If the issue persists, contact support.',
        flags: 64
      });
    }
  }
}

// Helper function to safely reply to interactions
async function safeReply(interaction, options) {
  if (interaction.replied || interaction.deferred) {
    console.log('Interaction already replied to, cannot send response');
    return false;
  }
  
  try {
    await interaction.reply(options);
    return true;
  } catch (error) {
    console.error('Failed to send reply:', error);
    return false;
  }
}

// Create onboarding modal from fields
function createOnboardingModal(fields, modalPart, config) {
  const modal = new ModalBuilder()
    .setCustomId(`onboarding_modal_${modalPart}`)
    .setTitle(`${config.campaignName} - Onboarding ${modalPart > 1 ? `(Part ${modalPart})` : ''}`);

  const components = [];

  // Discord modals support up to 5 text inputs
  const fieldsToShow = fields.slice(0, 5);
  
  fieldsToShow.forEach((field, index) => {
    let inputStyle = TextInputStyle.Short;
    let maxLength = 100;

    // Determine input style and length based on field type
    switch (field.field_type) {
      case 'text':
        if (field.field_description && field.field_description.length > 50) {
          inputStyle = TextInputStyle.Paragraph;
          maxLength = 1000;
        }
        break;
      case 'email':
        inputStyle = TextInputStyle.Short;
        maxLength = 100;
        break;
      case 'number':
        inputStyle = TextInputStyle.Short;
        maxLength = 20;
        break;
      case 'select':
        inputStyle = TextInputStyle.Short;
        maxLength = 100;
        break;
      case 'url':
        inputStyle = TextInputStyle.Short;
        maxLength = 200;
        break;
      default:
        inputStyle = TextInputStyle.Short;
        maxLength = 100;
    }

    // Truncate label if too long (Discord limit is 45 characters)
    let label = field.field_label;
    let labelTruncated = false;
    if (label.length > 45) {
      label = label.substring(0, 42) + '...';
      labelTruncated = true;
    }

    const textInput = new TextInputBuilder()
      .setCustomId(field.field_key)
      .setLabel(label)
      .setStyle(inputStyle)
      .setRequired(true)
      .setMaxLength(maxLength);

    // Set placeholder with full question if label was truncated
    let placeholder = field.field_placeholder;
    if (labelTruncated) {
      placeholder = field.field_label; // Show full question in placeholder
    }

    if (placeholder) {
      // Discord placeholder limit is 100 characters
      if (placeholder.length > 100) {
        placeholder = placeholder.substring(0, 97) + '...';
      }
      textInput.setPlaceholder(placeholder);
    }

    if (field.field_options && field.field_options.length > 0) {
      const optionsText = `Options: ${field.field_options.join(', ')}`;
      if (optionsText.length <= 100) {
        textInput.setPlaceholder(optionsText);
      } else {
        textInput.setPlaceholder(`Options: ${field.field_options.slice(0, 3).join(', ')}...`);
      }
    }

    // Add validation hints for specific field types
    if (field.field_type === 'email' && !placeholder) {
      textInput.setPlaceholder('Enter your email address');
    } else if (field.field_type === 'number' && !placeholder) {
      textInput.setPlaceholder('Enter a number');
    }

    const actionRow = new ActionRowBuilder().addComponents(textInput);
    components.push(actionRow);
  });

  modal.addComponents(...components);
  return modal;
}

// Save responses from modal submission with comprehensive error handling
async function saveOnboardingModalResponses(data) {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 API submission attempt ${attempt}/${maxRetries}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding/modal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // Handle different HTTP status codes
      if (response.status === 429) {
        // Rate limited
        const retryAfter = response.headers.get('Retry-After') || retryDelay / 1000;
        console.log(`⏳ Rate limited, retrying after ${retryAfter} seconds...`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        return { 
          success: false, 
          error: 'Service temporarily unavailable due to high traffic. Please try again later.' 
        };
      }

      if (response.status >= 500) {
        // Server error - retry
        console.log(`🔄 Server error (${response.status}), retrying...`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        return { 
          success: false, 
          error: 'Server is temporarily unavailable. Please try again later.' 
        };
      }

      if (!response.ok) {
        // Client error - don't retry
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError);
          return { 
            success: false, 
            error: `Request failed with status ${response.status}` 
          };
        }
        
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status} error`;
        console.error('API client error:', errorMessage);
        return { success: false, error: errorMessage };
      }

      // Success - parse response
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse success response:', jsonError);
        return { 
          success: false, 
          error: 'Server returned invalid response format' 
        };
      }

      // Validate response structure
      if (typeof result !== 'object' || result === null) {
        return { 
          success: false, 
          error: 'Server returned unexpected response format' 
        };
      }

      console.log(`✅ API submission successful on attempt ${attempt}`);
      return result;

    } catch (error) {
      console.error(`❌ API submission attempt ${attempt} failed:`, error.message);
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        if (attempt === maxRetries) {
          return { 
            success: false, 
            error: 'Request timeout - server took too long to respond' 
          };
        }
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        if (attempt === maxRetries) {
          return { 
            success: false, 
            error: 'Cannot connect to server - please check your connection' 
          };
        }
      } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        if (attempt === maxRetries) {
          return { 
            success: false, 
            error: 'Connection lost during submission - please try again' 
          };
        }
      } else {
        // Unknown error - don't retry
        return { 
          success: false, 
          error: `Network error: ${error.message}` 
        };
      }
      
      // Wait before retry
      if (attempt < maxRetries) {
        const delay = retryDelay * attempt;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return { 
    success: false, 
    error: 'Failed to submit after multiple attempts' 
  };
}

// Handle onboarding start button
async function handleOnboardingStartButton(interaction) {
  try {
    console.log(`🔘 Button clicked: ${interaction.customId} by ${interaction.user.tag}`);
    
    const [, , campaignId, userId] = interaction.customId.split('_');
    console.log(`📝 Extracted campaignId: ${campaignId}, userId: ${userId}`);
    
    // Verify this is the correct user
    if (interaction.user.id !== userId) {
      console.log(`❌ User mismatch: ${interaction.user.id} !== ${userId}`);
      await interaction.reply({
        content: '❌ This onboarding form is not for you.',
        flags: 64 // MessageFlags.Ephemeral
      });
      return;
    }

    // Get stored session data
    console.log(`🔍 Looking for stored session for campaignId: ${campaignId}, userId: ${userId}`);
    const sessionData = await onboardingManager.getStoredModalSession(campaignId, userId);
    if (!sessionData) {
      console.log(`❌ No session data found for campaignId: ${campaignId}, userId: ${userId}`);
      await interaction.reply({
        content: '❌ Onboarding session expired. Please try starting again.',
        flags: 64 // MessageFlags.Ephemeral
      });
      return;
    }

    console.log(`✅ Found session data with ${sessionData.fields?.length || 0} fields`);
    const { fields, config } = sessionData;
    
    if (!fields || fields.length === 0) {
      console.log(`❌ No fields found in session data`);
      await interaction.reply({
        content: '❌ No onboarding questions found. Please try starting again.',
        flags: 64 // MessageFlags.Ephemeral
      });
      return;
    }
    
    console.log(`🚀 Creating modal with ${fields.length} fields`);
    // Create and show the first modal
    const modal = createOnboardingModal(fields, 1, config);
    await interaction.showModal(modal);
    console.log(`✅ Modal shown successfully to ${interaction.user.tag}`);

  } catch (error) {
    console.error('Error handling onboarding start button:', error);
    console.error('Error stack:', error.stack);
    // Only try to reply if the interaction hasn't been responded to yet
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: '❌ An error occurred. Please try again.',
          flags: 64 // MessageFlags.Ephemeral
        });
      } catch (replyError) {
        console.error('Failed to send error reply:', replyError);
      }
    } else {
      console.log('Cannot send error reply - interaction already responded to');
    }
  }
}
