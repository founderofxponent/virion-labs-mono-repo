/**
 * Utility functions for handling Discord interactions safely
 */
class InteractionUtils {
  /**
   * Safely reply to an interaction, handling different states
   * @param {import('discord.js').Interaction} interaction 
   * @param {Object} options - Reply options
   * @returns {Promise<void>}
   */
  static async safeReply(interaction, options) {
    try {
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.reply(options);
      } else if (interaction.deferred && !interaction.replied) {
        return await interaction.editReply(options);
      } else {
        return await interaction.followUp(options);
      }
    } catch (error) {
      console.error('❌ Error in safeReply:', error);
      throw error;
    }
  }

  /**
   * Safely defer an interaction reply
   * @param {import('discord.js').Interaction} interaction 
   * @param {Object} options - Defer options
   * @returns {Promise<void>}
   */
  static async safeDefer(interaction, options = {}) {
    try {
      // Check interaction state more thoroughly
      if (interaction.replied) {
        console.log('⚠️ Interaction already replied');
        return;
      }
      
      if (interaction.deferred) {
        console.log('⚠️ Interaction already deferred');
        return;
      }

      // Use flags instead of ephemeral property to fix deprecation warning
      const deferOptions = {};
      if (options.ephemeral) {
        deferOptions.flags = 64; // MessageFlags.Ephemeral
      }
      
      console.log(`🔄 Deferring interaction: replied=${interaction.replied}, deferred=${interaction.deferred}`);
      return await interaction.deferReply(deferOptions);
      
    } catch (error) {
      console.error('❌ Error in safeDefer:', error);
      console.error(`Interaction state: replied=${interaction.replied}, deferred=${interaction.deferred}`);
      throw error;
    }
  }

  /**
   * Send an error message to the user
   * @param {import('discord.js').Interaction} interaction 
   * @param {string} message - Error message
   * @returns {Promise<void>}
   */
  static async sendError(interaction, message) {
    const errorOptions = {
      content: `❌ ${message}`,
      ephemeral: true
    };

    try {
      await this.safeReply(interaction, errorOptions);
    } catch (error) {
      console.error('❌ Failed to send error message:', error);
    }
  }

  /**
   * Check if interaction is from a guild (not DM)
   * @param {import('discord.js').Interaction} interaction 
   * @returns {boolean}
   */
  static isFromGuild(interaction) {
    return !!interaction.guild;
  }

  /**
   * Extract user information from interaction
   * @param {import('discord.js').Interaction} interaction 
   * @returns {Object}
   */
  static getUserInfo(interaction) {
    const user = interaction.user;
    return {
      id: user.id,
      tag: user.tag,
      username: user.username,
      displayName: user.displayName || user.username
    };
  }

  /**
   * Extract guild information from interaction
   * @param {import('discord.js').Interaction} interaction 
   * @returns {Object|null}
   */
  static getGuildInfo(interaction) {
    if (!interaction.guild) return null;
    
    return {
      id: interaction.guild.id,
      name: interaction.guild.name,
      channelId: interaction.channel?.id,
      channelName: interaction.channel?.name
    };
  }

  /**
   * Check if user has a specific role
   * @param {import('discord.js').Interaction} interaction 
   * @param {string} roleId - Role ID to check for
   * @returns {Promise<boolean>}
   */
  static async hasRole(interaction, roleId) {
    try {
      if (!interaction.guild || !roleId) {
        return false;
      }

      const member = interaction.guild.members.cache.get(interaction.user.id) ||
                    await interaction.guild.members.fetch(interaction.user.id);
      
      return member.roles.cache.has(roleId);
    } catch (error) {
      console.error('❌ Error checking user role:', error);
      return false;
    }
  }

  /**
   * Check if interaction is in a specific channel
   * @param {import('discord.js').Interaction} interaction 
   * @param {string} channelId - Channel ID to check against
   * @returns {boolean}
   */
  static isInChannel(interaction, channelId) {
    if (!channelId || !interaction.channel) {
      return false;
    }
    return interaction.channel.id === channelId;
  }
}

module.exports = { InteractionUtils }; 