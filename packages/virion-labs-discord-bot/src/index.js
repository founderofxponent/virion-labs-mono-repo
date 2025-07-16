const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Import core components
const { BotClient } = require('./core/BotClient');
const { WebhookServer } = require('./core/WebhookServer');
const { Logger } = require('./utils/Logger');

// Configuration
const config = {
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildMembers
    ]
  },
  api: {
    dashboardUrl: process.env.DASHBOARD_API_URL || 'http://localhost:3000/api',
    port: process.env.PORT || process.env.WEBHOOK_PORT || 3001
  },
  discord_server: {
    defaultGuildId: process.env.DISCORD_GUILD_ID,
    defaultChannelId: process.env.DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID,
    requestAccessChannelId: process.env.DISCORD_REQUEST_ACCESS_CHANNEL_ID,
    verifiedRoleId: process.env.DISCORD_VERIFIED_ROLE_ID
  },
  debug: process.env.DEBUG === 'true'
};

// Initialize logger
const logger = new Logger(config.debug);

async function main() {
  try {
    logger.info('🚀 Starting Virion Labs Discord Bot...');
    
    // Validate required environment variables
    if (!config.discord.token) {
      throw new Error('DISCORD_BOT_TOKEN is required');
    }
    
    // Initialize bot client
    const botClient = new BotClient(config, logger);
    
    // Initialize webhook server, passing the bot client
    const webhookServer = new WebhookServer(config, logger, botClient);
    
    // Start the bot
    await botClient.start();
    
    // Start the webhook server
    await webhookServer.start();
    
    logger.info('✅ Bot and webhook server started successfully');
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      logger.info('🛑 Received SIGINT, shutting down gracefully...');
      await botClient.shutdown();
      await webhookServer.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('🛑 Received SIGTERM, shutting down gracefully...');
      await botClient.shutdown();
      await webhookServer.shutdown();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main(); 