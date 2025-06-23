const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { InteractionUtils } = require('../utils/InteractionUtils');
const { AnalyticsService } = require('../services/AnalyticsService');

/**
 * Handles access request workflow with automatic approval via modal
 */
class RequestAccessHandler {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.analyticsService = new AnalyticsService(config, logger);
    this.dashboardApiUrl = config.api.dashboardUrl;
    
    // Cache for pending requests to prevent spam
    this.pendingRequests = new Map();
    
    // Configurable fields for future extension
    this.accessRequestFields = [
      {
        id: 'full_name',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true,
        minLength: 2,
        maxLength: 50
      },
      {
        id: 'email',
        label: 'Email Address',
        placeholder: 'Enter your email address',
        required: true,
        minLength: 5,
        maxLength: 100
      }
      // Future fields can be added here
    ];
  }

  /**
   * Handle access request submission - show modal for user info
   * @param {import('discord.js').ButtonInteraction} interaction 
   */
  async handleAccessRequestSubmission(interaction) {
    try {
      const userInfo = InteractionUtils.getUserInfo(interaction);
      const guildInfo = InteractionUtils.getGuildInfo(interaction);
      
      // Extract user ID from custom ID
      const userId = interaction.customId.split('_').pop();
      if (userId !== userInfo.id) {
        await InteractionUtils.safeReply(interaction, {
          content: '❌ You can only submit your own access requests.',
          ephemeral: true
        });
        return;
      }

      // Check if user already has a pending request
      const requestKey = `${guildInfo.id}_${userInfo.id}`;
      if (this.pendingRequests.has(requestKey)) {
        await InteractionUtils.safeReply(interaction, {
          content: '⏳ You already have a pending access request. Please wait for it to be processed.',
          ephemeral: true
        });
        return;
      }

      // Check if user already has the verified role
      const verifiedRoleId = this.config.discord_server.verifiedRoleId;
      if (verifiedRoleId && interaction.member.roles.cache.has(verifiedRoleId)) {
        await InteractionUtils.safeReply(interaction, {
          content: '✅ You already have access to private channels!',
          ephemeral: true
        });
        return;
      }

      // Show modal for user information
      const modal = this.createAccessRequestModal(userInfo.id);
      await interaction.showModal(modal);

      // Add to pending requests
      this.pendingRequests.set(requestKey, {
        userId: userInfo.id,
        username: userInfo.tag,
        guildId: guildInfo.id,
        timestamp: Date.now()
      });

      // Clean up old pending requests (older than 24 hours)
      this.cleanupOldRequests();

      // Track the interaction
      await this.analyticsService.trackInteraction(guildInfo.id, guildInfo.channelId, {
        author: { id: userInfo.id, tag: userInfo.tag },
        id: interaction.id,
        content: 'access_request_modal_shown'
      }, 'access_request_modal_display');

    } catch (error) {
      this.logger.error('❌ Error handling access request submission:', error);
      await this.handleError(interaction, 'Failed to show access request form. Please try again.');
    }
  }

  /**
   * Create the access request modal
   * @param {string} userId 
   * @returns {ModalBuilder}
   */
  createAccessRequestModal(userId) {
    const modal = new ModalBuilder()
      .setCustomId(`access_request_modal_${userId}`)
      .setTitle('Request Access to Private Channels');

    // Create text inputs based on configured fields
    const actionRows = this.accessRequestFields.map(field => {
      const textInput = new TextInputBuilder()
        .setCustomId(field.id)
        .setLabel(field.label)
        .setStyle(field.id === 'email' ? TextInputStyle.Short : TextInputStyle.Short)
        .setPlaceholder(field.placeholder)
        .setRequired(field.required);

      if (field.minLength) textInput.setMinLength(field.minLength);
      if (field.maxLength) textInput.setMaxLength(field.maxLength);

      return new ActionRowBuilder().addComponents(textInput);
    });

    modal.addComponents(...actionRows);
    return modal;
  }

  /**
   * Handle access request modal submission - automatically approve and assign role
   * @param {import('discord.js').ModalSubmitInteraction} interaction 
   */
  async handleAccessRequestModalSubmission(interaction) {
    try {
      await InteractionUtils.safeDefer(interaction, { ephemeral: true });

      const userInfo = InteractionUtils.getUserInfo(interaction);
      const guildInfo = InteractionUtils.getGuildInfo(interaction);
      
      // Extract user ID from custom ID
      const userId = interaction.customId.split('_').pop();
      if (userId !== userInfo.id) {
        await interaction.editReply({
          content: '❌ You can only submit your own access requests.'
        });
        return;
      }

      // Check if user already has the verified role
      const verifiedRoleId = this.config.discord_server.verifiedRoleId;
      if (verifiedRoleId && interaction.member.roles.cache.has(verifiedRoleId)) {
        await interaction.editReply({
          content: '✅ You already have access to private channels!'
        });
        return;
      }

      // Extract and validate form data
      const formData = this.extractFormData(interaction);
      const validationResult = this.validateFormData(formData);
      
      if (!validationResult.isValid) {
        await interaction.editReply({
          content: `❌ Please check your information:\n${validationResult.errors.join('\n')}`
        });
        return;
      }

      // Automatically assign the verified role
      const roleAssignmentResult = await this.assignVerifiedRole(interaction.member, formData);
      
      if (roleAssignmentResult.success) {
        // Send success message
        const embed = new EmbedBuilder()
          .setTitle('✅ Access Granted!')
          .setDescription(
            `Welcome ${formData.full_name}! You now have access to private channels.\n\n` +
            `**Your Information:**\n` +
            `• **Name:** ${formData.full_name}\n` +
            `• **Email:** ${formData.email}\n\n` +
            `You can now access all private channels and exclusive content! 🎉`
          )
          .setColor('#00ff00')
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Log the successful access grant
        this.logger.info(`✅ Automatically granted access to ${userInfo.tag} (${formData.full_name}, ${formData.email})`);

        // Remove from pending requests
        const requestKey = `${guildInfo.id}_${userInfo.id}`;
        this.pendingRequests.delete(requestKey);

        // Track the successful completion
        await this.analyticsService.trackInteraction(guildInfo.id, guildInfo.channelId, {
          author: { id: userInfo.id, tag: userInfo.tag },
          id: interaction.id,
          content: `access_granted_${formData.full_name}_${formData.email}`
        }, 'access_request_completed');

      } else {
        await interaction.editReply({
          content: `❌ Failed to assign access role: ${roleAssignmentResult.error}\n\nPlease contact an administrator for assistance.`
        });
      }

    } catch (error) {
      this.logger.error('❌ Error handling access request modal submission:', error);
      await this.handleError(interaction, 'Failed to process access request. Please try again.');
    }
  }

  /**
   * Extract form data from modal submission
   * @param {import('discord.js').ModalSubmitInteraction} interaction 
   * @returns {Object}
   */
  extractFormData(interaction) {
    const formData = {};
    
    this.accessRequestFields.forEach(field => {
      const value = interaction.fields.getTextInputValue(field.id);
      formData[field.id] = value?.trim() || '';
    });

    return formData;
  }

  /**
   * Validate form data
   * @param {Object} formData 
   * @returns {Object}
   */
  validateFormData(formData) {
    const errors = [];

    this.accessRequestFields.forEach(field => {
      const value = formData[field.id];
      
      if (field.required && (!value || value.length === 0)) {
        errors.push(`• ${field.label} is required`);
        return;
      }

      if (value && field.minLength && value.length < field.minLength) {
        errors.push(`• ${field.label} must be at least ${field.minLength} characters`);
      }

      if (value && field.maxLength && value.length > field.maxLength) {
        errors.push(`• ${field.label} must be no more than ${field.maxLength} characters`);
      }

      // Email validation
      if (field.id === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`• Please enter a valid email address`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Assign verified role to user
   * @param {import('discord.js').GuildMember} member 
   * @param {Object} formData 
   * @returns {Promise<Object>}
   */
  async assignVerifiedRole(member, formData) {
    try {
      const verifiedRoleId = this.config.discord_server.verifiedRoleId;
      if (!verifiedRoleId) {
        return { success: false, error: 'No verified role configured' };
      }

      const role = member.guild.roles.cache.get(verifiedRoleId);
      if (!role) {
        return { success: false, error: `Verified role not found: ${verifiedRoleId}` };
      }

      if (member.roles.cache.has(verifiedRoleId)) {
        return { success: true, message: 'User already has the verified role' };
      }

      await member.roles.add(role);
      this.logger.info(`✅ Assigned verified role ${role.name} to ${member.user.tag} (${formData.full_name})`);
      
      // Store the access request in database
      await this.storeAccessRequest({
        discord_user_id: member.user.id,
        discord_username: member.user.tag,
        discord_guild_id: member.guild.id,
        full_name: formData.full_name,
        email: formData.email,
        verified_role_id: verifiedRoleId
      });
      
      return { success: true };

    } catch (error) {
      this.logger.error('❌ Error assigning verified role:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store access request response in database
   * @param {Object} requestData 
   * @returns {Promise<boolean>}
   */
  async storeAccessRequest(requestData) {
    try {
      this.logger.debug(`💾 Storing access request for ${requestData.discord_username}`);
      
      const response = await fetch(`${this.dashboardApiUrl}/access-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify({
          discord_user_id: requestData.discord_user_id,
          discord_username: requestData.discord_username,
          discord_guild_id: requestData.discord_guild_id,
          full_name: requestData.full_name,
          email: requestData.email,
          verified_role_id: requestData.verified_role_id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.logger.info(`✅ Stored access request in database for ${requestData.discord_username} (${requestData.full_name})`);
      
      return true;
      
    } catch (error) {
      this.logger.error('❌ Error storing access request to database:', error);
      // Don't fail the role assignment if database storage fails
      this.logger.warn('⚠️ Role assignment succeeded but database storage failed - user still has access');
      return false;
    }
  }

  /**
   * Handle access request cancellation
   * @param {import('discord.js').ButtonInteraction} interaction 
   */
  async handleAccessRequestCancellation(interaction) {
    try {
      const userInfo = InteractionUtils.getUserInfo(interaction);
      
      // Extract user ID from custom ID
      const userId = interaction.customId.split('_').pop();
      if (userId !== userInfo.id) {
        await InteractionUtils.safeReply(interaction, {
          content: '❌ You can only cancel your own requests.',
          ephemeral: true
        });
        return;
      }

      await InteractionUtils.safeReply(interaction, {
        content: '❌ Access request cancelled.',
        ephemeral: true,
        components: []
      });

    } catch (error) {
      this.logger.error('❌ Error handling access request cancellation:', error);
    }
  }

  /**
   * Clean up old pending requests
   */
  cleanupOldRequests() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > maxAge) {
        this.pendingRequests.delete(key);
        this.logger.debug(`🧹 Cleaned up old pending request for ${request.username}`);
      }
    }
  }

  /**
   * Handle interaction errors
   * @param {import('discord.js').Interaction} interaction 
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

  /**
   * Get handler statistics
   * @returns {Object}
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      configuredRoleId: this.config.discord_server.verifiedRoleId,
      configuredChannelId: this.config.discord_server.requestAccessChannelId,
      configuredFields: this.accessRequestFields.length
    };
  }

  /**
   * Add new field to access request form (for future extension)
   * @param {Object} fieldConfig 
   */
  addAccessRequestField(fieldConfig) {
    this.accessRequestFields.push(fieldConfig);
    this.logger.info(`➕ Added new access request field: ${fieldConfig.label}`);
  }

  /**
   * Update existing field configuration (for future extension)
   * @param {string} fieldId 
   * @param {Object} updates 
   */
  updateAccessRequestField(fieldId, updates) {
    const fieldIndex = this.accessRequestFields.findIndex(f => f.id === fieldId);
    if (fieldIndex !== -1) {
      this.accessRequestFields[fieldIndex] = { ...this.accessRequestFields[fieldIndex], ...updates };
      this.logger.info(`🔄 Updated access request field: ${fieldId}`);
    }
  }
}

module.exports = { RequestAccessHandler }; 