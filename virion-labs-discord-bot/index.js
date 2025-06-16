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
    
    // First check if there are any campaigns for this guild
    const { data: guildCheck, error: guildError } = await supabase
      .from('discord_guild_campaigns')
      .select('*')
      .eq('guild_id', guildId)
      .eq('is_active', true);
    
    if (guildError) {
      console.error('❌ Error checking guild campaigns:', guildError);
    } else {
      console.log(`📊 Found ${guildCheck?.length || 0} active campaigns for guild ${guildId}`);
      if (guildCheck && guildCheck.length > 0) {
        console.log('📋 Guild campaigns:', guildCheck.map(c => ({ id: c.id, name: c.campaign_name, type: c.campaign_type })));
      }
    }
    
    // Use the new enriched database function that includes template data
    console.log('🔧 Calling get_enriched_bot_config_for_guild with params:', { p_guild_id: guildId, p_channel_id: channelId });
    let { data, error } = await supabase
      .rpc('get_enriched_bot_config_for_guild', {
        p_guild_id: guildId,
        p_channel_id: channelId
      });
    
    console.log('📊 RPC result - data:', data, 'error:', error);

    if (error) {
      console.error('❌ Error fetching bot config from RPC:', error);
      
      // Fallback: try using the dashboard API
      console.log('🔄 Falling back to dashboard API...');
      try {
        const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/config?guild_id=${guildId}${channelId ? `&channel_id=${channelId}` : ''}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Virion-Discord-Bot/2.0'
          }
        });

        if (response.ok) {
          const apiData = await response.json();
          console.log('✅ Successfully fetched config from dashboard API');
          
          if (apiData.configured && apiData.campaign) {
            const campaign = apiData.campaign;
            return {
              campaignId: campaign.id,
              campaignName: campaign.name,
              campaignType: campaign.type,
              clientId: campaign.client?.id,
              clientName: campaign.client?.name,
              config: campaign.bot_config || {},
              templateConfig: campaign.template_config || null
            };
          }
        } else {
          console.error('❌ Dashboard API also failed:', response.status);
        }
      } catch (apiError) {
        console.error('❌ Dashboard API error:', apiError);
      }
      
      return null;
    }

    // Handle case where no rows are returned
    if (!data || data.length === 0) {
      console.log('⚠️ RPC returned no data, trying direct campaign query...');
      
      // Fallback: use the dashboard API which we know works
      console.log('🔄 Using dashboard API fallback...');
      try {
        const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/config?guild_id=${guildId}${channelId ? `&channel_id=${channelId}` : ''}`, {
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
              templateConfig: campaign.template_config || null
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
       
       console.log('❌ All fallback methods failed');
       return null;
      }

    // Get the first result if multiple are returned
    const configData = Array.isArray(data) ? data[0] : data;
    
    if (!configData || !configData.configured) {
      console.log('⚠️ No active bot configuration found for guild:', guildId);
      return null;
    }

    console.log('✅ Bot configuration loaded:', {
      campaign_name: configData.campaign_name,
      campaign_type: configData.campaign_type,
      client_name: configData.client_name,
      bot_name: configData.bot_config?.bot_name,
      template: configData.bot_config?.template,
      auto_responses_count: Object.keys(configData.bot_config?.auto_responses || {}).length,
      custom_commands_count: (configData.bot_config?.custom_commands || []).length
    });

    return {
      campaignId: configData.campaign_id,
      campaignName: configData.campaign_name,
      campaignType: configData.campaign_type,
      clientId: configData.client_id,
      clientName: configData.client_name,
      config: configData.bot_config,
      templateConfig: configData.template_config
    };
    
  } catch (error) {
    console.error('❌ Unexpected error fetching bot config:', error);
    return null;
  }
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
    .select('id, campaign_name')
    .eq('guild_id', guildId)
    .eq('is_active', true);
  if (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
  return data || [];
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

// Check if onboarding is complete based on campaign template requirements
async function checkOnboardingCompletion(userId, campaignId, config) {
  try {
    const completionRequirements = config.config.onboarding_completion_requirements || {};
    
    if (!completionRequirements.required_fields || completionRequirements.required_fields.length === 0) {
      // No specific requirements, consider complete if any responses exist
      return { isComplete: true, message: 'Onboarding completed!' };
    }

    // Check completion via dashboard API
    const response = await fetch(`${DASHBOARD_API_URL}/campaign-onboarding-responses/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        discord_user_id: userId
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        isComplete: result.completed,
        message: result.completed 
          ? (result.completion_message || 'Congratulations! Your onboarding is complete.')
          : `Please complete the remaining fields: ${result.missing_fields?.join(', ') || 'unknown'}`,
        autoRole: result.auto_role_on_completion,
        completionPercentage: result.completion_percentage || 0
      };
    }

    return { isComplete: false, message: 'Unable to check completion status.' };
  } catch (error) {
    console.error('Error checking onboarding completion:', error);
    return { isComplete: false, message: 'Error checking completion status.' };
  }
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
      const campaigns = await fetchActiveCampaigns(guildId);
      if (!campaigns.length) {
        await message.reply('No active campaigns available.');
        return;
      }
      const row = new ActionRowBuilder();
      campaigns.slice(0,5).forEach(c => {
        row.addComponents(new ButtonBuilder()
          .setCustomId(`join_${c.id}`)
          .setLabel(c.campaign_name)
          .setStyle(ButtonStyle.Primary));
      });
      await message.reply({ content: 'Select a campaign to join:', components: [row] });
      return;
    }

    // Handle DM messages (for onboarding responses to welcome messages)
    if (!message.guild) {
      const content = message.content.toLowerCase().trim();
      
      // Check for onboarding start keywords in DMs
      if (content.includes('start') || content.includes('begin') || 
          content.includes('onboard') || content.includes('hello') ||
          content.includes('hi') || content.includes('yes')) {
        
        // Find the user's most recent guild to determine campaign context
        // This works because the welcome DM was sent after they joined a guild
        const userGuilds = client.guilds.cache.filter(guild => 
          guild.members.cache.has(message.author.id)
        );
        
        for (const [guildId, guild] of userGuilds) {
          const config = await getBotConfig(guildId);
          if (config) {
            console.log(`🚀 Starting DM onboarding for ${message.author.tag} in ${config.campaignType} campaign`);
            
            // Check if user already has an active onboarding session
            if (onboardingManager.isInOnboardingSession(message.author.id, config.campaignId)) {
              // Handle response to onboarding question in DM
              await onboardingManager.handleResponse(message, config);
            } else {
              // Start onboarding process in DM
              await onboardingManager.startOnboarding(message, config, {});
            }
            return; // Handle only first valid campaign found
          }
        }
        
        // If no campaign found, send helpful message
        await message.reply("👋 Hi! I couldn't find an active campaign for you. Please make sure you're a member of a server with an active Virion Labs campaign and try again from that server.");
        return;
      }
      
      // Handle other DM content (like onboarding responses)
      const userGuilds = client.guilds.cache.filter(guild => 
        guild.members.cache.has(message.author.id)
      );
      
      let dmHandled = false;
      for (const [guildId, guild] of userGuilds) {
        const config = await getBotConfig(guildId);
        if (config) {
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

    // Get guild configuration
    const config = await getBotConfig(guildId, channelId);
    
    if (config) {
      console.log(`🎯 Found campaign configuration: ${config.campaignName} (${config.campaignType}) - Campaign ID: ${config.campaignId}`);

      // Handle campaign-specific logic with template-driven responses
      let handled = false;
      
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
            const completionStatus = await checkOnboardingCompletion(
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
      
      // If no template response found, use campaign-specific logic
      if (!handled) {
        console.log(`🔍 No template response found, checking onboarding logic for "${message.content}"`);
        
        // First check if user is in an active onboarding session for ANY message
        if (onboardingManager.isInOnboardingSession(message.author.id, config.campaignId)) {
          console.log(`🔄 Handling onboarding response for ${message.author.tag} in active session`);
          // Handle response to onboarding question
          handled = await onboardingManager.handleResponse(message, config);
        } else {
          console.log(`💭 No active session found, checking for trigger patterns...`);
          
          // Check for onboarding trigger patterns first
          const content = message.content.toLowerCase();
          console.log(`🔎 Checking content: "${content}" for trigger patterns`);
          
          if (content.includes('hello') || content.includes('hi') || 
              content.includes('help') || content.includes('start') ||
              content.includes('info') || content.includes('welcome') ||
              content.includes('onboard') || content.includes('begin') ||
              content.includes('signup') || content.includes('join')) {
            
            console.log(`✅ Trigger pattern detected! Processing onboarding for campaign type: ${config.campaignType}`);
            
            // Check if user wants to restart or if there's an existing incomplete session
            const shouldRestart = content.includes('restart') || content.includes('reset') || content.includes('new');
            console.log(`🔄 Should restart: ${shouldRestart}`);
            
            if (!shouldRestart) {
              console.log(`📋 Checking database for existing session...`);
              const existingSession = await onboardingManager.checkDatabaseSession(config.campaignId, message.author.id, message.author.tag);
              if (existingSession && !existingSession.is_completed && existingSession.next_field) {
                console.log(`🔄 Restoring onboarding session for ${message.author.tag} in ${config.campaignType} campaign`);
                await onboardingManager.resumeOnboarding(message, config, existingSession);
                handled = true;
              } else {
                console.log(`📋 No existing incomplete session found`);
              }
            }
            
            if (!handled) {
              console.log(`🚀 Starting new onboarding flow...`);
              
              switch (config.campaignType) {
                case 'referral_onboarding':
                  console.log(`🎯 Handling referral onboarding`);
                  handled = await handleReferralOnboarding(message, config);
                  break;
                
                case 'product_promotion':
                case 'community_engagement':
                case 'vip_support':
                case 'support':
                case 'gaming_community':
                case 'custom':
                default:
                  console.log(`🚀 Starting onboarding for ${message.author.tag} in ${config.campaignType} campaign`);
                  handled = await onboardingManager.startOnboarding(message, config, {});
                  break;
              }
              
              console.log(`✅ Onboarding handling result: ${handled}`);
            }
          } else {
            console.log(`❌ No trigger patterns found in content: "${content}"`);
          }
        }
      } else {
        console.log(`✅ Message already handled by template response`);
      }

      // If campaign-specific logic handled the message, track and return
      if (handled) {
        console.log(`✅ Message handled by campaign logic, returning`);
        return;
      } else {
        console.log(`❌ Message not handled by campaign logic, continuing to basic processing`);
      }
    }

    // Basic message acknowledgment (AI service removed)
    if (DEBUG) {
      console.log(`📝 Processing message from ${message.author.tag}: ${message.content}`);
    }

    // Track the interaction without AI response
    await trackInteraction(
      guildId,
      channelId,
      message,
      'message',
      null, // No bot response since AI service is removed
      extractReferralCode(message.content)
    );

    // Only respond to direct mentions or specific commands
    if (message.mentions.has(client.user) || message.content.toLowerCase().startsWith('!help')) {
      const responseMessage = config
        ? 'Hello! I\'m here to help with server management and campaigns. The AI service has been disabled.'
        : 'Hello! I\'m a Discord bot for server management. The AI service has been disabled.';
      
      if (config) {
        const embed = createCampaignEmbed(
          config,
          '👋 Hello!',
          responseMessage,
          '#00ff00'
        );
        await message.reply({ embeds: [embed] });
      } else {
        await message.reply(responseMessage);
      }
      
      if (DEBUG) {
        console.log('💬 Basic response sent\n');
      }
    }

  } catch (error) {
    console.error('❌ Error processing message:', error);
    
    // Provide basic error message
    const userMessage = '🚨 Sorry, there was an error processing your message. Please try again later.';
    
    // Send error message to Discord
    try {
      await message.reply(userMessage);
    } catch (replyError) {
      console.error('❌ Failed to send error message to Discord:', replyError);
    }
  }
});

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
