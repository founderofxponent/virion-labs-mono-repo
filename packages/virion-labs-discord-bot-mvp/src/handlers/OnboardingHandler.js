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
      
      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ content: 'An unexpected error occurred. Please try again.' });
        }
      } catch (replyError) {
        if (replyError.code === 10062) {
          this.logger.warn('⏰ Start button interaction expired before we could respond');
        } else {
          this.logger.error('❌ Failed to send start button error message:', replyError);
        }
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
    this.logger.info(`[Onboarding] Guild: ${interaction.guild.name} (${interaction.guild.id})`);
    this.logger.info(`[Onboarding] User: ${interaction.user.username} (${interaction.user.id})`);

    try {
      await interaction.deferReply({ ephemeral: true });

      const responses = {};
      interaction.fields.fields.forEach((value, key) => {
        responses[key] = value.value;
      });
      this.logger.info(`[Onboarding] Collected responses from user ${userId}: ${JSON.stringify(responses, null, 2)}`);

      const payload = {
        campaign_id: campaignId,
        discord_user_id: userId,
        discord_username: interaction.user.username,
        responses,
      };
      this.logger.info(`[Onboarding] Submitting payload for user ${userId}: ${JSON.stringify(payload, null, 2)}`);

      const response = await this.apiService.submitOnboarding(payload);
      this.logger.info(`[Onboarding] API response for user ${userId}: Success=${response.success}, Message=${response.data?.message}`);
      if (!response.success) {
        this.logger.error(`[Onboarding] API submission failed for user ${userId}: ${JSON.stringify(response)}`);
      }
      
      let replyMessage = response.data.message;
      let rolesAssigned = false;

      // Assign target roles from campaign if onboarding was successful
      if (response.success) {
        this.logger.info(`[Onboarding] Onboarding successful for user ${userId}, checking for role assignments`);
        const campaignData = this.apiService.getCachedCampaign(campaignId);
        
        if (!campaignData) {
          this.logger.warn(`[Onboarding] No campaign data found for campaign ${campaignId} - cannot assign roles`);
        } else {
          this.logger.info(`[Onboarding] Campaign data found: ${campaignData.name}`);
          this.logger.info(`[Onboarding] Target role IDs from campaign: ${JSON.stringify(campaignData.target_role_ids)}`);
          
          if (!campaignData.target_role_ids || campaignData.target_role_ids.length === 0) {
            this.logger.info(`[Onboarding] No target role IDs configured for campaign ${campaignId}`);
          } else {
            this.logger.info(`[Onboarding] Found ${campaignData.target_role_ids.length} target roles to assign`);
            
            try {
              this.logger.info(`[Onboarding] Attempting to fetch member ${userId} from guild ${interaction.guild.name} (${interaction.guild.id})`);
              const member = await interaction.guild.members.fetch(userId);
              this.logger.info(`[Onboarding] Successfully fetched member: ${member.user.username} (${member.id})`);
              this.logger.info(`[Onboarding] Member current roles: ${member.roles.cache.map(r => `${r.name} (${r.id})`).join(', ')}`);
              
              // Check bot permissions
              const botMember = await interaction.guild.members.fetchMe();
              this.logger.info(`[Onboarding] Bot member: ${botMember.user.username} (${botMember.id})`);
              this.logger.info(`[Onboarding] Bot has MANAGE_ROLES permission: ${botMember.permissions.has('ManageRoles')}`);
              this.logger.info(`[Onboarding] Bot roles: ${botMember.roles.cache.map(r => `${r.name} (${r.id})`).join(', ')}`);
              
              const assignedRoles = [];
              
              for (const roleId of campaignData.target_role_ids) {
                this.logger.info(`[Onboarding] Processing role assignment for role ID: ${roleId}`);
                
                try {
                  this.logger.info(`[Onboarding] Attempting to fetch role ${roleId} from guild`);
                  const role = await interaction.guild.roles.fetch(roleId);
                  
                  if (!role) {
                    this.logger.error(`[Onboarding] Role ${roleId} not found in guild ${interaction.guild.name}`);
                    continue;
                  }
                  
                  this.logger.info(`[Onboarding] Found role: "${role.name}" (${role.id})`);
                  this.logger.info(`[Onboarding] Role position: ${role.position}, Bot highest role position: ${botMember.roles.highest.position}`);
                  this.logger.info(`[Onboarding] Role managed: ${role.managed}, Role mentionable: ${role.mentionable}`);
                  
                  if (member.roles.cache.has(roleId)) {
                    this.logger.info(`[Onboarding] User ${userId} already has role "${role.name}" (${roleId})`);
                    continue;
                  }
                  
                  // Check if bot can assign this role
                  if (role.position >= botMember.roles.highest.position) {
                    this.logger.error(`[Onboarding] ❌ Cannot assign role "${role.name}" (${roleId}) - role position (${role.position}) is >= bot's highest role position (${botMember.roles.highest.position})`);
                    continue;
                  }
                  
                  this.logger.info(`[Onboarding] Attempting to add role "${role.name}" (${roleId}) to user ${userId}`);
                  await member.roles.add(roleId);
                  assignedRoles.push(role.name);
                  this.logger.info(`[Onboarding] ✅ Successfully assigned role "${role.name}" (${roleId}) to user ${userId}`);
                  
                } catch (roleError) {
                  this.logger.error(`[Onboarding] ❌ Failed to assign role ${roleId} to user ${userId}:`, {
                    error: roleError.message,
                    code: roleError.code,
                    status: roleError.status,
                    stack: roleError.stack
                  });
                }
              }
              
              this.logger.info(`[Onboarding] Role assignment completed. Total roles assigned: ${assignedRoles.length}`);
              
              if (assignedRoles.length > 0) {
                rolesAssigned = true;
                const roleNames = assignedRoles.join(', ');
                replyMessage += ` You have been granted the following role${assignedRoles.length > 1 ? 's' : ''}: ${roleNames}`;
                this.logger.info(`[Onboarding] Updated reply message with assigned roles: ${roleNames}`);
              } else {
                this.logger.warn(`[Onboarding] No roles were successfully assigned to user ${userId}`);
              }
              
            } catch (memberError) {
              this.logger.error(`[Onboarding] ❌ Failed to fetch member ${userId} for role assignment:`, {
                error: memberError.message,
                code: memberError.code,
                status: memberError.status,
                guildId: interaction.guild.id,
                guildName: interaction.guild.name,
                stack: memberError.stack
              });
            }
          }
        }
      } else {
        this.logger.warn(`[Onboarding] Onboarding was not successful for user ${userId}, skipping role assignment`);
      }

      this.logger.info(`[Onboarding] Successfully submitted for user ${userId}. Roles assigned: ${rolesAssigned}. Replying with: "${replyMessage}"`);      
      
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
      
      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply('An error occurred while submitting your onboarding information. Please try again.');
        }
      } catch (replyError) {
        if (replyError.code === 10062) {
          this.logger.warn('⏰ Onboarding interaction expired before we could respond');
        } else {
          this.logger.error('❌ Failed to send onboarding error message:', replyError);
        }
      }
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