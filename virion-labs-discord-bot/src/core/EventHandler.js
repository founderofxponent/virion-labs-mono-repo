const { ReferralHandler } = require('../handlers/ReferralHandler');

/**
 * Handles Discord events (member joins, messages, etc.)
 */
class EventHandler {
  constructor(config, logger, database) {
    this.config = config;
    this.logger = logger;
    this.database = database;
    
    // Initialize specialized handlers
    this.referralHandler = new ReferralHandler(config, logger, database);
  }

  /**
   * Handle new guild member joins
   * @param {import('discord.js').GuildMember} member 
   */
  async handleGuildMemberAdd(member) {
    try {
      this.logger.info(`👋 New member joined: ${member.user.tag} in ${member.guild.name}`);
      
      // Check for referral invite context
      await this.referralHandler.handleNewMemberOnboarding(member);
      
      // Future: Add other member join handlers here
      // - Welcome messages
      // - Auto role assignment
      // - Member verification
      
    } catch (error) {
      this.logger.error('❌ Error handling guild member add:', error);
    }
  }

  /**
   * Handle message creation (for legacy support and special cases)
   * @param {import('discord.js').Message} message 
   */
  async handleMessage(message) {
    try {
      // Ignore bot messages
      if (message.author.bot) return;
      
      // Handle DM messages (for referral codes, etc.)
      if (!message.guild) {
        await this.handleDirectMessage(message);
        return;
      }
      
      // Handle guild messages (legacy support)
      await this.handleGuildMessage(message);
      
    } catch (error) {
      this.logger.error('❌ Error handling message:', error);
    }
  }

  /**
   * Handle direct messages
   * @param {import('discord.js').Message} message 
   */
  async handleDirectMessage(message) {
    try {
      this.logger.info(`💬 DM from ${message.author.tag}: ${message.content}`);
      
      // Check for referral codes in DMs
      await this.referralHandler.handleDirectMessage(message);
      
      // Future: Add other DM handlers here
      // - Support ticket creation
      // - User verification
      
    } catch (error) {
      this.logger.error('❌ Error handling direct message:', error);
    }
  }

  /**
   * Handle guild messages (legacy support)
   * @param {import('discord.js').Message} message 
   */
  async handleGuildMessage(message) {
    try {
      // This is mainly for legacy support
      // Most functionality should use slash commands and interactions
      
      // Check for referral codes in guild messages
      const referralCode = this.extractReferralCode(message.content);
      if (referralCode) {
        await this.referralHandler.handleReferralMessage(message, referralCode);
      }
      
      // Future: Add other guild message handlers here if needed
      
    } catch (error) {
      this.logger.error('❌ Error handling guild message:', error);
    }
  }

  /**
   * Extract referral code from message content
   * @param {string} content 
   * @returns {string|null}
   */
  extractReferralCode(content) {
    // Look for patterns like "REF123", "ref:ABC123", etc.
    const patterns = [
      /\bREF[A-Z0-9]{6,}\b/i,           // REF123456
      /\bref:([A-Z0-9]{6,})\b/i,        // ref:ABC123
      /\breferral[:\s]+([A-Z0-9]{6,})\b/i, // referral: ABC123
      /\b([A-Z0-9]{8,12})\b/             // Generic alphanumeric codes
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  }

  /**
   * Handle guild member updates (role changes, etc.)
   * @param {import('discord.js').GuildMember} oldMember 
   * @param {import('discord.js').GuildMember} newMember 
   */
  async handleGuildMemberUpdate(oldMember, newMember) {
    try {
      // Future: Handle member role changes, nickname changes, etc.
      this.logger.debug(`👤 Member updated: ${newMember.user.tag} in ${newMember.guild.name}`);
      
    } catch (error) {
      this.logger.error('❌ Error handling guild member update:', error);
    }
  }

  /**
   * Handle guild member removal
   * @param {import('discord.js').GuildMember} member 
   */
  async handleGuildMemberRemove(member) {
    try {
      this.logger.info(`👋 Member left: ${member.user.tag} from ${member.guild.name}`);
      
      // Future: Handle member departure
      // - Update statistics
      // - Clean up user data
      // - Log departure reasons
      
    } catch (error) {
      this.logger.error('❌ Error handling guild member remove:', error);
    }
  }

  /**
   * Get event handler statistics
   * @returns {Object}
   */
  getStats() {
    return {
      handlersInitialized: {
        referral: !!this.referralHandler
      }
    };
  }
}

module.exports = { EventHandler }; 