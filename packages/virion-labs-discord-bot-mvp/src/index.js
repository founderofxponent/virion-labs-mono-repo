require('dotenv').config();
const config = require('./config');
const { BotClient } = require('./core/BotClient');
const { Logger } = require('./utils/Logger');

const logger = new Logger(config.debug);

async function main() {
  try {
    logger.info('🚀 Starting Virion Labs Discord Bot MVP...');

    if (!config.discord.token) {
      throw new Error('DISCORD_BOT_TOKEN is required');
    }

    const botClient = new BotClient(config, logger);
    await botClient.start();

    logger.info('✅ Bot started successfully');

    process.on('SIGINT', async () => {
      logger.info('🛑 Shutting down gracefully...');
      await botClient.shutdown();
      process.exit(0);
    });

  } catch (error) {
    logger.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

main();