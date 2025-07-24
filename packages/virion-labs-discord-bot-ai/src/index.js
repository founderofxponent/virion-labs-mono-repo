
require('dotenv').config();
const { BotClient } = require('./core/BotClient');

const config = {
    discord: {
        token: process.env.DISCORD_AI_BOT_TOKEN,
        clientId: process.env.DISCORD_AI_BOT_CLIENT_ID,
    },
    api: {
        dashboardUrl: process.env.API_BASE_URL,
    },
};

// A simple logger
const logger = {
    info: (message) => console.log(`[INFO] ${message}`),
    error: (message, error) => console.error(`[ERROR] ${message}`, error),
};

const bot = new BotClient(config, logger);
bot.start(); 