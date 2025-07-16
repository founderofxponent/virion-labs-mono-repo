const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Import core components
const { BotClient } = require('./core/BotClient');
const { WebhookServer } = require('./core/WebhookServer');
const { Logger } = require('./utils/Logger');

// Cloud Run Configuration
// Cloud Run automatically sets the PORT environment variable
const cloudRunPort = process.env.PORT || 8080;
const isCloudRun = process.env.K_SERVICE !== undefined;

// Configuration optimized for Google Cloud Run
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
    // Use Cloud Run's PORT environment variable
    port: cloudRunPort
  },
  discord_server: {
    defaultGuildId: process.env.DISCORD_GUILD_ID,
    defaultChannelId: process.env.DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID,
    requestAccessChannelId: process.env.DISCORD_REQUEST_ACCESS_CHANNEL_ID,
    verifiedRoleId: process.env.DISCORD_VERIFIED_ROLE_ID
  },
  debug: process.env.DEBUG === 'true',
  cloudRun: {
    enabled: isCloudRun,
    port: cloudRunPort,
    service: process.env.K_SERVICE,
    revision: process.env.K_REVISION,
    configuration: process.env.K_CONFIGURATION
  }
};

// Initialize logger with Cloud Run context
const logger = new Logger(config.debug);

async function main() {
  try {
    if (isCloudRun) {
      logger.info('🌐 Starting Virion Labs Discord Bot on Google Cloud Run...');
      logger.info(`📦 Service: ${config.cloudRun.service}`);
      logger.info(`🔄 Revision: ${config.cloudRun.revision}`);
      logger.info(`📡 Port: ${cloudRunPort}`);
    } else {
      logger.info('🚀 Starting Virion Labs Discord Bot (Development Mode)...');
    }
    
    // Validate required environment variables
    if (!config.discord.token) {
      throw new Error('DISCORD_BOT_TOKEN is required');
    }
    
    // Initialize bot client
    const botClient = new BotClient(config, logger);
    
    // Initialize webhook server with Cloud Run port
    const webhookServer = new WebhookServer(config, logger, botClient);
    
    // Start the webhook server first (required for Cloud Run health checks)
    await webhookServer.start();
    
    // Then start the bot (if this fails, webhook server will still be available)
    try {
      await botClient.start();
    } catch (error) {
      logger.error('❌ Failed to start Discord bot, but webhook server is still running:', error);
    }
    
    if (isCloudRun) {
      logger.success('✅ Discord Bot deployed successfully on Google Cloud Run');
      logger.info(`🌍 HTTP Server listening on port ${cloudRunPort}`);
    } else {
      logger.success('✅ Bot and webhook server started successfully');
    }
    
    // Enhanced graceful shutdown handling for Cloud Run
    process.on('SIGINT', async () => {
      logger.info('🛑 Received SIGINT, shutting down gracefully...');
      await gracefulShutdown(botClient, webhookServer);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('🛑 Received SIGTERM (Cloud Run shutdown), shutting down gracefully...');
      await gracefulShutdown(botClient, webhookServer);
    });
    
    // Cloud Run specific: Handle container lifecycle
    if (isCloudRun) {
      // Handle Cloud Run container shutdown signals
      process.on('SIGQUIT', async () => {
        logger.info('🛑 Received SIGQUIT (Cloud Run force shutdown), shutting down...');
        await gracefulShutdown(botClient, webhookServer);
      });
      
      // Log Cloud Run environment information
      logger.info('☁️ Cloud Run Environment Variables:');
      logger.info(`  - K_SERVICE: ${process.env.K_SERVICE || 'Not set'}`);
      logger.info(`  - K_REVISION: ${process.env.K_REVISION || 'Not set'}`);
      logger.info(`  - K_CONFIGURATION: ${process.env.K_CONFIGURATION || 'Not set'}`);
      logger.info(`  - PORT: ${process.env.PORT || 'Not set'}`);
    }
    
  } catch (error) {
    logger.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler optimized for Cloud Run
 * @param {BotClient} botClient - The Discord bot client
 * @param {WebhookServer} webhookServer - The Express webhook server
 */
async function gracefulShutdown(botClient, webhookServer) {
  try {
    logger.info('🔄 Starting graceful shutdown process...');
    
    // Set a timeout for graceful shutdown (Cloud Run gives us ~10 seconds)
    const shutdownTimeout = setTimeout(() => {
      logger.warn('⚠️ Graceful shutdown timeout reached, forcing exit...');
      process.exit(1);
    }, 8000); // 8 seconds to allow for cleanup before Cloud Run kills the container
    
    // Shutdown in order: webhook server first, then bot client
    if (webhookServer) {
      logger.info('🌐 Shutting down webhook server...');
      await webhookServer.shutdown();
    }
    
    if (botClient) {
      logger.info('🤖 Shutting down Discord bot client...');
      await botClient.shutdown();
    }
    
    // Clear the timeout since we completed gracefully
    clearTimeout(shutdownTimeout);
    
    logger.success('✅ Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Start the application
main(); 