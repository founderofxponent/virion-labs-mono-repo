const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { ApiService } = require('../services/ApiService');

class RequestAccessCommand {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.apiService = new ApiService(config, logger);
  }

  async execute(interaction) {
    try {
      const hasRole = await this.apiService.hasVerifiedRole(interaction.user.id, interaction.guildId);

      if (hasRole.has_role) {
        return interaction.reply({ content: 'You already have the verified role.', flags: MessageFlags.Ephemeral });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔑 Request Access')
        .setDescription('Click the button below to complete the access request form.')
        .setColor('#3498db');

      const components = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`request_access_submit_${interaction.user.id}`)
          .setLabel('Complete Access Form')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ embeds: [embed], components: [components], flags: MessageFlags.Ephemeral });

    } catch (error) {
      this.logger.error('❌ Error in RequestAccessCommand:', error);
      interaction.reply({ content: 'An error occurred while processing your request.', flags: MessageFlags.Ephemeral });
    }
  }
}

module.exports = { RequestAccessCommand };