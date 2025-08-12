const { GatewayIntentBits } = require('discord.js');

module.exports = {
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
    ],
  },
  api: {
    baseUrl: process.env.BUSINESS_LOGIC_API_URL,
    apiKey: process.env.API_KEY,
  },
  debug: process.env.DEBUG === 'true',
};