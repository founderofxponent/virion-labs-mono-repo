const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { ApiService } = require('../services/ApiService');

class OnboardingHandler {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.apiService = new ApiService(config, logger);
  }

  async handleStartButton(interaction) {
    try {
      const parts = interaction.customId.split('_');
      const userId = parts[parts.length - 1];
      const campaignId = parts.slice(2, -1).join('_');

      if (interaction.user.id !== userId) {
        return interaction.reply({ content: 'This button is not for you.', ephemeral: true });
      }

      const response = await this.apiService.startOnboarding(campaignId, userId, interaction.user.username);
      if (!response.success) {
        return interaction.reply({ content: 'Failed to start onboarding.', ephemeral: true });
      }
  
      // Check if there are any onboarding fields configured
      if (!response.data || !response.data.questions || response.data.questions.length === 0) {
        return interaction.reply({
          content: '⚠️ This campaign has no onboarding fields configured. Please contact the campaign administrator.',
          ephemeral: true
        });
      }
  
      const modal = new ModalBuilder()
        .setCustomId(`onboarding_modal_${campaignId}_${userId}`)
        .setTitle('Onboarding');
  
      response.data.questions.forEach(question => {
        const textInput = new TextInputBuilder()
          .setCustomId(question.field_key)
          .setLabel(question.field_label)
          .setStyle(this._getInputStyle(question.field_type))
          .setRequired(question.is_required || false);
        
        // Add placeholder if provided
        if (question.field_placeholder) {
          textInput.setPlaceholder(question.field_placeholder);
        }
        
        modal.addComponents(new ActionRowBuilder().addComponents(textInput));
      });

      await interaction.showModal(modal);

    } catch (error) {
      this.logger.error('❌ Error in OnboardingHandler.handleStartButton:', error);
    }
  }

  async handleModalSubmission(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const parts = interaction.customId.split('_');
      const userId = parts[parts.length - 1];
      const campaignId = parts.slice(2, -1).join('_');
      const responses = {};
      interaction.fields.fields.forEach((value, key) => {
        responses[key] = value.value;
      });

      const payload = {
        campaign_id: campaignId,
        discord_user_id: userId,
        discord_username: interaction.user.username,
        responses,
      };

      const response = await this.apiService.submitOnboarding(payload);
      
      let replyMessage = response.data.message;
      if (response.data.role_assigned) {
        replyMessage += ' You have been granted a new role!';
      }

      await interaction.editReply(replyMessage);

    } catch (error) {
      this.logger.error('❌ Error in OnboardingHandler.handleModalSubmission:', error);
      await interaction.editReply('An error occurred while submitting your onboarding information.');
    }
  }

  /**
   * Convert Strapi field types to Discord TextInputStyle
   * @param {string} fieldType - The Strapi field type
   * @returns {TextInputStyle} Discord input style
   * @private
   */
  _getInputStyle(fieldType) {
    switch (fieldType) {
      case 'multiselect':
      case 'textarea':
        return TextInputStyle.Paragraph;
      case 'text':
      case 'email':
      case 'number':
      case 'url':
      case 'select':
      case 'boolean':
      default:
        return TextInputStyle.Short;
    }
  }
}

module.exports = { OnboardingHandler };