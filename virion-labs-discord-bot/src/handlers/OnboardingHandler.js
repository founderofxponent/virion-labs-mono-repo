const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { InteractionUtils } = require('../utils/InteractionUtils');
const { CampaignService } = require('../services/CampaignService');
const { AnalyticsService } = require('../services/AnalyticsService');

/**
 * Handles onboarding-related interactions and processes
 */
class OnboardingHandler {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.dashboardApiUrl = config.api.dashboardUrl;
    
    // Initialize services
    this.campaignService = new CampaignService(config, logger);
    this.analyticsService = new AnalyticsService(config, logger);
    
    // Active modal sessions (in-memory store)
    this.modalSessions = new Map();
    
    // Session timeout (15 minutes)
    this.sessionTimeout = 15 * 60 * 1000;
    
    // Cleanup expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  /**
   * Handle start onboarding button interaction
   * @param {import('discord.js').ButtonInteraction} interaction 
   */
  async handleStartButton(interaction) {
    try {
      const userInfo = InteractionUtils.getUserInfo(interaction);
      const guildInfo = InteractionUtils.getGuildInfo(interaction);
      
      // Parse campaign ID from custom ID: start_onboarding_{campaignId}_{userId}
      const customIdParts = interaction.customId.split('_');
      const campaignId = customIdParts[2];
      const userId = customIdParts[3];
      
      // Verify user ID matches
      if (userId !== userInfo.id) {
        await InteractionUtils.safeReply(interaction, {
          content: '❌ This button is not for you. Please use `/start` to begin your own onboarding.',
          ephemeral: true
        });
        return;
      }

      this.logger.info(`🚀 Starting onboarding for ${userInfo.tag} in campaign ${campaignId}`);
      
      // Get campaign details
      const campaign = await this.campaignService.getCampaignById(campaignId);
      if (!campaign) {
        await InteractionUtils.safeReply(interaction, {
          content: '❌ Campaign not found. Please try again or contact an administrator.',
          ephemeral: true
        });
        return;
      }

      // Check if campaign is active
      if (!this.campaignService.isCampaignActive(campaign)) {
        await InteractionUtils.safeReply(interaction, {
          content: '❌ This campaign is no longer active. Please check `/campaigns` for available options.',
          ephemeral: true
        });
        return;
      }

      // Get or create onboarding session
      const session = await this.getOrCreateSession(campaignId, userInfo.id, userInfo.tag);
      
      if (!session.success) {
        await InteractionUtils.safeReply(interaction, {
          content: '❌ Failed to start onboarding session. Please try again later.',
          ephemeral: true
        });
        return;
      }

      // Check if already completed
      if (session.is_completed) {
        await this.showCompletionMessage(interaction, campaign);
        return;
      }

      // Check if no fields to fill
      if (!session.fields || session.fields.length === 0) {
        await this.completeOnboarding(interaction, campaign);
        return;
      }

      // Show onboarding modal (this must be the immediate response, no deferring)
      await this.showOnboardingModal(interaction, campaign, session);
      
    } catch (error) {
      this.logger.error('❌ Error handling start button:', error);
      await InteractionUtils.sendError(interaction, 'An error occurred while starting onboarding. Please try again.');
    }
  }

