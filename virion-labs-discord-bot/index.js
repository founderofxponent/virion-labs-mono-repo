const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.xponent.ph/webhook/7a630bf4-234c-44fc-bd69-f1db2f6062ac';
const DEBUG = process.env.DEBUG === 'true';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// Bot ready event
client.once('ready', () => {
  console.log('🤖 Virion Labs Discord Bot is ready!');
  console.log(`📡 Logged in as ${client.user.tag}`);
  console.log(`🔗 Forwarding messages to: ${N8N_WEBHOOK_URL}`);
  console.log(`🐛 Debug mode: ${DEBUG ? 'ON' : 'OFF'}`);
  console.log('✅ Bot is now listening for messages...\n');
  
  // Test webhook on startup
  testWebhookConnection();
});

// Test webhook connection
async function testWebhookConnection() {
  console.log('🧪 Testing webhook connection...');
  
  const testData = {
    messageId: "startup-test",
    content: "Bot startup test",
    timestamp: new Date().toISOString(),
    test: true
  };

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/1.0'
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      console.log('✅ Webhook connection successful!');
    } else {
      console.log(`⚠️ Webhook connection failed: ${response.status} ${response.statusText}`);
      console.log('❓ Please check:');
      console.log('   1. n8n workflow is active');
      console.log('   2. Webhook URL is correct');
      console.log('   3. n8n instance is accessible\n');
    }
  } catch (error) {
    console.log('❌ Webhook connection error:', error.message);
    console.log('❓ Bot will continue running but webhook calls may fail\n');
  }
}

// Message handler
client.on('messageCreate', async (message) => {
  // Skip bot messages to prevent loops
  if (message.author.bot) return;
  
  // Skip empty messages
  if (!message.content.trim()) return;

  // Skip test messages (optional)
  if (message.content.toLowerCase().startsWith('!test') && DEBUG) {
    await message.reply('🤖 Virion Labs Bot is working! Send any other message to test the AI integration.');
    return;
  }

  try {
    if (DEBUG) {
      console.log(`📨 Message from ${message.author.tag} in ${message.guild?.name || 'DM'}: ${message.content}`);
    }
    
    // Prepare comprehensive data for n8n webhook
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

    // Send to n8n webhook
    if (DEBUG) {
      console.log('🔄 Forwarding to n8n webhook...');
    }
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/1.0'
      },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      // Handle different error codes
      let errorMessage = '';
      switch (response.status) {
        case 404:
          errorMessage = '🔍 n8n workflow not found. Please check if the workflow is active and the webhook URL is correct.';
          break;
        case 500:
          errorMessage = '⚙️ n8n internal error. Please check the workflow for errors.';
          break;
        case 403:
          errorMessage = '🔐 Access denied. Please check n8n webhook permissions.';
          break;
        default:
          errorMessage = `❌ Webhook error: ${response.status} ${response.statusText}`;
      }
      
      console.error(errorMessage);
      await message.reply('🚨 Sorry, the AI service is currently unavailable. Please try again later.');
      return;
    }

    // Parse n8n response
    let aiResponse;
    try {
      aiResponse = await response.json();
    } catch (parseError) {
      // If response isn't JSON, treat as plain text
      aiResponse = { response: await response.text() };
    }

    if (DEBUG) {
      console.log('✅ Received response from n8n');
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
      
      if (DEBUG) {
        console.log(`💬 AI response sent: ${replyContent.substring(0, 100)}${replyContent.length > 100 ? '...' : ''}\n`);
      }
    } else {
      console.log('⚠️ No response content received from n8n');
      await message.reply('🤖 *AI service returned an empty response*');
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