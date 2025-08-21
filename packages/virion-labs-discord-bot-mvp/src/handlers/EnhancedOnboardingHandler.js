const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  SelectMenuBuilder
} = require('discord.js');
const { ApiService } = require('../services/ApiService');

class EnhancedOnboardingHandler {
  constructor(config, logger, apiService) {
    this.config = config;
    this.logger = logger;
    this.apiService = apiService || new ApiService(config, logger);
    
    // Enhanced caching for flow state
    this.questionsCache = new Map();
    this.flowStateCache = new Map();
    this.responsesCache = new Map();
  }

  /**
   * Handle start button - enhanced with flow initialization
   */
  async handleStartButton(interaction) {
    try {
      const parts = interaction.customId.split('_');
      const userId = parts[parts.length - 1];
      const campaignId = parts.slice(2, -1).join('_');

      this.logger.info(`[Enhanced Onboarding] User ${userId} clicked start for campaign ${campaignId}.`);

      if (interaction.user.id !== userId) {
        this.logger.warn(`[Enhanced Onboarding] User ${interaction.user.id} tried to click a button intended for ${userId}.`);
        return interaction.reply({ content: 'This button is not for you.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const campaignData = this.apiService.getCachedCampaign(campaignId);
      if (!campaignData) {
        this.logger.error(`[Enhanced Onboarding] No cached campaign data found for campaign ${campaignId}`);
        return interaction.editReply({ 
          content: 'Campaign information not found. Please try running /join again to refresh campaign data.' 
        });
      }

      const response = await this.apiService.startOnboarding(campaignId, userId, interaction.user.username);
      if (!response.success) {
        if (response.message && response.message.includes('already completed')) {
          this.logger.info(`[Enhanced Onboarding] User ${userId} has already completed onboarding for campaign ${campaignId}.`);
          return interaction.editReply({ content: `✅ ${response.message}` });
        }
        this.logger.error(`[Enhanced Onboarding] Failed to start for user ${userId}. API Response: ${JSON.stringify(response)}`);
        return interaction.editReply({ 
          content: 'An error occurred while trying to start the onboarding process. Please try again later.' 
        });
      }

      if (!response.data || !response.data.questions || response.data.questions.length === 0) {
        this.logger.warn(`[Enhanced Onboarding] No onboarding fields configured for campaign ${campaignId}.`);
        return interaction.editReply({
          content: '⚠️ This campaign has no onboarding fields configured. Please contact the campaign administrator.',
        });
      }

      // Use questions from business logic API (already filtered and sorted)
      const questions = response.data.questions;
      const stepGroups = this.groupQuestionsByStep(questions);
      
      // Initialize flow state
      const flowState = {
        campaign_id: campaignId,
        user_id: userId,
        current_step: 1,
        responses: {},
        visible_fields: questions.map(q => q.field_key),
        completed_steps: [],
        total_steps: Math.max(...Array.from(stepGroups.keys()))
      };

      // Cache everything
      const cacheKey = `${campaignId}_${userId}`;
      this.questionsCache.set(cacheKey, questions);
      this.flowStateCache.set(cacheKey, flowState);
      this.responsesCache.set(cacheKey, {});

      // Determine onboarding flow type
      const isMultiStep = stepGroups.size > 1;
      const firstStepQuestions = stepGroups.get(1) || [];

      if (isMultiStep) {
        await this.showMultiStepOnboardingStart(interaction, campaignData, flowState, firstStepQuestions);
      } else {
        await this.showSingleModalOnboarding(interaction, campaignData, questions, cacheKey);
      }

    } catch (error) {
      this.logger.error('❌ Error in EnhancedOnboardingHandler.handleStartButton:', error);
      
      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ content: 'An unexpected error occurred. Please try again.' });
        }
      } catch (replyError) {
        this.logger.error('❌ Failed to send start button error message:', replyError);
      }
    }
  }

  /**
   * Show multi-step onboarding start screen
   */
  async showMultiStepOnboardingStart(interaction, campaignData, flowState, firstStepQuestions) {
    const embed = new EmbedBuilder()
      .setTitle(`🚀 ${campaignData.name} - Multi-Step Onboarding`)
      .setColor('#6366f1')
      .setDescription(
        `This onboarding process has ${flowState.total_steps} steps.\n\n` +
        `**Step 1:** ${firstStepQuestions.length} question${firstStepQuestions.length > 1 ? 's' : ''}\n\n` +
        (campaignData.description || 'Ready to begin onboarding for this campaign.')
      );

    if (campaignData.requirements) {
      embed.addFields({ name: '📋 Requirements', value: campaignData.requirements, inline: false });
    }
    
    if (campaignData.reward_description) {
      embed.addFields({ name: '🎁 Rewards', value: campaignData.reward_description, inline: false });
    }

    embed.setFooter({ 
      text: `Step 1 of ${flowState.total_steps} • Click below to begin` 
    });

    const startStepButton = new ButtonBuilder()
      .setCustomId(`start_step_1_${flowState.campaign_id}_${flowState.user_id}`)
      .setLabel('Begin Step 1')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(startStepButton);

    await interaction.editReply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  }

  /**
   * Show single modal onboarding (fallback for simple flows)
   */
  async showSingleModalOnboarding(interaction, campaignData, questions, cacheKey) {
    const embed = new EmbedBuilder()
      .setTitle(`🚀 ${campaignData.name}`)
      .setColor('#6366f1')
      .setDescription(campaignData.description || 'Ready to begin onboarding for this campaign.');

    if (campaignData.requirements) {
      embed.addFields({ name: '📋 Requirements', value: campaignData.requirements, inline: false });
    }
    
    if (campaignData.reward_description) {
      embed.addFields({ name: '🎁 Rewards', value: campaignData.reward_description, inline: false });
    }

    embed.setFooter({ text: 'Click the button below to begin the onboarding process.' });

    const openModalButton = new ButtonBuilder()
      .setCustomId(`open_onboarding_modal_${cacheKey}`)
      .setLabel('Begin Onboarding')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(openModalButton);

    await interaction.editReply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  }

  /**
   * Handle open modal button for single-step onboarding
   */
  async handleOpenModalButton(interaction) {
    try {
      const parts = interaction.customId.split('_');
      // Extract cacheKey from open_onboarding_modal_{cacheKey}
      const cacheKey = parts.slice(3).join('_');

      this.logger.info(`[Enhanced Onboarding] User clicked open modal button with cacheKey: ${cacheKey}`);

      const flowState = this.flowStateCache.get(cacheKey);
      const questions = this.questionsCache.get(cacheKey);

      if (!flowState || !questions) {
        return interaction.reply({
          content: 'Onboarding session expired. Please start over.',
          ephemeral: true
        });
      }

      const campaignData = this.apiService.getCachedCampaign(flowState.campaign_id);
      if (!campaignData) {
        this.logger.error(`[Enhanced Onboarding] No cached campaign data found for campaign ${flowState.campaign_id}`);
        return interaction.reply({
          content: 'Campaign information not found. Please try running /join again to refresh campaign data.',
          ephemeral: true
        });
      }

      // Show the onboarding modal
      await this.showOnboardingModal(interaction, questions, cacheKey);

    } catch (error) {
      this.logger.error('❌ Error in EnhancedOnboardingHandler.handleOpenModalButton:', error);

      try {
        if (!interaction.replied) {
          await interaction.reply({ 
            content: 'An unexpected error occurred. Please try again.',
            ephemeral: true
          });
        }
      } catch (replyError) {
        this.logger.error('❌ Failed to send open modal button error message:', replyError);
      }
    }
  }

  /**
   * Show the main onboarding modal
   */
  async showOnboardingModal(interaction, questions, cacheKey) {
    const modal = new ModalBuilder()
      .setCustomId(`onboarding_modal_${cacheKey}`)
      .setTitle('Campaign Onboarding');

    // Add up to 5 questions to the modal
    const modalQuestions = questions.slice(0, 5);
    
    modalQuestions.forEach(question => {
      const textInput = new TextInputBuilder()
        .setCustomId(question.field_key)
        .setLabel(question.field_label)
        .setStyle(this._getInputStyle(question.field_type))
        .setRequired(question.is_required || false);

      if (question.field_placeholder) {
        textInput.setPlaceholder(question.field_placeholder);
      }

      // Apply validation constraints
      if (question.validation_rules) {
        this._applyValidationConstraints(textInput, this._normalizeValidationRules(question.validation_rules));
      }

      modal.addComponents(new ActionRowBuilder().addComponents(textInput));
    });

    this.logger.info(`[Enhanced Onboarding] Showing onboarding modal with ${modalQuestions.length} questions.`);
    await interaction.showModal(modal);
  }

  /**
   * Handle onboarding modal submission
   */
  async handleModalSubmission(interaction) {
    try {
      const parts = interaction.customId.split('_');
      // Extract cacheKey from onboarding_modal_{cacheKey}
      const cacheKey = parts.slice(2).join('_');

      await interaction.deferReply({ ephemeral: true });

      const flowState = this.flowStateCache.get(cacheKey);
      const questions = this.questionsCache.get(cacheKey);
      const currentResponses = this.responsesCache.get(cacheKey) || {};

      if (!flowState || !questions) {
        return interaction.editReply({
          content: 'Onboarding session expired. Please start over.'
        });
      }

      // Collect responses from modal
      const responses = {};
      interaction.fields.fields.forEach((value, key) => {
        responses[key] = value.value;
      });

      // Validate responses
      const validationErrors = this.validateStepResponses(responses, questions);
      if (validationErrors.length > 0) {
        return interaction.editReply({
          content: `❌ Validation errors:\n${validationErrors.join('\n')}`
        });
      }

      // Update responses cache
      Object.assign(currentResponses, responses);
      this.responsesCache.set(cacheKey, currentResponses);

      // Update flow state
      flowState.responses = currentResponses;

      // Complete onboarding
      await this.completeOnboarding(interaction, flowState, currentResponses, cacheKey);

    } catch (error) {
      this.logger.error('❌ Error in EnhancedOnboardingHandler.handleModalSubmission:', error);

      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({
            content: 'An error occurred while processing your responses. Please try again.'
          });
        }
      } catch (replyError) {
        this.logger.error('❌ Failed to send modal submission error message:', replyError);
      }
    }
  }

  /**
   * Handle step start button
   */
  async handleStepStartButton(interaction) {
    try {
      const parts = interaction.customId.split('_');
      const stepNumber = parseInt(parts[2]);
      const userId = parts[parts.length - 1];
      const campaignId = parts.slice(3, -1).join('_');

      this.logger.info(`[Enhanced Onboarding] User ${userId} starting step ${stepNumber} for campaign ${campaignId}.`);

      const cacheKey = `${campaignId}_${userId}`;
      const flowState = this.flowStateCache.get(cacheKey);
      const questions = this.questionsCache.get(cacheKey);

      if (!flowState || !questions) {
        return interaction.reply({ 
          content: 'Onboarding session expired. Please start over.',
          ephemeral: true 
        });
      }

      // Update flow state
      flowState.current_step = stepNumber;
      this.flowStateCache.set(cacheKey, flowState);

      // Get questions for this step
      const stepQuestions = questions.filter(q => q.step_number === stepNumber);
      
      if (stepQuestions.length === 0) {
        return interaction.reply({ 
          content: 'No questions found for this step.',
          ephemeral: true 
        });
      }

      // Check if step questions can fit in a single modal (max 5)
      if (stepQuestions.length <= 5) {
        await this.showStepModal(interaction, stepNumber, stepQuestions, cacheKey);
      } else {
        await this.showStepWithComponents(interaction, stepNumber, stepQuestions, cacheKey);
      }

    } catch (error) {
      this.logger.error('❌ Error in EnhancedOnboardingHandler.handleStepStartButton:', error);
    }
  }

  /**
   * Show step questions in a modal
   */
  async showStepModal(interaction, stepNumber, questions, cacheKey) {
    const modal = new ModalBuilder()
      .setCustomId(`step_modal_${stepNumber}_${cacheKey}`)
      .setTitle(`Onboarding - Step ${stepNumber}`);

    questions.forEach(question => {
      const textInput = new TextInputBuilder()
        .setCustomId(question.field_key)
        .setLabel(question.field_label)
        .setStyle(this._getInputStyle(question.field_type))
        .setRequired(question.is_required || false);
      
      if (question.field_placeholder) {
        textInput.setPlaceholder(question.field_placeholder);
      }

      // Apply validation constraints
      if (question.validation_rules) {
        this._applyValidationConstraints(textInput, this._normalizeValidationRules(question.validation_rules));
      }
      
      modal.addComponents(new ActionRowBuilder().addComponents(textInput));
    });

    this.logger.info(`[Enhanced Onboarding] Showing step ${stepNumber} modal with ${questions.length} questions.`);
    await interaction.showModal(modal);
  }

  /**
   * Show step questions with interactive components (for >5 questions)
   */
  async showStepWithComponents(interaction, stepNumber, questions, cacheKey) {
    const embed = new EmbedBuilder()
      .setTitle(`Onboarding - Step ${stepNumber}`)
      .setDescription(`This step has ${questions.length} questions. We'll go through them one by one.`)
      .setColor('#6366f1')
      .setFooter({ text: 'Click the button below to answer the first question.' });

    const startQuestionsButton = new ButtonBuilder()
      .setCustomId(`start_questions_${stepNumber}_0_${cacheKey}`)
      .setLabel('Start Questions')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(startQuestionsButton);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  }

  /**
   * Handle individual question flow for steps with >5 questions
   */
  async handleQuestionFlow(interaction) {
    try {
      const parts = interaction.customId.split('_');
      const stepNumber = parseInt(parts[2]);
      const questionIndex = parseInt(parts[3]);
      const cacheKey = parts.slice(4).join('_');

      const questions = this.questionsCache.get(cacheKey);
      const stepQuestions = questions.filter(q => q.step_number === stepNumber);
      const currentQuestion = stepQuestions[questionIndex];

      if (!currentQuestion) {
        return interaction.reply({ 
          content: 'Question not found.',
          ephemeral: true 
        });
      }

      await this.showIndividualQuestionModal(interaction, currentQuestion, stepNumber, questionIndex, cacheKey);

    } catch (error) {
      this.logger.error('❌ Error in EnhancedOnboardingHandler.handleQuestionFlow:', error);
    }
  }

  /**
   * Show individual question modal
   */
  async showIndividualQuestionModal(interaction, question, stepNumber, questionIndex, cacheKey) {
    const modal = new ModalBuilder()
      .setCustomId(`question_modal_${stepNumber}_${questionIndex}_${cacheKey}`)
      .setTitle(`Question ${questionIndex + 1}`);

    const textInput = new TextInputBuilder()
      .setCustomId(question.field_key)
      .setLabel(question.field_label)
      .setStyle(this._getInputStyle(question.field_type))
      .setRequired(question.is_required || false);
    
    if (question.field_placeholder) {
      textInput.setPlaceholder(question.field_placeholder);
    }

    if (question.validation_rules) {
      this._applyValidationConstraints(textInput, question.validation_rules);
    }
    
    modal.addComponents(new ActionRowBuilder().addComponents(textInput));

    await interaction.showModal(modal);
  }

  /**
   * Handle step modal submission
   */
  async handleStepModalSubmission(interaction) {
    try {
      const parts = interaction.customId.split('_');
      const stepNumber = parseInt(parts[2]);
      const cacheKey = parts.slice(3).join('_');

      await interaction.deferReply({ ephemeral: true });

      const flowState = this.flowStateCache.get(cacheKey);
      const questions = this.questionsCache.get(cacheKey);
      const currentResponses = this.responsesCache.get(cacheKey) || {};

      if (!flowState || !questions) {
        return interaction.editReply({ 
          content: 'Onboarding session expired. Please start over.' 
        });
      }

      // Collect and validate step responses
      const stepResponses = {};
      const stepQuestions = questions.filter(q => q.step_number === stepNumber);
      
      interaction.fields.fields.forEach((value, key) => {
        stepResponses[key] = value.value;
      });

      // Validate responses
      const validationErrors = this.validateStepResponses(stepResponses, stepQuestions);
      if (validationErrors.length > 0) {
        return interaction.editReply({ 
          content: `❌ Validation errors:\n${validationErrors.join('\n')}` 
        });
      }

      // Update responses cache
      Object.assign(currentResponses, stepResponses);
      this.responsesCache.set(cacheKey, currentResponses);

      // Update flow state
      flowState.completed_steps.push(stepNumber);
      flowState.responses = currentResponses;

      // Assign step-specific roles
      const stepRolesAssigned = await this.assignStepRoles(interaction, stepNumber, stepQuestions, flowState);

      // Calculate next step using branching logic
      const nextStep = this.calculateNextStep(stepNumber, currentResponses, questions);

      if (nextStep && nextStep <= flowState.total_steps) {
        // Show next step
        await this.showNextStepOptions(interaction, nextStep, flowState, cacheKey, stepRolesAssigned);
      } else {
        // Complete onboarding
        await this.completeOnboarding(interaction, flowState, currentResponses, cacheKey);
      }

    } catch (error) {
      this.logger.error('❌ Error in EnhancedOnboardingHandler.handleStepModalSubmission:', error);
      
      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ 
            content: 'An error occurred while processing your responses. Please try again.' 
          });
        }
      } catch (replyError) {
        this.logger.error('❌ Failed to send step modal error message:', replyError);
      }
    }
  }

  /**
   * Handle individual question modal submission
   */
  async handleQuestionModalSubmission(interaction) {
    try {
      const parts = interaction.customId.split('_');
      const stepNumber = parseInt(parts[2]);
      const questionIndex = parseInt(parts[3]);
      const cacheKey = parts.slice(4).join('_');

      await interaction.deferReply({ ephemeral: true });

      const questions = this.questionsCache.get(cacheKey);
      const currentResponses = this.responsesCache.get(cacheKey) || {};
      const stepQuestions = questions.filter(q => q.step_number === stepNumber);
      const currentQuestion = stepQuestions[questionIndex];

      // Collect response
      const response = interaction.fields.get(currentQuestion.field_key).value;
      
      // Validate response
      const normalizedRules = this._normalizeValidationRules(currentQuestion.validation_rules || {});
      const validationResult = this.validateFieldResponse(response, normalizedRules);
      if (!validationResult.valid) {
        return interaction.editReply({ 
          content: `❌ ${validationResult.message}` 
        });
      }

      // Update responses
      currentResponses[currentQuestion.field_key] = response;
      this.responsesCache.set(cacheKey, currentResponses);

      const nextQuestionIndex = questionIndex + 1;
      
      if (nextQuestionIndex < stepQuestions.length) {
        // Show next question
        await this.showNextQuestionButton(interaction, stepNumber, nextQuestionIndex, cacheKey);
      } else {
        // All questions in step completed
        await this.completeStep(interaction, stepNumber, currentResponses, cacheKey);
      }

    } catch (error) {
      this.logger.error('❌ Error in EnhancedOnboardingHandler.handleQuestionModalSubmission:', error);
    }
  }

  /**
   * Show next question button
   */
  async showNextQuestionButton(interaction, stepNumber, questionIndex, cacheKey) {
    const questions = this.questionsCache.get(cacheKey);
    const stepQuestions = questions.filter(q => q.step_number === stepNumber);
    const totalQuestions = stepQuestions.length;

    const embed = new EmbedBuilder()
      .setTitle(`Question ${questionIndex} Completed`)
      .setDescription(`Progress: ${questionIndex}/${totalQuestions} questions completed in this step.`)
      .setColor('#10b981')
      .setFooter({ text: 'Click below to continue to the next question.' });

    const nextButton = new ButtonBuilder()
      .setCustomId(`start_questions_${stepNumber}_${questionIndex}_${cacheKey}`)
      .setLabel(`Next Question (${questionIndex + 1}/${totalQuestions})`)
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(nextButton);

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  }

  /**
   * Complete a step and show next step options
   */
  async completeStep(interaction, stepNumber, responses, cacheKey) {
    const flowState = this.flowStateCache.get(cacheKey);
    const questions = this.questionsCache.get(cacheKey);

    // Update flow state
    flowState.completed_steps.push(stepNumber);
    flowState.responses = responses;
    this.flowStateCache.set(cacheKey, flowState);

    // Calculate next step
    const nextStep = this.calculateNextStep(stepNumber, responses, questions);

    if (nextStep && nextStep <= flowState.total_steps) {
      await this.showNextStepOptions(interaction, nextStep, flowState, cacheKey, []);
    } else {
      await this.completeOnboarding(interaction, flowState, responses, cacheKey);
    }
  }

  /**
   * Show next step options
   */
  async showNextStepOptions(interaction, nextStep, flowState, cacheKey, stepRolesAssigned = []) {
    const questions = this.questionsCache.get(cacheKey);
    const nextStepQuestions = questions.filter(q => q.step_number === nextStep);

    let description = `Great job! You've completed step ${flowState.current_step}.\n\n`;
    
    if (stepRolesAssigned.length > 0) {
      description += `🎉 **Roles Assigned:** ${stepRolesAssigned.join(', ')}\n\n`;
    }
    
    description += `**Next: Step ${nextStep}** (${nextStepQuestions.length} question${nextStepQuestions.length > 1 ? 's' : ''})\n\n`;
    description += `Progress: ${flowState.completed_steps.length}/${flowState.total_steps} steps completed`;

    const embed = new EmbedBuilder()
      .setTitle(`Step ${flowState.current_step} Completed! ✅`)
      .setDescription(description)
      .setColor('#10b981')
      .setFooter({ text: 'Click below to continue to the next step.' });

    const nextStepButton = new ButtonBuilder()
      .setCustomId(`start_step_${nextStep}_${flowState.campaign_id}_${flowState.user_id}`)
      .setLabel(`Continue to Step ${nextStep}`)
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(nextStepButton);

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(interaction, flowState, responses, cacheKey) {
    try {
      const payload = {
        campaign_id: flowState.campaign_id,
        discord_user_id: flowState.user_id,
        discord_username: interaction.user.username,
        responses,
      };

      this.logger.info(`[Enhanced Onboarding] Completing onboarding for user ${flowState.user_id}: ${JSON.stringify(payload, null, 2)}`);

      const response = await this.apiService.submitOnboarding(payload);
      
      if (!response.success) {
        this.logger.error(`[Enhanced Onboarding] API submission failed: ${JSON.stringify(response)}`);
        return interaction.editReply({ 
          content: '❌ Failed to submit onboarding. Please try again.' 
        });
      }

      let replyMessage = response.data.message;
      let rolesAssigned = false;

      // Assign target roles from campaign if onboarding was successful
      if (response.success) {
        const campaignData = this.apiService.getCachedCampaign(flowState.campaign_id);
        
        if (campaignData && campaignData.target_role_ids && campaignData.target_role_ids.length > 0) {
          try {
            const member = await interaction.guild.members.fetch(flowState.user_id);
            const assignedRoles = [];
            
            for (const roleId of campaignData.target_role_ids) {
              try {
                const role = await interaction.guild.roles.fetch(roleId);
                if (role && !member.roles.cache.has(roleId)) {
                  await member.roles.add(roleId);
                  assignedRoles.push(role.name);
                  this.logger.info(`[Enhanced Onboarding] ✅ Assigned role "${role.name}" to user ${flowState.user_id}`);
                }
              } catch (roleError) {
                this.logger.error(`[Enhanced Onboarding] ❌ Failed to assign role ${roleId}:`, roleError.message);
              }
            }
            
            if (assignedRoles.length > 0) {
              rolesAssigned = true;
              const roleNames = assignedRoles.join(', ');
              replyMessage += ` You have been granted the following role${assignedRoles.length > 1 ? 's' : ''}: ${roleNames}`;
            }
          } catch (memberError) {
            this.logger.error(`[Enhanced Onboarding] ❌ Failed to fetch member for role assignment:`, memberError.message);
          }
        }
      }

      // Send success message
      const embed = new EmbedBuilder()
        .setTitle('🎉 Onboarding Complete!')
        .setDescription(replyMessage)
        .setColor('#10b981')
        .addFields([
          { 
            name: '📊 Summary', 
            value: `Completed ${flowState.completed_steps.length} steps\nRoles assigned: ${rolesAssigned ? 'Yes' : 'No'}`,
            inline: true 
          }
        ])
        .setFooter({ text: 'Welcome to the campaign!' });

      await interaction.editReply({
        embeds: [embed],
        components: [],
      });

      // Send completion email if applicable
      if (response.success) {
        try {
          await this.sendOnboardingCompletionEmail({
            userId: flowState.user_id,
            username: interaction.user.username,
            campaignId: flowState.campaign_id,
            campaignName: campaignData?.name || 'Campaign',
            guildName: interaction.guild.name,
            responses: responses
          });
        } catch (emailError) {
          this.logger.warn(`[Enhanced Onboarding] Failed to send completion email: ${emailError.message}`);
        }
      }

      // Clean up caches
      this.questionsCache.delete(cacheKey);
      this.flowStateCache.delete(cacheKey);
      this.responsesCache.delete(cacheKey);

    } catch (error) {
      this.logger.error('❌ Error in EnhancedOnboardingHandler.completeOnboarding:', error);
      
      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ 
            content: 'An error occurred while completing your onboarding. Please contact support.' 
          });
        }
      } catch (replyError) {
        this.logger.error('❌ Failed to send completion error message:', replyError);
      }
    }
  }

  // Utility methods


  /**
   * Convert validation rules from object format to array format
   */
  _normalizeValidationRules(validationRules) {
    if (!validationRules || typeof validationRules !== 'object') {
      return [];
    }

    // If already an array, return as is
    if (Array.isArray(validationRules)) {
      return validationRules;
    }

    // Convert object format to array format
    const normalizedRules = [];

    if (validationRules.min_length !== undefined) {
      normalizedRules.push({
        type: 'min',
        value: validationRules.min_length,
        message: validationRules.error_message || `Minimum ${validationRules.min_length} characters required`
      });
    }

    if (validationRules.max_length !== undefined) {
      normalizedRules.push({
        type: 'max',
        value: validationRules.max_length,
        message: validationRules.error_message || `Maximum ${validationRules.max_length} characters allowed`
      });
    }

    // Handle other validation types that might be in object format
    if (validationRules.required === true) {
      normalizedRules.push({
        type: 'required',
        message: validationRules.error_message || 'This field is required'
      });
    }

    return normalizedRules;
  }

  /**
   * Group questions by step number
   */
  groupQuestionsByStep(questions) {
    const grouped = new Map();
    
    questions.forEach(question => {
      const step = question.step_number || 1;
      if (!grouped.has(step)) {
        grouped.set(step, []);
      }
      grouped.get(step).push(question);
    });

    return grouped;
  }

  /**
   * Validate step responses
   */
  validateStepResponses(responses, questions) {
    const errors = [];

    questions.forEach(question => {
      const value = responses[question.field_key];
      const normalizedRules = this._normalizeValidationRules(question.validation_rules || {});
      const validationResult = this.validateFieldResponse(value, normalizedRules);
      
      if (!validationResult.valid) {
        errors.push(`${question.field_label}: ${validationResult.message}`);
      }
    });

    return errors;
  }

  /**
   * Validate individual field response
   */
  validateFieldResponse(value, validationRules) {
    if (!validationRules || !Array.isArray(validationRules) || validationRules.length === 0) {
      return { valid: true };
    }

    for (const rule of validationRules) {
      const result = this._validateSingleRule(value, rule);
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true };
  }

  /**
   * Validate a single validation rule
   */
  _validateSingleRule(value, rule) {
    const stringValue = String(value || '');
    const numericValue = Number(value);
    
    switch (rule.type) {
      case 'required':
        if (!value || stringValue.trim() === '') {
          return { valid: false, message: rule.message || 'This field is required' };
        }
        break;

      case 'min':
        if (stringValue.length < Number(rule.value)) {
          return { 
            valid: false, 
            message: rule.message || `Minimum ${rule.value} characters required` 
          };
        }
        break;

      case 'max':
        if (stringValue.length > Number(rule.value)) {
          return { 
            valid: false, 
            message: rule.message || `Maximum ${rule.value} characters allowed` 
          };
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(stringValue)) {
          return { 
            valid: false, 
            message: rule.message || 'Must be a valid email address' 
          };
        }
        break;

      case 'contains':
        const searchValue = rule.case_sensitive ? stringValue : stringValue.toLowerCase();
        const targetValue = rule.case_sensitive ? String(rule.value) : String(rule.value).toLowerCase();
        if (!searchValue.includes(targetValue)) {
          return { 
            valid: false, 
            message: rule.message || `Must contain "${rule.value}"` 
          };
        }
        break;

      case 'greater_than':
        if (isNaN(numericValue) || numericValue <= Number(rule.value)) {
          return { 
            valid: false, 
            message: rule.message || `Must be greater than ${rule.value}` 
          };
        }
        break;

      case 'less_than':
        if (isNaN(numericValue) || numericValue >= Number(rule.value)) {
          return { 
            valid: false, 
            message: rule.message || `Must be less than ${rule.value}` 
          };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Calculate next step based on branching logic
   */
  calculateNextStep(currentStep, responses, allQuestions) {
    // Check if any questions in current step have branching logic
    const currentStepQuestions = allQuestions.filter(q => q.step_number === currentStep);
    
    for (const question of currentStepQuestions) {
      if (question.branching_logic && question.branching_logic.length > 0) {
        for (const branchRule of question.branching_logic) {
          if (this._evaluateCondition(responses, branchRule.condition)) {
            if (branchRule.action === 'skip_to_step' && branchRule.target_step) {
              return branchRule.target_step;
            }
          }
        }
      }
    }

    // Default: move to next sequential step
    const maxStep = Math.max(...allQuestions.map(q => q.step_number || 1));
    return currentStep < maxStep ? currentStep + 1 : null;
  }

  /**
   * Evaluate branching condition
   */
  _evaluateCondition(responses, condition) {
    const fieldValue = responses[condition.field_key];
    const stringValue = String(fieldValue || '');
    const numericValue = Number(fieldValue);

    switch (condition.operator) {
      case 'equals':
        const compareValue = condition.case_sensitive ? stringValue : stringValue.toLowerCase();
        const conditionValue = condition.case_sensitive ? String(condition.value) : String(condition.value).toLowerCase();
        return compareValue === conditionValue;

      case 'contains':
        const searchValue = condition.case_sensitive ? stringValue : stringValue.toLowerCase();
        const targetValue = condition.case_sensitive ? String(condition.value) : String(condition.value).toLowerCase();
        return searchValue.includes(targetValue);

      case 'greater_than':
        return !isNaN(numericValue) && numericValue > Number(condition.value);

      case 'less_than':
        return !isNaN(numericValue) && numericValue < Number(condition.value);

      case 'empty':
        return stringValue.trim() === '';

      case 'not_empty':
        return stringValue.trim() !== '';

      default:
        return false;
    }
  }

  /**
   * Apply validation constraints to Discord TextInputBuilder
   */
  _applyValidationConstraints(textInput, validationRules) {
    if (!Array.isArray(validationRules)) {
      return;
    }
    
    validationRules.forEach(rule => {
      switch (rule.type) {
        case 'min':
          textInput.setMinLength(Number(rule.value));
          break;
        case 'max':
          textInput.setMaxLength(Number(rule.value));
          break;
        case 'required':
          textInput.setRequired(true);
          break;
      }
    });
  }

  /**
   * Convert field types to Discord TextInputStyle
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

  /**
   * Send onboarding completion email notification
   */
  async sendOnboardingCompletionEmail(data) {
    try {
      let recipientEmail = data.email;
      if (!recipientEmail && data.responses) {
        recipientEmail = Object.values(data.responses).find(value => 
          typeof value === 'string' && value.includes('@') && value.includes('.')
        );
      }
      
      if (!recipientEmail) {
        this.logger.warn(`[Enhanced Onboarding] No email found for user ${data.userId}, skipping completion email`);
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
      
      this.logger.info(`[Enhanced Onboarding] Completion email sent to ${recipientEmail} for user ${data.userId}`);
    } catch (error) {
      this.logger.error(`[Enhanced Onboarding] Failed to send completion email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign roles specific to a completed step
   */
  async assignStepRoles(interaction, stepNumber, stepQuestions, flowState) {
    const assignedRoles = [];
    let allStepRoles = new Set();

    // Collect all step_role_ids from questions in this step
    stepQuestions.forEach(question => {
      if (question.step_role_ids && Array.isArray(question.step_role_ids)) {
        question.step_role_ids.forEach(roleId => {
          if (roleId && roleId.trim()) {
            allStepRoles.add(roleId.trim());
          }
        });
      }
    });

    if (allStepRoles.size === 0) {
      this.logger.info(`[Enhanced Onboarding] No step-specific roles configured for step ${stepNumber}`);
      return [];
    }

    try {
      const member = await interaction.guild.members.fetch(flowState.user_id);
      this.logger.info(`[Enhanced Onboarding] Assigning ${allStepRoles.size} step roles for step ${stepNumber} to user ${flowState.user_id}`);

      for (const roleId of allStepRoles) {
        try {
          const role = await interaction.guild.roles.fetch(roleId);
          if (!role) {
            this.logger.error(`[Enhanced Onboarding] Step role ${roleId} not found in guild`);
            continue;
          }

          if (member.roles.cache.has(roleId)) {
            this.logger.info(`[Enhanced Onboarding] User ${flowState.user_id} already has step role "${role.name}" (${roleId})`);
            continue;
          }

          // Check bot permissions
          const botMember = await interaction.guild.members.fetchMe();
          if (role.position >= botMember.roles.highest.position) {
            this.logger.error(`[Enhanced Onboarding] ❌ Cannot assign step role "${role.name}" (${roleId}) - insufficient permissions`);
            continue;
          }

          await member.roles.add(roleId);
          assignedRoles.push(role.name);
          this.logger.info(`[Enhanced Onboarding] ✅ Assigned step role "${role.name}" (${roleId}) to user ${flowState.user_id} for completing step ${stepNumber}`);

        } catch (roleError) {
          this.logger.error(`[Enhanced Onboarding] ❌ Failed to assign step role ${roleId}:`, {
            error: roleError.message,
            code: roleError.code,
            status: roleError.status
          });
        }
      }

    } catch (memberError) {
      this.logger.error(`[Enhanced Onboarding] ❌ Failed to fetch member ${flowState.user_id} for step role assignment:`, memberError.message);
    }

    return assignedRoles;
  }
}

module.exports = { EnhancedOnboardingHandler };