  /**
   * Handle modal submission
   * @param {import('discord.js').ModalSubmitInteraction} interaction 
   */
  async handleModalSubmission(interaction) {
    try {
      await InteractionUtils.safeDefer(interaction, { ephemeral: true });
      
      const userInfo = InteractionUtils.getUserInfo(interaction);
      const guildInfo = InteractionUtils.getGuildInfo(interaction);
      
      // Parse campaign ID from custom ID: onboarding_modal_{campaignId}_{userId}
      const customIdParts = interaction.customId.split('_');
      const campaignId = customIdParts[2];
      const userId = customIdParts[3];
      
      // Verify user ID matches
      if (userId !== userInfo.id) {
        await interaction.editReply({
          content: '❌ This form is not for you.'
        });
        return;
      }

      this.logger.info(`📝 Processing modal submission for ${userInfo.tag} in campaign ${campaignId}`);
      
      // Get campaign details
      const campaign = await this.campaignService.getCampaignById(campaignId);
      if (!campaign) {
        await interaction.editReply({
          content: '❌ Campaign not found. Please try again.'
        });
        return;
      }

      // Process form responses
      const responses = {};
      for (const [key, component] of interaction.fields.fields) {
        responses[key] = component.value;
      }

      this.logger.debug(`📋 Form responses:`, responses);

      // Get session data for field validation
      const sessionKey = `${campaignId}:${userInfo.id}`;
      const modalSession = this.modalSessions.get(sessionKey);
      
      // Pre-validate responses before sending to backend
      const validationResult = this.validateResponses(responses, modalSession?.fields || []);
      
      if (!validationResult.isValid) {
        // Show validation errors and re-prompt with corrected modal
        await this.showValidationErrorsAndReprompt(interaction, campaign, modalSession, validationResult.errors, responses);
        return;
      }

      // Save responses to database
      const saveResult = await this.saveAllResponses(campaignId, userInfo.id, userInfo.tag, responses);
      
      if (!saveResult.success) {
        // Parse backend validation errors and re-prompt if possible
        await this.handleBackendValidationErrors(interaction, campaign, modalSession, saveResult.error, responses);
        return;
      }

      // Check if onboarding is now complete
      if (saveResult.is_completed) {
        await this.completeOnboarding(interaction, campaign);
      } else {
        // More fields to fill (shouldn't happen with current modal system, but just in case)
        await interaction.editReply({
          content: '✅ Responses saved! Please continue with the remaining fields.'
        });
      }
      
    } catch (error) {
      this.logger.error('❌ Error handling modal submission:', error);
      await InteractionUtils.sendError(interaction, 'An error occurred while processing your submission. Please try again.');
    }
  }

