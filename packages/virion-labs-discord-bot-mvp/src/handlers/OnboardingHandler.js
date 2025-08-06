const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { ApiService } = require('../services/ApiService');

class OnboardingHandler {
  constructor(config, logger, apiService) {
    this.config = config;
    this.logger = logger;
    this.apiService = apiService || new ApiService(config, logger);
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

      // Get campaign details from cache
      this.logger.debug(`[Onboarding] Looking for cached campaign: ${campaignId}`);
      const campaignData = this.apiService.getCachedCampaign(campaignId);
      if (!campaignData) {
        this.logger.error(`[Onboarding] No cached campaign data found for campaign ${campaignId}`);
        // Log all cached campaigns for debugging
        const allCachedKeys = Array.from(this.apiService.campaignCache.keys());
        this.logger.error(`[Onboarding] Currently cached campaign IDs: ${JSON.stringify(allCachedKeys)}`);
        return interaction.editReply({ content: 'Campaign information not found. Please try running /join again to refresh campaign data.' });
      }
      this.logger.info(`[Onboarding] Found cached campaign: ${campaignData.name}`);

      const response = await this.apiService.startOnboarding(campaignId, userId, interaction.user.username);
      
      // Send onboarding started email notification
      if (response.success) {
        try {
          await this.sendOnboardingStartedEmail({
            userId,
            username: interaction.user.username,
            campaignId,
            campaignName: campaignData.name,
            guildName: interaction.guild.name
          });
        } catch (emailError) {
          this.logger.warn(`[Onboarding] Failed to send onboarding started email: ${emailError.message}`);
        }
      }
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

      // Create a rich embed with campaign details
      const embed = new EmbedBuilder()
        .setTitle(`🚀 ${campaignData.name}`)
        .setColor('#6366f1')
        .setDescription(campaignData.description || 'Ready to begin onboarding for this campaign.');

      // Add additional fields if they exist in the campaign data
      if (campaignData.requirements) {
        embed.addFields({ name: '📋 Requirements', value: campaignData.requirements, inline: false });
      }
      
      if (campaignData.reward_description) {
        embed.addFields({ name: '🎁 Rewards', value: campaignData.reward_description, inline: false });
      }

      if (campaignData.start_date || campaignData.end_date) {
        let timeInfo = '';
        if (campaignData.start_date) {
          timeInfo += `**Start:** ${new Date(campaignData.start_date).toLocaleDateString()}\n`;
        }
        if (campaignData.end_date) {
          timeInfo += `**End:** ${new Date(campaignData.end_date).toLocaleDateString()}`;
        }
        embed.addFields({ name: '📅 Timeline', value: timeInfo.trim(), inline: true });
      }

      embed.setFooter({ text: 'Click the button below to begin the onboarding process.' });

      // Instead of showing a modal directly, show a button to open it.
      const openModalButton = new ButtonBuilder()
        .setCustomId(`open_onboarding_modal_${campaignId}_${userId}`)
        .setLabel('Begin Onboarding')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(openModalButton);

      await interaction.editReply({
        embeds: [embed],
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
      
      // Send onboarding completion email notification
      if (response.success) {
        try {
          const campaignData = this.apiService.getCachedCampaign(campaignId);
          await this.sendOnboardingCompletionEmail({
            userId,
            username: interaction.user.username,
            campaignId,
            campaignName: campaignData?.name || 'Campaign',
            guildName: interaction.guild.name,
            responses: payload.responses
          });
        } catch (emailError) {
          this.logger.warn(`[Onboarding] Failed to send onboarding completion email: ${emailError.message}`);
        }
      }
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
   * Send onboarding started email notification
   * @param {Object} data - Email data
   * @private
   */
  async sendOnboardingStartedEmail(data) {
    try {
      await this.apiService.sendTemplateEmail({
        template_id: 'discord-onboarding-started',
        recipient_email: data.email || `${data.username}@discord.placeholder`, // Would need to collect email
        variables: {
          username: data.username,
          campaign_name: data.campaignName,
          guild_name: data.guildName
        }
      });
      this.logger.info(`[Onboarding] Onboarding started email sent for user ${data.userId}`);
    } catch (error) {
      this.logger.error(`[Onboarding] Failed to send onboarding started email: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Send onboarding completion email notification
   * @param {Object} data - Email data
   * @private
   */
  async sendOnboardingCompletionEmail(data) {
    try {
      // Extract email from responses if available
      let recipientEmail = data.email;
      if (!recipientEmail && data.responses) {
        recipientEmail = Object.values(data.responses).find(value => 
          typeof value === 'string' && value.includes('@') && value.includes('.')
        );
      }
      
      if (!recipientEmail) {
        this.logger.warn(`[Onboarding] No email found for user ${data.userId}, skipping completion email`);
        return;
      }

      await this.apiService.sendTemplateEmail({
        template_id: 'discord-onboarding-completion',
        recipient_email: recipientEmail,
        variables: {
          username: data.username,
          campaign_name: data.campaignName,
          guild_name: data.guildName
        }
      });
      this.logger.info(`[Onboarding] Onboarding completion email sent to ${recipientEmail} for user ${data.userId}`);
    } catch (error) {
      this.logger.error(`[Onboarding] Failed to send onboarding completion email: ${error.message}`);
      throw error;
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