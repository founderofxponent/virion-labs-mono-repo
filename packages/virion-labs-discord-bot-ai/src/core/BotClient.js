
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { ConversationHandler } = require('../handlers/ConversationHandler');

class BotClient {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ]
        });

        this.conversationHandler = new ConversationHandler(config, logger);
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.once(Events.ClientReady, () => {
            this.logger.info(`Logged in as ${this.client.user.tag}!`);
        });

        this.client.on(Events.MessageCreate, async (message) => {
            if (message.author.bot) return;

            // In a channel that is configured for onboarding
            if(await this.conversationHandler.getCampaignIdFromChannel(message.channel)) {
                // If it's not a command, start a conversation
                if(!message.content.startsWith('!')) {
                    await this.conversationHandler.startConversation(message);
                }
            } else if (message.channel.isThread()) {
                // If it's in a thread, it might be part of an ongoing conversation
                await this.conversationHandler.handleMessage(message);
            }
        });
    }

    start() {
        this.client.login(this.config.discord.token);
    }
}

module.exports = { BotClient }; 