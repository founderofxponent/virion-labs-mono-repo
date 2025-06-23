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
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.deferReply(options);
      }
    } catch (error) {
      console.error('❌ Error in safeDefer:', error);
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
}

module.exports = { InteractionUtils }; 