  /**
   * Validate responses before submission
   * @param {Object} responses - User responses
   * @param {Array} fields - Field definitions
   * @returns {Object} - Validation result
   */
  validateResponses(responses, fields) {
    const errors = [];
    
    for (const [fieldKey, value] of Object.entries(responses)) {
      const field = fields.find(f => f.field_key === fieldKey);
      if (!field) continue;
      
      const validationResult = this.validateFieldValue(field, value);
      if (!validationResult.valid) {
        errors.push({
          field: fieldKey,
          label: field.field_label || fieldKey,
          message: validationResult.message,
          value: value
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Client-side field validation (mirrors backend validation)
   * @param {Object} field - Field definition
   * @param {string} value - Field value
   * @returns {Object} - Validation result
   */
  validateFieldValue(field, value) {
    // Check if required field is empty
    if (!value || value.trim() === '') {
      if (field.is_required) {
        return { valid: false, message: 'This field is required' };
      }
      return { valid: true, value: '' };
    }

    const trimmedValue = value.trim();

    switch (field.field_type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedValue)) {
          return { valid: false, message: 'Invalid format' };
        }
        break;

      case 'number':
        const num = parseFloat(trimmedValue);
        if (isNaN(num)) {
          return { valid: false, message: 'Please enter a valid number' };
        }
        break;

      case 'select':
        const options = field.field_options || [];
        if (options.length > 0) {
          // Check for case-insensitive match
          const matchingOption = options.find(option => 
            option.toLowerCase() === trimmedValue.toLowerCase()
          );
          
          if (!matchingOption) {
            // Allow custom input but log it
            this.logger.info(`Field ${field.field_key}: User entered "${trimmedValue}", available options: ${options.join(', ')}. Allowing custom input.`);
          }
        }
        break;

      case 'checkbox':
        const validCheckboxValues = ['yes', 'no', 'true', 'false', '1', '0'];
        if (!validCheckboxValues.includes(trimmedValue.toLowerCase())) {
          return { valid: false, message: 'Please answer with yes/no or true/false' };
        }
        break;

      case 'date':
        const date = new Date(trimmedValue);
        if (isNaN(date.getTime())) {
          return { valid: false, message: 'Please enter a valid date (YYYY-MM-DD format)' };
        }
        break;

      case 'url':
        try {
          new URL(trimmedValue);
        } catch {
          return { valid: false, message: 'Please enter a valid URL' };
        }
        break;
    }

    // Apply custom validation rules if any
    if (field.validation_rules) {
      const rules = field.validation_rules;
      
      if (rules.min_length && trimmedValue.length < rules.min_length) {
        return { valid: false, message: `Minimum length is ${rules.min_length} characters` };
      }
      
      if (rules.max_length && trimmedValue.length > rules.max_length) {
        return { valid: false, message: `Maximum length is ${rules.max_length} characters` };
      }
      
      if (rules.pattern) {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(trimmedValue)) {
          return { valid: false, message: rules.pattern_message || 'Invalid format' };
        }
      }
    }

    return { valid: true, value: trimmedValue };
  }

  /**
   * Show validation errors and re-prompt with modal
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   * @param {Object} campaign
   * @param {Object} modalSession
   * @param {Array} errors
   * @param {Object} previousResponses
   */
  async showValidationErrorsAndReprompt(interaction, campaign, modalSession, errors, previousResponses) {
    try {
      // Create error message
      const errorMessage = errors.map(err => `• **${err.label}**: ${err.message}`).join('\n');
      
      await interaction.editReply({
        content: `❌ **Please correct the following errors and try again:**\n\n${errorMessage}\n\n*Tip: Check the format requirements for each field.*`
      });

      // Wait a moment for user to read the error, then show modal again
      setTimeout(async () => {
        try {
          await this.showOnboardingModalWithPreviousValues(interaction, campaign, modalSession, previousResponses, errors);
        } catch (error) {
          this.logger.error('❌ Error re-showing modal after validation error:', error);
        }
      }, 3000);

    } catch (error) {
      this.logger.error('❌ Error showing validation errors:', error);
      await interaction.editReply({
        content: '❌ There were validation errors in your submission. Please try again.'
      });
    }
  }

  /**
   * Handle backend validation errors
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   * @param {Object} campaign
   * @param {Object} modalSession
   * @param {string} errorMessage
   * @param {Object} previousResponses
   */
  async handleBackendValidationErrors(interaction, campaign, modalSession, errorMessage, previousResponses) {
    try {
      // Parse validation errors from backend response
      const errors = this.parseBackendValidationErrors(errorMessage, modalSession?.fields || []);
      
      if (errors.length > 0) {
        await this.showValidationErrorsAndReprompt(interaction, campaign, modalSession, errors, previousResponses);
      } else {
        await interaction.editReply({
          content: `❌ ${errorMessage}\n\nPlease try again.`
        });
      }
    } catch (error) {
      this.logger.error('❌ Error handling backend validation errors:', error);
      await interaction.editReply({
        content: '❌ Failed to save your responses. Please try again.'
      });
    }
  }

  /**
   * Parse backend validation error messages
   * @param {string} errorMessage
   * @param {Array} fields
   * @returns {Array} Parsed errors
   */
  parseBackendValidationErrors(errorMessage, fields) {
    const errors = [];
    
    // Extract individual validation errors from the message
    // Format: "Validation errors: Field Name: Error message, Another Field: Another error"
    if (errorMessage.includes('Validation errors:')) {
      const errorsText = errorMessage.replace('Validation errors:', '').trim();
      const errorPairs = errorsText.split(', ');
      
      for (const errorPair of errorPairs) {
        const colonIndex = errorPair.indexOf(':');
        if (colonIndex > 0) {
          const fieldLabel = errorPair.substring(0, colonIndex).trim();
          const errorMsg = errorPair.substring(colonIndex + 1).trim();
          
          // Find the field by label
          const field = fields.find(f => f.field_label === fieldLabel);
          
          errors.push({
            field: field?.field_key || fieldLabel.toLowerCase().replace(/\s+/g, '_'),
            label: fieldLabel,
            message: errorMsg,
            value: ''
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * Show onboarding modal with previous values and error highlighting
   * @param {import('discord.js').Interaction} interaction 
   * @param {Object} campaign 
   * @param {Object} modalSession
   * @param {Object} previousResponses
   * @param {Array} errors
   */
  async showOnboardingModalWithPreviousValues(interaction, campaign, modalSession, previousResponses = {}, errors = []) {
    try {
      const userInfo = InteractionUtils.getUserInfo(interaction);
      const fields = modalSession?.fields || [];
      
      if (fields.length === 0) {
        return;
      }

      // Create new modal with error context
      const modal = new ModalBuilder()
        .setCustomId(`onboarding_modal_${campaign.id}_${userInfo.id}`)
        .setTitle(`Join ${campaign.campaign_name}`);

      // Add fields to modal with previous values and error indicators
      for (const field of fields.slice(0, 5)) { // Discord limit of 5 fields
        const hasError = errors.some(err => err.field === field.field_key);
        const previousValue = previousResponses[field.field_key] || '';
        
        const textInput = new TextInputBuilder()
          .setCustomId(field.field_key)
          .setLabel(this.getFieldLabelWithValidation(field, hasError))
          .setStyle(field.field_type === 'long_text' ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(field.is_required || false)
          .setPlaceholder(this.getFieldPlaceholderWithHints(field, hasError));

        // Set previous value if available
        if (previousValue) {
          textInput.setValue(previousValue);
        }

        if (field.min_length) textInput.setMinLength(field.min_length);
        if (field.max_length) textInput.setMaxLength(field.max_length);

        const actionRow = new ActionRowBuilder().addComponents(textInput);
        modal.addComponents(actionRow);
      }

      // Show modal via followUp since this is called after initial interaction
      const followUpMessage = await interaction.followUp({
        content: '🔄 **Please fill out the form again with the corrections:**',
        ephemeral: true
      });

      // We need to create a button that triggers the modal since we can't show modal in followUp
      const retryButton = new ButtonBuilder()
        .setCustomId(`retry_onboarding_${campaign.id}_${userInfo.id}`)
        .setLabel('📝 Retry Form')
        .setStyle(ButtonStyle.Primary);

      const retryRow = new ActionRowBuilder().addComponents(retryButton);

      await interaction.editReply({
        content: `❌ **Please correct the following errors and click "Retry Form" below:**\n\n${errors.map(err => `• **${err.label}**: ${err.message}`).join('\n')}\n\n👇 **Click the button below to retry:**`,
        components: [retryRow]
      });

      // Store the modal data for the retry button
      this.storeModalSession(campaign.id, userInfo.id, {
        ...modalSession,
        previousResponses,
        validationErrors: errors,
        retryContext: true
      });

    } catch (error) {
      this.logger.error('❌ Error showing modal with previous values:', error);
      throw error;
    }
  }

  /**
   * Handle retry button for re-showing modal after validation errors
   * @param {import('discord.js').ButtonInteraction} interaction 
   */
  async handleRetryButton(interaction) {
    try {
      const userInfo = InteractionUtils.getUserInfo(interaction);
      
      // Parse campaign ID from custom ID: retry_onboarding_{campaignId}_{userId}
      const customIdParts = interaction.customId.split('_');
      const campaignId = customIdParts[2];
      const userId = customIdParts[3];
      
      // Verify user ID matches
      if (userId !== userInfo.id) {
        await InteractionUtils.safeReply(interaction, {
          content: '❌ This button is not for you.',
          ephemeral: true
        });
        return;
      }

      // Get campaign and session data
      const campaign = await this.campaignService.getCampaignById(campaignId);
      if (!campaign) {
        await InteractionUtils.safeReply(interaction, {
          content: '❌ Campaign not found. Please try again.',
          ephemeral: true
        });
        return;
      }

      const sessionKey = `${campaignId}:${userInfo.id}`;
      const modalSession = this.modalSessions.get(sessionKey);

      if (!modalSession) {
        await InteractionUtils.safeReply(interaction, {
          content: '❌ Session expired. Please start over with `/start`.',
          ephemeral: true
        });
        return;
      }

      // Show the modal again with previous values
      await this.showOnboardingModalForRetry(interaction, campaign, modalSession);
      
    } catch (error) {
      this.logger.error('❌ Error handling retry button:', error);
      await InteractionUtils.sendError(interaction, 'An error occurred. Please try again.');
    }
  }

  /**
   * Show modal for retry with previous values
   * @param {import('discord.js').ButtonInteraction} interaction
   * @param {Object} campaign
   * @param {Object} modalSession
   */
  async showOnboardingModalForRetry(interaction, campaign, modalSession) {
    try {
      const userInfo = InteractionUtils.getUserInfo(interaction);
      const fields = modalSession.fields || [];
      const previousResponses = modalSession.previousResponses || {};
      const errors = modalSession.validationErrors || [];
      
      if (fields.length === 0) {
        await InteractionUtils.safeReply(interaction, {
          content: '❌ No fields to fill. Please start over.',
          ephemeral: true
        });
        return;
      }

      // Create modal
      const modal = new ModalBuilder()
        .setCustomId(`onboarding_modal_${campaign.id}_${userInfo.id}`)
        .setTitle(`Join ${campaign.campaign_name}`);

      // Add fields to modal with previous values
      for (const field of fields.slice(0, 5)) {
        const hasError = errors.some(err => err.field === field.field_key);
        const previousValue = previousResponses[field.field_key] || '';
        
        const textInput = new TextInputBuilder()
          .setCustomId(field.field_key)
          .setLabel(this.getFieldLabelWithValidation(field, hasError))
          .setStyle(field.field_type === 'long_text' ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(field.is_required || false)
          .setPlaceholder(this.getFieldPlaceholderWithHints(field, hasError));

        // Set previous value if available
        if (previousValue) {
          textInput.setValue(previousValue);
        }

        if (field.min_length) textInput.setMinLength(field.min_length);
        if (field.max_length) textInput.setMaxLength(field.max_length);

        const actionRow = new ActionRowBuilder().addComponents(textInput);
        modal.addComponents(actionRow);
      }

      // Show modal
      await interaction.showModal(modal);
      
    } catch (error) {
      this.logger.error('❌ Error showing retry modal:', error);
      throw error;
    }
  }

  /**
   * Get field label with validation hints
   * @param {Object} field
   * @param {boolean} hasError
   * @returns {string}
   */
  getFieldLabelWithValidation(field, hasError) {
    let label = field.field_label || field.field_key;
    
    if (hasError) {
      label = `❌ ${label}`;
    }
    
    // Add format hints for specific field types
    switch (field.field_type) {
      case 'email':
        label += ' (Email format)';
        break;
      case 'date':
        label += ' (YYYY-MM-DD)';
        break;
      case 'url':
        label += ' (Valid URL)';
        break;
      case 'number':
        label += ' (Numbers only)';
        break;
    }
    
    return label;
  }

  /**
   * Get field placeholder with validation hints
   * @param {Object} field
   * @param {boolean} hasError
   * @returns {string}
   */
  getFieldPlaceholderWithHints(field, hasError) {
    let placeholder = field.placeholder;
    
    if (!placeholder) {
      switch (field.field_type) {
        case 'email':
          placeholder = 'example@domain.com';
          break;
        case 'date':
          placeholder = '2024-01-15';
          break;
        case 'url':
          placeholder = 'https://example.com';
          break;
        case 'number':
          placeholder = 'Enter a number';
          break;
        case 'select':
          if (field.field_options && field.field_options.length > 0) {
            placeholder = `Choose: ${field.field_options.slice(0, 3).join(', ')}${field.field_options.length > 3 ? '...' : ''}`;
          }
          break;
        default:
          placeholder = `Enter your ${field.field_label || field.field_key}`;
      }
    }
    
    if (hasError) {
      placeholder = `⚠️ ${placeholder}`;
    }
    
    return placeholder;
  }

  /**
   * Show onboarding modal
   * @param {import('discord.js').Interaction} interaction 
   * @param {Object} campaign 
   * @param {Object} session 
   */
  async showOnboardingModal(interaction, campaign, session) {
    try {
      const userInfo = InteractionUtils.getUserInfo(interaction);
      
      // Create modal
      const modal = new ModalBuilder()
        .setCustomId(`onboarding_modal_${campaign.id}_${userInfo.id}`)
        .setTitle(`Join ${campaign.campaign_name}`);

      // Get incomplete fields (up to 5 for Discord modal limit)
      const incompleteFields = this.getIncompleteFields(session).slice(0, 5);
      
      if (incompleteFields.length === 0) {
        await this.completeOnboarding(interaction, campaign);
        return;
      }

      // Add fields to modal with enhanced validation hints
      for (const field of incompleteFields) {
        const textInput = new TextInputBuilder()
          .setCustomId(field.field_key)
          .setLabel(this.getFieldLabelWithValidation(field, false))
          .setStyle(field.field_type === 'long_text' ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(field.is_required || false)
          .setPlaceholder(this.getFieldPlaceholderWithHints(field, false));

        if (field.min_length) textInput.setMinLength(field.min_length);
        if (field.max_length) textInput.setMaxLength(field.max_length);

        const actionRow = new ActionRowBuilder().addComponents(textInput);
        modal.addComponents(actionRow);
      }

      // Store session info for modal processing
      this.storeModalSession(campaign.id, userInfo.id, {
        fields: incompleteFields,
        campaign,
        startedAt: Date.now()
      });

      // Show modal
      await interaction.showModal(modal);
      
    } catch (error) {
      this.logger.error('❌ Error showing onboarding modal:', error);
      throw error;
    }
  }

  /**
   * Get or create onboarding session
   * @param {string} campaignId 
   * @param {string} userId 
   * @param {string} username 
   * @returns {Promise<Object>}
   */
  async getOrCreateSession(campaignId, userId, username) {
    try {
      this.logger.debug(`📋 Getting/creating onboarding session for ${username} in campaign ${campaignId}`);
      
      // First try to get existing session
      const getResponse = await fetch(`${this.dashboardApiUrl}/discord-bot/onboarding?campaign_id=${campaignId}&discord_user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        }
      });

      if (getResponse.ok) {
        const session = await getResponse.json();
        this.logger.debug(`✅ Retrieved existing session for ${username}`);
        return { ...session, success: true };
      }

      // Create new session
      this.logger.debug(`📝 Creating new onboarding session for ${username}`);
      const createResponse = await fetch(`${this.dashboardApiUrl}/discord-bot/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          discord_user_id: userId,
          discord_username: username
        })
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`HTTP ${createResponse.status}: ${errorText}`);
      }

      const newSession = await createResponse.json();
      this.logger.debug(`✅ Created new session for ${username}`);
      return { ...newSession, success: true };

    } catch (error) {
      this.logger.error('❌ Error getting/creating onboarding session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save all form responses
   * @param {string} campaignId 
   * @param {string} userId 
   * @param {string} username 
   * @param {Object} responses 
   * @returns {Promise<Object>}
   */
  async saveAllResponses(campaignId, userId, username, responses) {
    try {
      this.logger.debug(`💾 Saving all responses for ${username} in campaign ${campaignId}`);
      
      const response = await fetch(`${this.dashboardApiUrl}/discord-bot/onboarding/modal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          discord_user_id: userId,
          discord_username: username,
          responses: responses
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      this.logger.debug(`✅ Saved all responses for ${username}`);
      return { ...result, success: true };

    } catch (error) {
      this.logger.error('❌ Error saving responses:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete onboarding process
   * @param {import('discord.js').Interaction} interaction 
   * @param {Object} campaign 
   */
  async completeOnboarding(interaction, campaign) {
    const userInfo = InteractionUtils.getUserInfo(interaction);
    const guildInfo = InteractionUtils.getGuildInfo(interaction);
    
    // Create completion message
    const displayName = campaign.client_name || campaign.campaign_name || 'our community';
    let completionMessage = `🎉 **Welcome to ${displayName}!**\n\nThank you for completing the onboarding process!`;
    
    completionMessage += `\n\n✨ **What's next?**`;
    completionMessage += `\n• Explore our community channels`;
    completionMessage += `\n• Connect with other members`;
    completionMessage += `\n• Get exclusive campaign benefits`;

    const embed = new EmbedBuilder()
      .setTitle('🎉 Onboarding Complete!')
      .setDescription(completionMessage)
      .setColor('#00ff00')
      .setTimestamp();

    if (campaign.onboarding_completion_requirements?.completion_message) {
      embed.addFields([{
        name: '📋 Important',
        value: campaign.onboarding_completion_requirements.completion_message,
        inline: false
      }]);
    }

    await InteractionUtils.safeReply(interaction, { embeds: [embed], ephemeral: true });

    // Handle role assignment
    this.logger.debug(`🔍 Checking role assignment: auto_role_assignment=${campaign.auto_role_assignment}, target_role_ids=${JSON.stringify(campaign.target_role_ids)}`);
    
    if (campaign.auto_role_assignment && campaign.target_role_ids && campaign.target_role_ids.length > 0) {
      this.logger.info(`🎖️ Starting role assignment for ${userInfo.tag}: ${campaign.target_role_ids.length} roles`);
      await this.assignRoles(interaction, campaign.target_role_ids);
    } else {
      this.logger.warn(`⚠️ Role assignment skipped: auto_role_assignment=${campaign.auto_role_assignment}, target_role_ids=${JSON.stringify(campaign.target_role_ids)}`);
    }

    // Track completion
    await this.analyticsService.trackOnboardingCompletion(
      campaign.id, 
      guildInfo.id, 
      userInfo.id, 
      userInfo.tag
    );
  }

  /**
   * Show completion message for already completed onboarding
   * @param {import('discord.js').Interaction} interaction 
   * @param {Object} campaign 
   */
  async showCompletionMessage(interaction, campaign) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Already Completed')
      .setDescription(`You have already completed the onboarding process for **${campaign.campaign_name}**.\n\nWelcome back! If you need help, feel free to ask.`)
      .setColor('#00aa00')
      .setTimestamp();

    await InteractionUtils.safeReply(interaction, { embeds: [embed], ephemeral: true });
  }

  /**
   * Assign roles to user after onboarding completion
   * @param {import('discord.js').Interaction} interaction 
   * @param {Array} roleIds 
   */
  async assignRoles(interaction, roleIds) {
    try {
      if (!interaction.member || !Array.isArray(roleIds) || roleIds.length === 0) {
        return;
      }

      this.logger.info(`🎖️ Attempting to assign ${roleIds.length} roles to ${interaction.user.tag}`);
      
      let successfulRoles = [];
      let failedRoles = [];
      
      for (const roleId of roleIds) {
        try {
          const role = interaction.guild.roles.cache.get(roleId);
          if (!role) {
            failedRoles.push(`Role ID: ${roleId} (not found)`);
            continue;
          }
          
          if (interaction.member.roles.cache.has(roleId)) {
            successfulRoles.push(role.name);
            continue;
          }
          
          await interaction.member.roles.add(role);
          successfulRoles.push(role.name);
          this.logger.debug(`✅ Assigned role ${role.name} to ${interaction.user.tag}`);
          
        } catch (roleError) {
          this.logger.error(`❌ Error assigning role ${roleId}:`, roleError);
          const role = interaction.guild.roles.cache.get(roleId);
          failedRoles.push(`${role?.name || roleId} (${roleError.message})`);
        }
      }
      
      // Send feedback about role assignment
      if (successfulRoles.length > 0) {
        const roleEmbed = new EmbedBuilder()
          .setTitle('🎖️ Roles Assigned!')
          .setDescription(`You've been assigned:\n\n${successfulRoles.map(name => `• **${name}**`).join('\n')}`)
          .setColor('#00aa00')
          .setTimestamp();

        await interaction.followUp({ embeds: [roleEmbed], ephemeral: true });
      }
      
    } catch (error) {
      this.logger.error('❌ Error in assignRoles:', error);
    }
  }

  /**
   * Get incomplete fields from session
   * @param {Object} session 
   * @returns {Array}
   */
  getIncompleteFields(session) {
    if (!session.fields) return [];
    
    return session.fields.filter(field => {
      // Field is incomplete if it has no response or response is empty
      return !session.responses || !session.responses[field.field_key] || 
             session.responses[field.field_key].trim() === '';
    });
  }

  /**
   * Store modal session data
   * @param {string} campaignId 
   * @param {string} userId 
   * @param {Object} sessionData 
   */
  storeModalSession(campaignId, userId, sessionData) {
    const key = `${campaignId}:${userId}`;
    this.modalSessions.set(key, {
      ...sessionData,
      expiresAt: Date.now() + this.sessionTimeout
    });
  }

  /**
   * Clean up expired modal sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [key, session] of this.modalSessions) {
      if (session.expiresAt < now) {
        this.modalSessions.delete(key);
      }
    }
  }
}

module.exports = { OnboardingHandler }; 