const { Client, REST, Routes } = require('discord.js');
const { SlashCommandManager } = require('./SlashCommandManager');
const { InteractionHandler } = require('./InteractionHandler');

class BotClient {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.client = new Client({ intents: config.discord.intents });
    this.rest = new REST({ version: '9' }).setToken(config.discord.token);
    this.slashCommandManager = new SlashCommandManager(this.config, this.logger);
    this.interactionHandler = new InteractionHandler(this.config, this.logger);
  }

  async start() {
    this.setupEventListeners();
    await this.client.login(this.config.discord.token);
    await this.registerSlashCommands();
  }

  setupEventListeners() {
    this.client.once('ready', () => {
      this.logger.info(`🤖 Bot logged in as ${this.client.user.tag}`);
    });

    this.client.on('interactionCreate', (interaction) => {
      this.interactionHandler.handle(interaction);
    });

    this.client.on('guildMemberAdd', (member) => {
      this.interactionHandler.handleGuildMemberAdd(member);
    });
  }

  async registerSlashCommands() {
    try {
      this.logger.info('🔄 Registering slash commands...');
      const commands = this.slashCommandManager.getCommands();
      await this.rest.put(
        Routes.applicationCommands(this.client.user.id),
        { body: commands.map(cmd => cmd.toJSON()) }
      );
      this.logger.success(`✅ Registered ${commands.length} slash commands globally.`);
    } catch (error) {
      this.logger.error('❌ Failed to register slash commands:', error);
    }
  }

  async shutdown() {
    this.logger.info('🛑 Shutting down bot...');
    await this.client.destroy();
  }
}

module.exports = { BotClient };