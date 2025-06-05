const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const OnboardingManager = require('./onboarding-manager');
require('dotenv').config();

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000/api';
const DEFAULT_N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.xponent.ph/webhook/7a630bf4-234c-44fc-bd69-f1db2f6062ac';
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
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Initialize onboarding manager
const onboardingManager = new OnboardingManager();

// Bot ready event
client.once('ready', () => {
  console.log('🤖 Enhanced Virion Labs Discord Bot is ready!');
  console.log(`📡 Logged in as ${client.user.tag}`);
  console.log(`🔗 Dashboard API: ${DASHBOARD_API_URL}`);
  console.log(`🔗 Default webhook: ${DEFAULT_N8N_WEBHOOK_URL}`);
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
      console.log('❓ Bot will fall back to default webhook behavior\n');
    }
  } catch (error) {
    console.log('❌ Dashboard connection error:', error.message);
    console.log('❓ Bot will fall back to default webhook behavior\n');
  }
}

// Get guild configuration from dashboard
async function getGuildConfig(guildId, channelId = null) {
  const cacheKey = `${guildId}:${channelId || 'default'}`;
  const cached = configCache.get(cacheKey);
  
  // Return cached config if still valid
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.config;
  }

  try {
    const url = new URL(`${DASHBOARD_API_URL}/discord-bot/config`);
    url.searchParams.set('guild_id', guildId);
    if (channelId) url.searchParams.set('channel_id', channelId);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      }
    });

    if (response.ok) {
      const config = await response.json();
      
      // Cache the configuration
      configCache.set(cacheKey, {
        config,
        timestamp: Date.now()
      });
      
      return config;
    } else {
      console.error(`Failed to fetch guild config: ${response.status} ${response.statusText}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching guild config:', error);
    return null;
  }
}

// Track interaction with dashboard
async function trackInteraction(guildId, channelId, message, interactionType, botResponse = null, referralCode = null) {
  try {
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
      console.error(`Failed to track interaction: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error tracking interaction:', error);
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
              const config = await getGuildConfig(member.guild.id);
              if (config?.configured) {
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
                
                // Process the referral automatically
                console.log(`🤖 Processing auto-referral for ${member.user.tag} with code ${context.referral_code}`);
                await handleReferralOnboarding(syntheticMessage, config);
                
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
                
                // Also notify about successful auto-processing
                const welcomeEmbed = createCampaignEmbed(
                  config,
                  '🎉 Welcome via Referral!',
                  `Great news! We automatically detected that you joined through **${context.influencer.name}'s** referral link for the **${context.campaign.name}** campaign.\n\n✨ Your referral benefits have been automatically applied!`,
                  config.campaign?.brand_color || '#00ff00'
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
    const config = await getGuildConfig(member.guild.id);
    
    if (!config || !config.configured) {
      return; // No campaign configured for this guild
    }
    
    // Wait a bit to let Discord settle the member join
    setTimeout(async () => {
      try {
        // Send welcome DM with onboarding start option
        const welcomeEmbed = new EmbedBuilder()
          .setTitle(`🎉 Welcome to ${member.guild.name}!`)
          .setDescription(`Hi ${member.user.username}! Welcome to **${config.campaign.client.name}**.\n\nI'm here to help you get started. Would you like to complete a quick onboarding to unlock all community features?\n\n💡 You can also share a referral code if you have one!`)
          .setColor(config.campaign.bot_config?.brand_color || '#6366f1')
          .addFields([
            {
              name: '🚀 Get Started',
              value: 'Reply with "start" to begin onboarding\nOr share your referral code if you have one',
              inline: false
            }
          ])
          .setTimestamp();

        await member.send({ embeds: [welcomeEmbed] });
        console.log(`📨 Sent welcome DM to ${member.user.tag}`);
        
      } catch (error) {
        if (error.code === 50007) {
          console.log(`❌ Cannot send DM to ${member.user.tag} (DMs disabled)`);
        } else {
          console.error('Error sending welcome DM:', error);
        }
      }
    }, 2000); // 2 second delay
    
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
  } else if (config.campaign?.bot_config?.brand_color) {
    embed.setColor(config.campaign.bot_config.brand_color);
  }

  if (config.campaign?.client?.name) {
    embed.setFooter({ text: `${config.campaign.client.name} • Powered by Virion Labs` });
  }

  return embed;
}

// Handle referral onboarding flow with enhanced campaign integration
async function handleReferralOnboarding(message, config) {
  const userId = message.author.id;
  const campaignId = config.campaign.id;
  
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
    if (DEBUG) {
      console.log(`📨 Message from ${message.author.tag} in ${message.guild?.name || 'DM'}: ${message.content}`);
    }

    // Get guild configuration
    const config = await getGuildConfig(guildId, channelId);
    
    if (config && config.configured) {
      if (DEBUG) {
        console.log(`🎯 Found campaign configuration: ${config.campaign.name} (${config.campaign.type})`);
      }

      // Handle campaign-specific logic
      let handled = false;
      
      switch (config.campaign.type) {
        case 'referral_onboarding':
          handled = await handleReferralOnboarding(message, config);
          break;
        
        case 'community_engagement':
          // Handle community engagement logic
          if (message.content.toLowerCase().includes('help') || 
              message.content.toLowerCase().includes('support')) {
            const embed = createCampaignEmbed(
              config,
              '🆘 Need Help?',
              'I\'m here to help! What can I assist you with today?'
            );
            await message.reply({ embeds: [embed] });
            handled = true;
          }
          break;
      }

      // If campaign-specific logic handled the message, track and return
      if (handled) {
        return;
      }
    }

    // Prepare comprehensive data for webhook
    const webhookData = {
      messageId: message.id,
      channelId: message.channel.id,
      guildId: message.guild?.id || null,
      guildName: message.guild?.name || 'Direct Message',
      channelName: message.channel.name || 'DM',
      authorId: message.author.id,
      authorTag: message.author.tag,
      authorDisplayName: message.author.displayName || message.author.username,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
      
      // Campaign context
      campaign: config?.configured ? {
        id: config.campaign.id,
        name: config.campaign.name,
        type: config.campaign.type,
        client: config.campaign.client,
        referral: config.campaign.referral
      } : null,
      
      // Extracted referral code
      referralCode: extractReferralCode(message.content),
      
      attachments: message.attachments.map(att => ({
        id: att.id,
        name: att.name,
        url: att.url,
        size: att.size,
        contentType: att.contentType
      })),
      embeds: message.embeds.map(embed => ({
        title: embed.title,
        description: embed.description,
        url: embed.url,
        color: embed.color
      })),
      mentions: {
        users: message.mentions.users.map(user => ({
          id: user.id,
          tag: user.tag,
          username: user.username
        })),
        roles: message.mentions.roles.map(role => ({
          id: role.id,
          name: role.name
        })),
        channels: message.mentions.channels.map(channel => ({
          id: channel.id,
          name: channel.name,
          type: channel.type
        }))
      },
      referencedMessage: message.reference ? {
        messageId: message.reference.messageId,
        channelId: message.reference.channelId,
        guildId: message.reference.guildId
      } : null
    };

    // Determine webhook URL
    const webhookUrl = (config?.configured && config.campaign.webhook_url) 
      ? config.campaign.webhook_url 
      : DEFAULT_N8N_WEBHOOK_URL;

    // Send to webhook
    if (DEBUG) {
      console.log(`🔄 Forwarding to webhook: ${webhookUrl}`);
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      // Handle different error codes
      let errorMessage = '';
      switch (response.status) {
        case 404:
          errorMessage = '🔍 Webhook not found. Please check if the workflow is active and the webhook URL is correct.';
          break;
        case 500:
          errorMessage = '⚙️ Webhook internal error. Please check the workflow for errors.';
          break;
        case 403:
          errorMessage = '🔐 Access denied. Please check webhook permissions.';
          break;
        default:
          errorMessage = `❌ Webhook error: ${response.status} ${response.statusText}`;
      }
      
      console.error(errorMessage);
      
      // Send campaign-specific error message if configured
      if (config?.configured) {
        const embed = createCampaignEmbed(
          config,
          '⚠️ Service Temporarily Unavailable',
          'Sorry, our AI service is currently unavailable. Please try again later.',
          '#ff9900'
        );
        await message.reply({ embeds: [embed] });
      } else {
        await message.reply('🚨 Sorry, the AI service is currently unavailable. Please try again later.');
      }
      return;
    }

    // Parse webhook response
    let aiResponse;
    try {
      aiResponse = await response.json();
    } catch (parseError) {
      // If response isn't JSON, treat as plain text
      aiResponse = { response: await response.text() };
    }

    if (DEBUG) {
      console.log('✅ Received response from webhook');
    }

    // Send AI response back to Discord
    if (aiResponse) {
      let replyContent = '';
      
      // Handle different response formats
      if (typeof aiResponse === 'string') {
        replyContent = aiResponse;
      } else if (aiResponse.response) {
        replyContent = aiResponse.response;
      } else if (aiResponse.message) {
        replyContent = aiResponse.message;
      } else if (aiResponse.content) {
        replyContent = aiResponse.content;
      } else if (aiResponse.text) {
        replyContent = aiResponse.text;
      } else if (aiResponse.reply) {
        replyContent = aiResponse.reply;
      } else {
        replyContent = JSON.stringify(aiResponse);
      }

      // Ensure response isn't empty
      if (!replyContent.trim()) {
        replyContent = '🤖 *AI response was empty*';
      }

      // Limit response length (Discord has a 2000 character limit)
      if (replyContent.length > 1900) {
        replyContent = replyContent.substring(0, 1900) + '\n\n*[Response truncated]*';
      }

      // Send the AI response
      await message.reply(replyContent);
      
      // Track the interaction
      await trackInteraction(
        guildId,
        channelId,
        message,
        'message',
        replyContent,
        extractReferralCode(message.content)
      );
      
      if (DEBUG) {
        console.log(`💬 AI response sent: ${replyContent.substring(0, 100)}${replyContent.length > 100 ? '...' : ''}\n`);
      }
    } else {
      console.log('⚠️ No response content received from webhook');
      
      if (config?.configured) {
        const embed = createCampaignEmbed(
          config,
          '🤖 No Response',
          'AI service returned an empty response',
          '#ff9900'
        );
        await message.reply({ embeds: [embed] });
      } else {
        await message.reply('🤖 *AI service returned an empty response*');
      }
    }

  } catch (error) {
    console.error('❌ Error processing message:', error);
    
    // Provide more specific error messages
    let userMessage = '🚨 Sorry, there was an error processing your message.';
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      userMessage = '🌐 Connection error: Unable to reach the AI service. Please try again later.';
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      userMessage = '🔗 Network error: Please check your internet connection and try again.';
    }
    
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
    const config = await getGuildConfig(member.guild.id);
    
    if (config?.configured) {
      console.log(`👤 New member ${member.user.tag} joined ${member.guild.name} with campaign: ${config.campaign.name}`);
      
      // Check for automatic referral context from invite links
      const autoReferralProcessed = await handleReferralInviteContext(member);
      if (autoReferralProcessed) {
        console.log(`✅ Auto-processed referral for ${member.user.tag}`);
        return; // Skip general welcome if referral was processed
      }
      
      // Trigger new member onboarding process
      await handleNewMemberOnboarding(member);
      
      let welcomeTitle = '🎉 Welcome to the Server!';
      let welcomeMessage = `Welcome to ${config.campaign.client.name}, ${member.user.username}!`;
      
      // Customize message based on campaign type
      switch (config.campaign.type) {
        case 'referral_onboarding':
          welcomeMessage += `\n\n🎯 **Referral Campaign**: ${config.campaign.name}`;
          welcomeMessage += `\n\n💎 **Got a referral code?** Share it in any channel to unlock exclusive benefits and connect with your referrer!`;
          welcomeMessage += `\n\n🏷️ **How to use:** Simply type your referral code in any channel, and I'll help you get started with special perks.`;
          break;
          
        case 'community_engagement':
          welcomeMessage += `\n\n🌟 **Community Campaign**: ${config.campaign.name}`;
          welcomeMessage += `\n\n💬 **Let's connect!** This server is all about building an amazing community together.`;
          welcomeMessage += `\n\n🤝 **Get started:** Say hello in the chat, and I'll help you navigate your journey here!`;
          break;
          
        case 'gaming_community':
          welcomeMessage += `\n\n🎮 **Gaming Campaign**: ${config.campaign.name}`;
          welcomeMessage += `\n\n🕹️ **Ready to game?** Share your favorite games and connect with fellow gamers!`;
          welcomeMessage += `\n\n🏆 **Tip:** Use any referral codes to unlock gaming perks and exclusive content!`;
          break;
          
        default:
          welcomeMessage += `\n\n✨ **Campaign**: ${config.campaign.name}`;
          welcomeMessage += `\n\n📢 I'm here to help you get the most out of this community!`;
      }
      
      // Add campaign-specific instructions
      if (config.campaign.description) {
        welcomeMessage += `\n\n📝 **About this campaign:**\n${config.campaign.description}`;
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
      
      console.log(`✅ Processed guild join for ${member.user.tag} in campaign ${config.campaign.name}`);
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

console.log('🚀 Starting Enhanced Virion Labs Discord Bot...');
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