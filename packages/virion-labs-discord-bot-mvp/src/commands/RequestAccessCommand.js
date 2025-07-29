const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class RequestAccessCommand {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  async execute(interaction) {
    try {
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

      await interaction.reply({ embeds: [embed], components: [components], ephemeral: true });

    } catch (error) {
      this.logger.error('❌ Error in RequestAccessCommand:', error);
      interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
    }
  }
}

module.exports = { RequestAccessCommand };