const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
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

// Extract referral code from message
function extractReferralCode(content) {
  // Look for common referral code patterns
  const patterns = [
    /(?:referral|ref|code)[\s:]*([a-zA-Z0-9\-_]+)/i,
    /\b([a-zA-Z0-9\-_]+-[a-zA-Z0-9\-_]+-[a-zA-Z0-9\-_]+)\b/,
    /(?:use|enter)[\s:]*([a-zA-Z0-9\-_]+)/i
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
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

// Handle referral onboarding flow
async function handleReferralOnboarding(message, config) {
  const referralCode = extractReferralCode(message.content);
  
  if (referralCode && config.campaign?.referral) {
    // Check if this matches the campaign's referral code
    if (referralCode === config.campaign.referral.code) {
      const embed = createCampaignEmbed(
        config,
        '🎉 Welcome to the Community!',
        `Thanks for joining through ${config.campaign.referral.influencer.name}'s referral link!\n\nYou're now part of our exclusive community. Here's what you can do next:\n\n• Explore our products and services\n• Connect with other community members\n• Get exclusive updates and offers`,
        '#00ff00'
      );

      await message.reply({ embeds: [embed] });
      
      // Track successful referral signup
      await trackInteraction(
        message.guild?.id,
        message.channel.id,
        message,
        'referral_signup',
        'Referral onboarding completed',
        referralCode
      );
      
      return true;
    }
  }
  
  // General onboarding message
  if (message.content.toLowerCase().includes('hello') || 
      message.content.toLowerCase().includes('hi') ||
      message.content.toLowerCase().includes('welcome')) {
    
    const embed = createCampaignEmbed(
      config,
      '👋 Welcome!',
      `Welcome to ${config.campaign.client.name}!\n\nIf you have a referral code, please share it with me to get started with exclusive benefits.`
    );

    await message.reply({ embeds: [embed] });
    
    await trackInteraction(
      message.guild?.id,
      message.channel.id,
      message,
      'message',
      'Welcome message sent'
    );
    
    return true;
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

// Guild member add event for automatic onboarding
client.on('guildMemberAdd', async (member) => {
  try {
    const config = await getGuildConfig(member.guild.id);
    
    if (config?.configured && config.campaign.type === 'referral_onboarding') {
      // Send welcome message with referral instructions
      const embed = createCampaignEmbed(
        config,
        '🎉 Welcome to the Server!',
        `Welcome to ${config.campaign.client.name}, ${member.user.username}!\n\nIf you joined through a referral link, please share your referral code in any channel to unlock exclusive benefits!`
      );

      // Try to send DM first, fallback to system channel
      try {
        await member.send({ embeds: [embed] });
      } catch (dmError) {
        const systemChannel = member.guild.systemChannel;
        if (systemChannel) {
          await systemChannel.send({ content: `${member.user}`, embeds: [embed] });
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
        'join',
        'Welcome message sent'
      );
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