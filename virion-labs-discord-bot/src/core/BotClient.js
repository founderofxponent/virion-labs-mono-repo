const { Client, REST, Routes } = require('discord.js');
const { SlashCommandManager } = require('./SlashCommandManager');
const { EventHandler } = require('./EventHandler');
const { InteractionHandler } = require('./InteractionHandler');

/**
 * Main Discord Bot Client that orchestrates all components
 */
class BotClient {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize Discord client
    this.client = new Client({
      intents: config.discord.intents
    });
    
    // Initialize REST client for API operations
    this.rest = new REST({ version: '10' }).setToken(config.discord.token);
    
    // Initialize managers
    this.slashCommandManager = new SlashCommandManager(this.config, this.logger);
    this.eventHandler = new EventHandler(this.config, this.logger);
    this.interactionHandler = new InteractionHandler(this.config, this.logger);
    
    this.isReady = false;
  }

  /**
   * Start the bot
   */
  async start() {
    try {
      this.logger.info('🔌 Connecting to services...');
      
      // Test API connection first
      const apiConnected = await this.testApiConnection();
      if (!apiConnected) {
        throw new Error('Failed to connect to Dashboard API');
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Login to Discord
      await this.client.login(this.config.discord.token);
      
      // Wait for ready event
      await this.waitForReady();
      
      // Register slash commands
      await this.registerSlashCommands();
      
      this.logger.success('✅ Bot started successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to start bot:', error);
      throw error;
    }
  }

  /**
   * Test connection to the Dashboard API
   * @returns {Promise<boolean>}
   */
  async testApiConnection() {
    try {
      const response = await fetch(`${this.config.api.dashboardUrl}/health`);
      if (response.ok) {
        this.logger.info('✅ Dashboard API connection test successful');
        return true;
      }
      this.logger.error(`❌ Dashboard API connection test failed: Status ${response.status}`);
      return false;
    } catch (error) {
      this.logger.error('❌ Dashboard API connection test error:', error);
      return false;
    }
  }

  /**
   * Setup Discord event listeners
   */
  setupEventListeners() {
    // Ready event
    this.client.once('ready', () => {
      this.logger.info(`🤖 Bot logged in as ${this.client.user.tag}`);
      this.logger.info(`📊 Serving ${this.client.guilds.cache.size} servers`);
      this.isReady = true;
    });

    // Interaction events
    this.client.on('interactionCreate', async (interaction) => {
      await this.interactionHandler.handleInteraction(interaction);
    });

    // Guild member events
    this.client.on('guildMemberAdd', async (member) => {
      await this.eventHandler.handleGuildMemberAdd(member);
    });

    // Message events (for legacy support if needed)
    this.client.on('messageCreate', async (message) => {
      await this.eventHandler.handleMessage(message);
    });

    // Error handling
    this.client.on('error', (error) => {
      this.logger.error('❌ Discord client error:', error);
    });

    this.client.on('warn', (warning) => {
      this.logger.warn('⚠️ Discord client warning:', warning);
    });

    // Reconnection events
    this.client.on('disconnect', () => {
      this.logger.warn('🔌 Bot disconnected from Discord');
    });

    this.client.on('reconnecting', () => {
      this.logger.info('🔄 Bot reconnecting to Discord...');
    });
  }

  /**
   * Wait for the bot to be ready
   */
  async waitForReady() {
    return new Promise((resolve) => {
      if (this.isReady) {
        resolve();
      } else {
        this.client.once('ready', resolve);
      }
    });
  }

  /**
   * Register slash commands with Discord
   */
  async registerSlashCommands() {
    try {
      this.logger.info('🔄 Registering slash commands...');
      
      const commands = this.slashCommandManager.buildCommands();
      
      // Clear existing commands first
      await this.clearExistingCommands();
      
      // Register new commands globally
      await this.rest.put(
        Routes.applicationCommands(this.client.user.id),
        { body: commands.map(cmd => cmd.toJSON()) }
      );
      
      this.logger.success(`✅ Registered ${commands.length} slash commands: ${commands.map(c => `/${c.name}`).join(', ')}`);
      
    } catch (error) {
      this.logger.error('❌ Failed to register slash commands:', error);
      throw error;
    }
  }

  /**
   * Clear existing slash commands
   */
  async clearExistingCommands() {
    try {
      this.logger.info('🧹 Clearing existing slash commands...');
      
      // Clear global commands
      await this.rest.put(
        Routes.applicationCommands(this.client.user.id),
        { body: [] }
      );
      
      // Clear guild-specific commands for all guilds
      for (const guild of this.client.guilds.cache.values()) {
        try {
          await this.rest.put(
            Routes.applicationGuildCommands(this.client.user.id, guild.id),
            { body: [] }
          );
        } catch (error) {
          this.logger.warn(`⚠️ Could not clear commands for guild ${guild.name}:`, error.message);
        }
      }
      
      // Wait for Discord to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      this.logger.error('❌ Failed to clear existing commands:', error);
    }
  }

  /**
   * Get the Discord client instance
   */
  getClient() {
    return this.client;
  }

  /**
   * Shutdown the bot gracefully
   */
  async shutdown() {
    try {
      this.logger.info('🛑 Shutting down bot...');
      
      if (this.client) {
        await this.client.destroy();
      }
      
      this.logger.info('✅ Bot shutdown complete');
      
    } catch (error) {
      this.logger.error('❌ Error during bot shutdown:', error);
    }
  }
}

module.exports = { BotClient }; 