const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ApiService } = require('../services/ApiService');

class OnboardingHandler {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.apiService = new ApiService(config, logger);
    // Cache for storing onboarding questions per user/campaign
    this.questionsCache = new Map();
  }

  async handleStartButton(interaction) {
    try {
      const parts = interaction.customId.split('_');
      const userId = parts[parts.length - 1];
      const campaignId = parts.slice(2, -1).join('_');

      this.logger.info(`[Onboarding] User ${userId} clicked start for campaign ${campaignId}.`);

      if (interaction.user.id !== userId) {
        this.logger.warn(`[Onboarding] User ${interaction.user.id} tried to click a button intended for ${userId}.`);
        return interaction.reply({ content: 'This button is not for you.', ephemeral: true });
      }

      // Defer the reply immediately to avoid timeout
      await interaction.deferReply({ ephemeral: true });

      const response = await this.apiService.startOnboarding(campaignId, userId, interaction.user.username);
      if (!response.success) {
        if (response.message && response.message.includes('already completed')) {
          this.logger.info(`[Onboarding] User ${userId} has already completed onboarding for campaign ${campaignId}.`);
          return interaction.editReply({ content: `✅ ${response.message}` });
        }
        this.logger.error(`[Onboarding] Failed to start for user ${userId} on campaign ${campaignId}. API Response: ${JSON.stringify(response)}`);
        return interaction.editReply({ content: 'An error occurred while trying to start the onboarding process. Please try again later.' });
      }
  
      if (!response.data || !response.data.questions || response.data.questions.length === 0) {
        this.logger.warn(`[Onboarding] No onboarding fields configured for campaign ${campaignId}.`);
        return interaction.editReply({
          content: '⚠️ This campaign has no onboarding fields configured. Please contact the campaign administrator.',
        });
      }
  
      // Cache the questions for quick modal display
      const cacheKey = `${campaignId}_${userId}`;
      this.questionsCache.set(cacheKey, response.data.questions);

      // Instead of showing a modal directly, show a button to open it.
      const openModalButton = new ButtonBuilder()
        .setCustomId(`open_onboarding_modal_${campaignId}_${userId}`)
        .setLabel('Begin Onboarding')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(openModalButton);

      await interaction.editReply({
        content: 'Please click the button below to begin the onboarding process.',
        components: [row],
        ephemeral: true,
      });

    } catch (error) {
      this.logger.error('❌ Error in OnboardingHandler.handleStartButton:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: 'An unexpected error occurred. Please try again.' });
      }
    }
  }

  async handleOpenModalButton(interaction) {
    try {
      const parts = interaction.customId.split('_');
      const userId = parts[parts.length - 1];
      const campaignId = parts.slice(3, -1).join('_');

      this.logger.info(`[Onboarding] User ${userId} clicked open modal button for campaign ${campaignId}.`);

      // Get questions from cache to avoid API delay
      const cacheKey = `${campaignId}_${userId}`;
      const questions = this.questionsCache.get(cacheKey);
      
      if (!questions || questions.length === 0) {
        this.logger.error(`[Onboarding] No cached questions found for user ${userId} and campaign ${campaignId}. User may need to restart the process.`);
        return interaction.reply({ content: 'Could not retrieve onboarding questions. Please try starting over.', ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId(`onboarding_modal_${campaignId}_${userId}`)
        .setTitle('Onboarding');
  
      questions.forEach(question => {
        const textInput = new TextInputBuilder()
          .setCustomId(question.field_key)
          .setLabel(question.field_label)
          .setStyle(this._getInputStyle(question.field_type))
          .setRequired(question.is_required || false);
        
        if (question.field_placeholder) {
          textInput.setPlaceholder(question.field_placeholder);
        }
        
        modal.addComponents(new ActionRowBuilder().addComponents(textInput));
      });

      this.logger.info(`[Onboarding] Showing modal to user ${userId} for campaign ${campaignId}.`);
      await interaction.showModal(modal);

    } catch (error) {
      this.logger.error('❌ Error in OnboardingHandler.handleOpenModalButton:', error);
    }
  }

  async handleModalSubmission(interaction) {
    const parts = interaction.customId.split('_');
    const userId = parts[parts.length - 1];
    const campaignId = parts.slice(2, -1).join('_');
    this.logger.info(`[Onboarding] User ${userId} submitted modal for campaign ${campaignId}.`);

    try {
      await interaction.deferReply({ ephemeral: true });

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
      this.logger.debug(`[Onboarding] Submitting payload for user ${userId}: ${JSON.stringify(payload)}`);

      const response = await this.apiService.submitOnboarding(payload);
      
      let replyMessage = response.data.message;
      if (response.data.role_assigned) {
        replyMessage += ' You have been granted a new role!';
      }

      this.logger.info(`[Onboarding] Successfully submitted for user ${userId}. Replying with: "${replyMessage}"`);
      await interaction.editReply(replyMessage);

      // Clean up cached questions after successful submission
      const cacheKey = `${campaignId}_${userId}`;
      this.questionsCache.delete(cacheKey);

    } catch (error) {
      this.logger.error(`❌ Error in OnboardingHandler.handleModalSubmission for user ${userId} on campaign ${campaignId}:`, error);
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