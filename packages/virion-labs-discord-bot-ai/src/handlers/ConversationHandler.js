
const { ThreadAutoArchiveDuration } = require('discord.js');

class ConversationHandler {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.dashboardApiUrl = config.api.dashboardUrl;
        this.threadMap = new Map(); // discord_thread_id -> db_thread_uuid
    }

    async startConversation(interaction) {
        try {
            const channel = interaction.channel;
            const user = interaction.author;

            const campaignId = await this.getCampaignIdFromChannel(channel);

            // Create a private thread for the conversation
            const thread = await channel.threads.create({
                name: `Onboarding with ${user.username}`,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                reason: `Natural language onboarding for ${user.tag}`,
            });

            await thread.send(`Hello ${user.toString()}, let's start the onboarding process. What can you tell me about yourself?`);

            // Start a conversation thread in the database
            const response = await fetch(`${this.dashboardApiUrl}/api/conversations/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    channel_id: channel.id,
                    thread_id: thread.id,
                    campaign_id: campaignId,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                this.logger.error('Failed to start conversation thread in DB', error);
                await thread.send("I'm having some trouble starting our conversation. Please try again later.");
                return;
            }

            const threadData = await response.json();
            this.threadMap.set(thread.id, threadData.id);

            // Store the message from the user
            await this.storeMessage(threadData.id, interaction.id, user.id, interaction.content);
            // Store the bot's initial message
            const botMessage = await thread.send("What brings you to our community?");
            await this.storeMessage(threadData.id, botMessage.id, this.config.discord.clientId, botMessage.content, true);

        } catch (error) {
            this.logger.error('Error starting conversation:', error);
        }
    }

    async handleMessage(message) {
        // Ignore messages from bots or messages not in a thread
        if (message.author.bot || !message.channel.isThread()) return;

        try {
            const dbThreadId = this.threadMap.get(message.channel.id);
            if(dbThreadId) {
                await this.storeMessage(dbThreadId, message.id, message.author.id, message.content);
            }
        } catch(error) {
            this.logger.error("Error handling message in conversation", error);
        }
    }

    async getCampaignIdFromChannel(channel) {
        if (channel.topic && channel.topic.includes("campaign_id:")) {
            const match = channel.topic.match(/campaign_id:(\S+)/);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    async storeMessage(threadId, messageId, authorId, content, isBotMessage = false) {
        const response = await fetch(`${this.dashboardApiUrl}/api/conversations/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                thread_id: threadId,
                message_id: messageId,
                author_id: authorId,
                content: content,
                is_bot_message: isBotMessage,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            this.logger.error('Failed to store message', error);
        }
    }
}

module.exports = { ConversationHandler }; 