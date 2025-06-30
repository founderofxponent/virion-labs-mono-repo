const { Client, REST, Routes, Events } = require('discord.js');
const { SlashCommandManager } = require('./SlashCommandManager');
const { EventHandler } = require('./EventHandler');
const { InteractionHandler } = require('./InteractionHandler');
const { OnboardingHandler } = require('../handlers/OnboardingHandler');

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
    
    // Initialize the cache FIRST, then pass it to the handler.
    this.invitesCache = new Map();
    this.onboardingHandler = new OnboardingHandler(this.config, this.logger, this.invitesCache);
    
    this.isReady = false;
    this.eventListenersSetup = false; // Add flag to prevent duplicate setup
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
    // Prevent duplicate event listener registration
    if (this.eventListenersSetup) {
      this.logger.debug('⚠️ Event listeners already setup, skipping...');
      return;
    }

    // Clear existing event listeners first
    this.clearExistingEventListeners();
    
    // Ready event
    this.client.once('ready', () => {
      this.logger.info(`🤖 Bot logged in as ${this.client.user.tag}`);
      this.logger.info(`📊 Serving ${this.client.guilds.cache.size} servers`);
      this.isReady = true;
      this.onReady();
    });

    // Guild events
    this.client.on('guildCreate', this.handleGuildCreate);
    this.client.on('guildDelete', this.handleGuildDelete);

    // Interaction events
    this.client.on('interactionCreate', (interaction) => this.interactionHandler.handleInteraction(interaction));

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

    // Onboarding event - crucial for referral tracking
    this.client.on(Events.GuildMemberAdd, (member) => {
      if (this.onboardingHandler) {
          this.onboardingHandler.handleGuildMemberAdd(member);
      }
    });

    // Mark event listeners as setup
    this.eventListenersSetup = true;
    this.logger.debug('✅ Event listeners setup complete');
  }

  /**
   * Clear existing event listeners
   */
  clearExistingEventListeners() {
    try {
      this.logger.info('🧹 Clearing existing event listeners...');
      
      // Get current listener counts for logging
      const listenerCounts = {};
      const eventNames = ['ready', 'interactionCreate', 'guildMemberAdd', 'messageCreate', 'error', 'warn', 'disconnect', 'reconnecting'];
      
      eventNames.forEach(eventName => {
        const count = this.client.listenerCount(eventName);
        if (count > 0) {
          listenerCounts[eventName] = count;
        }
      });

      if (Object.keys(listenerCounts).length > 0) {
        this.logger.debug('📊 Existing listeners:', listenerCounts);
      }

      // Remove all listeners
      this.client.removeAllListeners();
      
      this.logger.debug('✅ Event listeners cleared successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to clear existing event listeners:', error);
    }
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
      
      // First, fetch and log existing commands for debugging
      try {
        const globalCommands = await this.rest.get(Routes.applicationCommands(this.client.user.id));
        if (globalCommands.length > 0) {
          this.logger.debug(`📊 Found ${globalCommands.length} existing global commands:`, globalCommands.map(cmd => cmd.name));
        }
      } catch (error) {
        this.logger.warn('⚠️ Could not fetch existing global commands for logging:', error.message);
      }
      
      // Clear global commands
      await this.rest.put(
        Routes.applicationCommands(this.client.user.id),
        { body: [] }
      );
      this.logger.debug('✅ Global commands cleared');
      
      // Clear guild-specific commands for all guilds in cache
      let guildCommandsCleared = 0;
      for (const guild of this.client.guilds.cache.values()) {
        try {
          // Check if guild has commands first
          const guildCommands = await this.rest.get(
            Routes.applicationGuildCommands(this.client.user.id, guild.id)
          );
          
          if (guildCommands.length > 0) {
            this.logger.debug(`📊 Found ${guildCommands.length} commands in guild ${guild.name}`);
            
            await this.rest.put(
              Routes.applicationGuildCommands(this.client.user.id, guild.id),
              { body: [] }
            );
            guildCommandsCleared++;
          }
        } catch (error) {
          this.logger.warn(`⚠️ Could not clear commands for guild ${guild.name}:`, error.message);
        }
      }
      
      if (guildCommandsCleared > 0) {
        this.logger.debug(`✅ Cleared commands from ${guildCommandsCleared} guilds`);
      }
      
      // Note: We can't clear commands from guilds we're no longer in, 
      // but those commands are automatically removed by Discord when the bot leaves
      
      // Wait for Discord to process changes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.logger.debug('✅ Command clearing completed');
      
    } catch (error) {
      this.logger.error('❌ Failed to clear existing commands:', error);
    }
  }

  /**
   * Cache invites for a specific guild
   * @param {import('discord.js').Guild} guild 
   */
  async cacheGuildInvites(guild) {
    try {
      this.logger.info(`🔄 Caching invites for guild: ${guild.name} (${guild.id})`);
      const invites = await guild.invites.fetch();
      
      // Create a new Map with immutable snapshots of invite data
      const inviteSnapshots = new Map();
      for (const [code, invite] of invites) {
        // Create an immutable snapshot of the invite data
        inviteSnapshots.set(code, {
          code: invite.code,
          uses: invite.uses,
          maxUses: invite.maxUses,
          inviter: invite.inviter,
          channel: invite.channel,
          guild: invite.guild,
          createdTimestamp: invite.createdTimestamp,
          expiresTimestamp: invite.expiresTimestamp
        });
      }
      
      this.invitesCache.set(guild.id, inviteSnapshots);
      this.logger.success(`✅ Cached ${inviteSnapshots.size} invites for ${guild.name}.`);
    } catch (error) {
      this.logger.error(`❌ Failed to cache invites for ${guild.name}:`, error.message);
    }
  }

  /**
   * Handle the bot joining a new guild.
   * @param {import('discord.js').Guild} guild
   */
  handleGuildCreate = async (guild) => {
    this.logger.info(`➕ Bot joined new guild: ${guild.name} (${guild.id})`);
    await this.cacheGuildInvites(guild);
  }

  /**
   * Handle the bot leaving a guild.
   * @param {import('discord.js').Guild} guild
   */
  handleGuildDelete = (guild) => {
    this.logger.info(`➖ Bot left guild: ${guild.name} (${guild.id})`);
    if (this.invitesCache.has(guild.id)) {
      this.invitesCache.delete(guild.id);
      this.logger.info(`🗑️ Removed invites for ${guild.name} from cache.`);
    }
  }

  /**
   * Get the Discord client instance
   */
  getClient() {
    return this.client;
  }

  /**
   * Get the InteractionHandler instance
   */
  getInteractionHandler() {
    return this.interactionHandler;
  }

  /**
   * Shutdown the bot gracefully
   */
  async shutdown() {
    try {
      this.logger.info('🛑 Shutting down bot...');
      
      if (this.client) {
        // Remove all event listeners to prevent memory leaks
        this.client.removeAllListeners();
        await this.client.destroy();
      }
      
      // Reset flags for clean restart
      this.isReady = false;
      this.eventListenersSetup = false;
      
      this.logger.info('✅ Bot shutdown complete');
      
    } catch (error) {
      this.logger.error('❌ Error during bot shutdown:', error);
    }
  }

  async onReady() {
    // Clear any existing cache before fetching fresh data
    this.invitesCache.clear();
    const fetchPromises = this.client.guilds.cache.map(guild => this.cacheGuildInvites(guild));

    await Promise.all(fetchPromises);
  }
}

module.exports = { BotClient }; 