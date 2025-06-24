const { SlashCommandBuilder } = require('discord.js');

/**
 * Manages slash command registration and configuration
 */
class SlashCommandManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Command definitions - organized for easy extension
    this.commandDefinitions = {
      // Core commands that should always be available
      CORE: [
        {
          name: 'join',
          description: 'Join campaigns - shows public campaigns or channel-specific campaigns based on context',
          handler: 'handleJoinCommand'
        },
        {
          name: 'request-access',
          description: 'Request access to private channels (use in designated request channel)',
          handler: 'handleRequestAccessCommand'
        }
      ],
      
      // Future command categories can be added here
      // ADMIN: [
      //   {
      //     name: 'admin-panel',
      //     description: 'Access admin panel (admin only)',
      //     handler: 'handleAdminPanelCommand',
      //     permissions: ['ADMINISTRATOR']
      //   }
      // ],
      // MODERATION: [
      //   {
      //     name: 'moderate',
      //     description: 'Moderation tools',
      //     handler: 'handleModerationCommand',
      //     permissions: ['MODERATE_MEMBERS']
      //   }
      // ],
      // UTILITY: [
      //   {
      //     name: 'help',
      //     description: 'Show help information',
      //     handler: 'handleHelpCommand'
      //   }
      // ]
    };
  }

  /**
   * Build slash command objects for Discord API
   * @returns {Array<SlashCommandBuilder>}
   */
  buildCommands() {
    const commands = [];
    
    // Add core commands
    this.commandDefinitions.CORE.forEach(cmd => {
      const command = new SlashCommandBuilder()
        .setName(cmd.name)
        .setDescription(cmd.description);
      
      // Add permissions if specified
      if (cmd.permissions) {
        command.setDefaultMemberPermissions(cmd.permissions);
      }
      
      commands.push(command);
    });
    
    // Future: Add other command categories here
    // this.commandDefinitions.ADMIN?.forEach(cmd => { ... });
    // this.commandDefinitions.MODERATION?.forEach(cmd => { ... });
    // this.commandDefinitions.UTILITY?.forEach(cmd => { ... });
    
    return commands;
  }

  /**
   * Get command handler name by command name
   * @param {string} commandName 
   * @returns {string|null}
   */
  getCommandHandler(commandName) {
    // Search through all command categories
    for (const category of Object.values(this.commandDefinitions)) {
      const command = category.find(cmd => cmd.name === commandName);
      if (command) {
        return command.handler;
      }
    }
    return null;
  }

  /**
   * Get all command names
   * @returns {Array<string>}
   */
  getAllCommandNames() {
    const names = [];
    for (const category of Object.values(this.commandDefinitions)) {
      names.push(...category.map(cmd => cmd.name));
    }
    return names;
  }

  /**
   * Check if a command exists
   * @param {string} commandName 
   * @returns {boolean}
   */
  hasCommand(commandName) {
    return this.getAllCommandNames().includes(commandName);
  }

  /**
   * Add a new command category (for future extensibility)
   * @param {string} categoryName 
   * @param {Array} commands 
   */
  addCommandCategory(categoryName, commands) {
    this.commandDefinitions[categoryName] = commands;
    this.logger.info(`➕ Added command category: ${categoryName} with ${commands.length} commands`);
  }

  /**
   * Remove a command category
   * @param {string} categoryName 
   */
  removeCommandCategory(categoryName) {
    if (this.commandDefinitions[categoryName]) {
      delete this.commandDefinitions[categoryName];
      this.logger.info(`➖ Removed command category: ${categoryName}`);
    }
  }

  /**
   * Get command statistics
   * @returns {Object}
   */
  getStats() {
    const stats = {
      totalCommands: 0,
      categories: {}
    };

    for (const [categoryName, commands] of Object.entries(this.commandDefinitions)) {
      stats.categories[categoryName] = commands.length;
      stats.totalCommands += commands.length;
    }

    return stats;
  }
}

module.exports = { SlashCommandManager }; 