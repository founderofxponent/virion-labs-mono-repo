const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
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
        return interaction.reply({ content: 'This button is not for you.', flags: MessageFlags.Ephemeral });
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
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Extract user ID from customId: access_request_modal_${userId}
      const userId = interaction.customId.replace('access_request_modal_', '');
      const fullName = interaction.fields.getTextInputValue('full_name');
      const email = interaction.fields.getTextInputValue('email');

      this.logger.info(`[RequestAccessHandler] Modal customId: ${interaction.customId}`);
      this.logger.info(`[RequestAccessHandler] Extracted userId: ${userId}`);
      this.logger.info(`[RequestAccessHandler] Actual user ID: ${interaction.user.id}`);

      const payload = {
        user_id: userId,
        user_tag: interaction.user.tag,
        guild_id: interaction.guild.id,
        email: email,
        name: fullName,
      };

      this.logger.info(`[RequestAccessHandler] Payload: ${JSON.stringify(payload)}`);

      const response = await this.apiService.submitAccessRequest(payload);
      const message = response.data?.message || 'An error occurred while processing your request.';
      await interaction.editReply(message);
      
      // Send access request email notification
      if (response.success) {
        try {
          await this.sendAccessRequestEmail({
            userId: userId,
            username: interaction.user.tag,
            email: email,
            fullName: fullName,
            guildName: interaction.guild.name
          });
        } catch (emailError) {
          this.logger.warn(`[RequestAccess] Failed to send access request email: ${emailError.message}`);
        }
      }

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
  
  /**
   * Send access request email notification
   * @param {Object} data - Email data
   * @private
   */
  async sendAccessRequestEmail(data) {
    try {
      await this.apiService.sendTemplateEmail({
        template_id: 'discord-access-request',
        recipient_email: data.email,
        variables: {
          username: data.username,
          full_name: data.fullName,
          email: data.email,
          guild_name: data.guildName
        }
      });
      this.logger.info(`[RequestAccess] Access request email sent to ${data.email} for user ${data.userId}`);
    } catch (error) {
      this.logger.error(`[RequestAccess] Failed to send access request email: ${error.message}`);
      throw error;
    }
  }
}

module.exports = { RequestAccessHandler };