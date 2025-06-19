const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const OnboardingManager = require('./onboarding-manager');
require('dotenv').config();
const { supabase } = require('./supabase');

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000/api';
const DEBUG = process.env.DEBUG === 'true';

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

// Initialize onboarding manager
const onboardingManager = new OnboardingManager();

// Bot ready event
client.once('ready', () => {
  console.log('🤖 Virion Labs Discord Bot is ready!');
  console.log(`📡 Logged in as ${client.user.tag}`);
  console.log(`🔗 Dashboard API: ${DASHBOARD_API_URL}`);
  console.log(`🐛 Debug mode: ${DEBUG ? 'ON' : 'OFF'}`);
  console.log('✅ Bot is now listening for messages...\n');
  
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

    if (message.guild && (message.channel.name === 'join-campaigns' || message.content.toLowerCase().startsWith('!campaigns'))) {
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
    await interaction.deferReply({ ephemeral: true });
    const { data, error } = await supabase
      .from('discord_guild_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    if (error || !data) {
      await interaction.editReply('Campaign not found.');
      return;
    }
    const config = {
      campaignId: data.id,
      campaignName: data.campaign_name,
      campaignType: data.campaign_type,
      clientId: data.client_id,
      clientName: '',
      config: data,
      templateConfig: null
    };
    await onboardingManager.startOnboarding(interaction, config, {});
  }
});
