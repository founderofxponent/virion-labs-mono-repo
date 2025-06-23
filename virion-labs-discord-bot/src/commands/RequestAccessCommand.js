const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { InteractionUtils } = require('../utils/InteractionUtils');
const { AnalyticsService } = require('../services/AnalyticsService');

/**
 * Handles the /request-access slash command
 */
class RequestAccessCommand {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.analyticsService = new AnalyticsService(config, logger);
  }

  /**
   * Execute the /request-access command
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async execute(interaction) {
    try {
      await InteractionUtils.safeDefer(interaction, { ephemeral: true });
      
      const guildInfo = InteractionUtils.getGuildInfo(interaction);
      const userInfo = InteractionUtils.getUserInfo(interaction);
      
      if (!guildInfo) {
        await interaction.editReply({
          content: '❌ This command can only be used in a server, not in DMs.'
        });
        return;
      }

      this.logger.info(`🔑 Request access command from ${userInfo.tag} in guild ${guildInfo.id}, channel ${guildInfo.channelId}`);
      
      // Check if the command is being used in the correct channel
      const requestChannelId = this.config.discord_server.requestAccessChannelId;
      if (requestChannelId && guildInfo.channelId !== requestChannelId) {
        const requestChannel = interaction.guild.channels.cache.get(requestChannelId);
        const channelMention = requestChannel ? `<#${requestChannelId}>` : 'the designated request channel';
        
        await interaction.editReply({
          content: `❌ This command can only be used in ${channelMention}.`
        });
        return;
      }

      // Check if user already has the verified role
      const verifiedRoleId = this.config.discord_server.verifiedRoleId;
      if (verifiedRoleId && interaction.member.roles.cache.has(verifiedRoleId)) {
        const verifiedRole = interaction.guild.roles.cache.get(verifiedRoleId);
        const roleName = verifiedRole ? verifiedRole.name : 'Verified';
        
        await interaction.editReply({
          content: `✅ You already have the **${roleName}** role and access to private channels!`
        });
        return;
      }

      // Create the access request interface
      const embed = this.createAccessRequestEmbed(userInfo, interaction.guild.name);
      const components = this.createAccessRequestComponents(userInfo.id);
      
      await interaction.editReply({ 
        embeds: [embed], 
        components: components 
      });

      // Track the interaction
      await this.analyticsService.trackInteraction(guildInfo.id, guildInfo.channelId, {
        author: { id: userInfo.id, tag: userInfo.tag },
        id: interaction.id,
        content: '/request-access'
      }, 'slash_command_request_access');

    } catch (error) {
      this.logger.error('❌ Error in request-access command:', error);
      await this.handleError(interaction, 'Failed to process access request. Please try again later.');
    }
  }

  /**
   * Create the access request embed
   * @param {Object} userInfo 
   * @param {string} guildName 
   * @returns {EmbedBuilder}
   */
  createAccessRequestEmbed(userInfo, guildName) {
    return new EmbedBuilder()
      .setTitle('🔑 Request Access to Private Channels')
      .setDescription(
        `Hi ${userInfo.username}! You're requesting access to private channels in **${guildName}**.\n\n` +
        `**What happens next?**\n` +
        `• Click "Complete Access Form" to fill out your information\n` +
        `• Provide your name and email address\n` +
        `• You'll automatically receive access upon submission\n` +
        `• Once approved, you'll gain access to private channels\n\n` +
        `⚠️ Please make sure you've read the server rules before requesting access.`
      )
      .setColor('#3498db')
      .setThumbnail(userInfo.avatarURL || null)
      .setTimestamp()
      .setFooter({ 
        text: `Requested by ${userInfo.tag}`,
        iconURL: userInfo.avatarURL || undefined
      });
  }

  /**
   * Create the access request action components
   * @param {string} userId 
   * @returns {Array<ActionRowBuilder>}
   */
  createAccessRequestComponents(userId) {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`request_access_submit_${userId}`)
          .setLabel('Complete Access Form')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📝'),
        new ButtonBuilder()
          .setCustomId(`request_access_cancel_${userId}`)
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❌')
      );

    return [row];
  }

  /**
   * Handle command errors
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {string} message 
   */
  async handleError(interaction, message) {
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: `❌ ${message}` });
      } else {
        await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
      }
    } catch (error) {
      this.logger.error('❌ Failed to send error message:', error);
    }
  }
}

module.exports = { RequestAccessCommand }; 