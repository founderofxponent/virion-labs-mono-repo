const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { ApiService } = require('../services/ApiService');

class RequestAccessHandler {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.apiService = new ApiService(config, logger);
  }

  async handleAccessRequestSubmission(interaction) {
    try {
      const userId = interaction.customId.split('_').pop();
      if (interaction.user.id !== userId) {
        return interaction.reply({ content: 'This button is not for you.', ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId(`access_request_modal_${userId}`)
        .setTitle('Request Access');

      const nameInput = new TextInputBuilder()
        .setCustomId('full_name')
        .setLabel('Full Name')
        .setStyle(TextInputStyle.Short);

      const emailInput = new TextInputBuilder()
        .setCustomId('email')
        .setLabel('Email Address')
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(emailInput)
      );

      await interaction.showModal(modal);

    } catch (error) {
      this.logger.error('❌ Error in RequestAccessHandler.handleAccessRequestSubmission:', error);
    }
  }

  async handleModalSubmission(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const userId = interaction.customId.split('_').pop();
      const fullName = interaction.fields.getTextInputValue('full_name');
      const email = interaction.fields.getTextInputValue('email');

      const payload = {
        user_id: userId,
        user_tag: interaction.user.tag,
        guild_id: interaction.guild.id,
        email: email,
        name: fullName,
      };

      const response = await this.apiService.submitAccessRequest(payload);
      const message = response.data?.message || 'An error occurred while processing your request.';
      await interaction.editReply(message);

      // In a real implementation, you would use the role ID from the API response
      // to assign the role to the user.
      // const role = interaction.guild.roles.cache.get(response.data.role_to_assign);
      // if (role) {
      //   await interaction.member.roles.add(role);
      // }

    } catch (error) {
      this.logger.error('❌ Error in RequestAccessHandler.handleModalSubmission:', error);
      try {
        await interaction.editReply('An error occurred while processing your request. Please try again.');
      } catch (replyError) {
        this.logger.error('❌ Failed to send error message to user:', replyError);
      }
    }
  }
}

module.exports = { RequestAccessHandler };