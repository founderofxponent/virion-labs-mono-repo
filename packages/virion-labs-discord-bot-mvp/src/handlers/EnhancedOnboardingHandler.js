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
   * Show enhanced multi-step onboarding start screen with progress indicators
   */
  async showMultiStepOnboardingStart(interaction, campaignData, flowState, firstStepQuestions) {
    // Create progress bar visualization
    const progressBar = this._createProgressBar(1, flowState.total_steps);
    
    // Analyze branching paths if present
    const hasBranchingLogic = firstStepQuestions.some(q => q.branching_logic && q.branching_logic.length > 0);
    const branchingInfo = hasBranchingLogic ? '\n🔀 *This onboarding includes smart branching - your path may vary based on your answers.*' : '';
    
    const embed = new EmbedBuilder()
      .setTitle(`🚀 ${campaignData.name} - Smart Onboarding`)
      .setColor('#6366f1')
      .setDescription(
        `${progressBar}\n\n` +
        `**Multi-step onboarding** with up to ${flowState.total_steps} steps.\n` +
        `**Step 1:** ${firstStepQuestions.length} question${firstStepQuestions.length > 1 ? 's' : ''}\n\n` +
        (campaignData.description || 'Ready to begin your personalized onboarding experience.') +
        branchingInfo
      );

    if (campaignData.requirements) {
      embed.addFields({ name: '📋 Requirements', value: campaignData.requirements, inline: false });
    }
    
    if (campaignData.reward_description) {
      embed.addFields({ name: '🎁 Rewards', value: campaignData.reward_description, inline: false });
    }

    // Add estimated completion time
    const estimatedTime = Math.ceil(flowState.total_steps * 1.5); // 1.5 minutes per step
    embed.addFields({
      name: '⏱️ Estimated Time',
      value: `${estimatedTime} minute${estimatedTime > 1 ? 's' : ''}`,
      inline: true
    });

    embed.setFooter({ 
      text: `Step 1 of ${flowState.total_steps} • Your onboarding journey begins here` 
    });

    const startStepButton = new ButtonBuilder()
      .setCustomId(`start_step_1_${flowState.campaign_id}_${flowState.user_id}`)
      .setLabel('🎯 Begin Step 1')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🚀');

    const row = new ActionRowBuilder().addComponents(startStepButton);

    await interaction.editReply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  }

  /**
   * Create a visual progress bar
   */
  _createProgressBar(currentStep, totalSteps) {
    const completed = '🟢';
    const current = '🔵'; 
    const pending = '⚪';
    
    let progressBar = '';
    for (let i = 1; i <= totalSteps; i++) {
      if (i < currentStep) {
        progressBar += completed;
      } else if (i === currentStep) {
        progressBar += current;
      } else {
        progressBar += pending;
      }
      if (i < totalSteps) progressBar += '━';
    }
    
    return `**Progress:** ${progressBar} (${currentStep}/${totalSteps})`;
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
    
    modalQuestions.forEach((question, index) => {
      // Convert non-text fields to text input format for Discord compatibility
      const convertedQuestion = this._convertFieldToTextInput(question);
      
      const textInput = new TextInputBuilder()
        .setCustomId(`${convertedQuestion.field_key}_${index}`)
        .setLabel(this._truncateLabel(convertedQuestion.field_label))
        .setStyle(this._getInputStyle(convertedQuestion.field_type))
        .setRequired(convertedQuestion.is_required || false);

      if (convertedQuestion.field_placeholder) {
        textInput.setPlaceholder(convertedQuestion.field_placeholder);
      }

      // Apply validation constraints - use converted field rules
      if (convertedQuestion.validation_rules) {
        this._applyValidationConstraints(textInput, this._normalizeValidationRules(convertedQuestion.validation_rules));
      }

      modal.addComponents(new ActionRowBuilder().addComponents(textInput));
    });

    this.logger.info(`[Enhanced Onboarding] Showing onboarding modal with ${modalQuestions.length} questions (converted for Discord compatibility).`);
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
        const originalKey = key.split('_').slice(0, -1).join('_');
        responses[originalKey] = value.value;
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

      // Get visible questions for this step based on branching logic
      const currentResponses = this.responsesCache.get(cacheKey) || {};
      const stepQuestions = this.getVisibleQuestionsForStep(stepNumber, questions, currentResponses);
      
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

    questions.forEach((question, index) => {
      // Convert non-text fields to text input format for Discord compatibility
      const convertedQuestion = this._convertFieldToTextInput(question);
      
      const textInput = new TextInputBuilder()
        .setCustomId(`${convertedQuestion.field_key}_${index}`)
        .setLabel(this._truncateLabel(convertedQuestion.field_label))
        .setStyle(this._getInputStyle(convertedQuestion.field_type))
        .setRequired(convertedQuestion.is_required || false);
      
      if (convertedQuestion.field_placeholder) {
        textInput.setPlaceholder(convertedQuestion.field_placeholder);
      }

      // Apply validation constraints - use converted field rules
      if (convertedQuestion.validation_rules) {
        this._applyValidationConstraints(textInput, this._normalizeValidationRules(convertedQuestion.validation_rules));
      }
      
      modal.addComponents(new ActionRowBuilder().addComponents(textInput));
    });

    this.logger.info(`[Enhanced Onboarding] Showing step ${stepNumber} modal with ${questions.length} questions (converted for Discord compatibility).`);
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
      const currentResponses = this.responsesCache.get(cacheKey) || {};
      const stepQuestions = this.getVisibleQuestionsForStep(stepNumber, questions, currentResponses);
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
    // Convert non-text fields to text input format for Discord compatibility
    const convertedQuestion = this._convertFieldToTextInput(question);
    
    const modal = new ModalBuilder()
      .setCustomId(`question_modal_${stepNumber}_${questionIndex}_${cacheKey}`)
      .setTitle(`Question ${questionIndex + 1}`);

    const textInput = new TextInputBuilder()
      .setCustomId(convertedQuestion.field_key)
      .setLabel(this._truncateLabel(convertedQuestion.field_label))
      .setStyle(this._getInputStyle(convertedQuestion.field_type))
      .setRequired(convertedQuestion.is_required || false);
    
    if (convertedQuestion.field_placeholder) {
      textInput.setPlaceholder(convertedQuestion.field_placeholder);
    }

    if (convertedQuestion.validation_rules) {
      this._applyValidationConstraints(textInput, this._normalizeValidationRules(convertedQuestion.validation_rules));
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
      const stepQuestions = this.getVisibleQuestionsForStep(stepNumber, questions, currentResponses);
      
      interaction.fields.fields.forEach((value, key) => {
        const originalKey = key.split('_').slice(0, -1).join('_');
        stepResponses[originalKey] = value.value;
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
      const stepQuestions = this.getVisibleQuestionsForStep(stepNumber, questions, currentResponses);
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
    const currentResponses = this.responsesCache.get(cacheKey) || {};
    const stepQuestions = this.getVisibleQuestionsForStep(stepNumber, questions, currentResponses);
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
   * Enhanced show next step options with progress and branching insights
   */
  async showNextStepOptions(interaction, nextStep, flowState, cacheKey, stepRolesAssigned = []) {
    const questions = this.questionsCache.get(cacheKey);
    const currentResponses = this.responsesCache.get(cacheKey) || {};
    const nextStepQuestions = this.getVisibleQuestionsForStep(nextStep, questions, currentResponses);
    
    // Create progress bar
    const progressBar = this._createProgressBar(nextStep, flowState.total_steps);
    
    // Analyze if branching occurred
    const expectedNextStep = flowState.current_step + 1;
    const skippedSteps = nextStep > expectedNextStep ? nextStep - expectedNextStep : 0;
    const branchingMessage = skippedSteps > 0 ? 
      `\n🔀 **Smart branching:** Skipped ${skippedSteps} step${skippedSteps > 1 ? 's' : ''} based on your answers!` : '';
    
    // Check for conditional fields in next step
    const hasConditionalFields = nextStepQuestions.some(q => 
      questions.some(allQ => allQ.branching_logic && allQ.branching_logic.length > 0 && 
        allQ.branching_logic.some(rule => rule.target_fields && rule.target_fields.includes(q.field_key)))
    );
    
    const conditionalInfo = hasConditionalFields ? 
      '\n💡 *Some questions in the next step may change based on your responses.*' : '';

    let description = `${progressBar}\n\n`;
    description += `✅ **Step ${flowState.current_step} Completed!**\n\n`;
    
    if (stepRolesAssigned.length > 0) {
      description += `🎉 **New Roles:** ${stepRolesAssigned.join(', ')}\n\n`;
    }
    
    description += `**Next: Step ${nextStep}** (${nextStepQuestions.length} question${nextStepQuestions.length > 1 ? 's' : ''})\n`;
    description += `**Progress:** ${flowState.completed_steps.length + 1}/${flowState.total_steps} steps completed`;
    description += branchingMessage + conditionalInfo;

    const embed = new EmbedBuilder()
      .setTitle(`🎯 Onboarding Progress`)
      .setDescription(description)
      .setColor('#10b981');

    // Add completion percentage
    const completionPercentage = Math.round(((flowState.completed_steps.length + 1) / flowState.total_steps) * 100);
    embed.addFields({
      name: '📊 Completion',
      value: `${completionPercentage}%`,
      inline: true
    });
    
    // Add estimated time remaining
    const remainingSteps = flowState.total_steps - (flowState.completed_steps.length + 1);
    const estimatedTimeRemaining = Math.ceil(remainingSteps * 1.5);
    if (estimatedTimeRemaining > 0) {
      embed.addFields({
        name: '⏱️ Estimated Time Left',
        value: `${estimatedTimeRemaining} minute${estimatedTimeRemaining > 1 ? 's' : ''}`,
        inline: true
      });
    }

    embed.setFooter({ 
      text: `Step ${nextStep} of ${flowState.total_steps} • Keep going, you're doing great!` 
    });

    const nextStepButton = new ButtonBuilder()
      .setCustomId(`start_step_${nextStep}_${flowState.campaign_id}_${flowState.user_id}`)
      .setLabel(`🎯 Continue to Step ${nextStep}`)
      .setStyle(ButtonStyle.Primary)
      .setEmoji('⏭️');

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
      const assignedRoles = [];

      // Assign target roles from campaign if onboarding was successful
      if (response.success) {
        const campaignData = this.apiService.getCachedCampaign(flowState.campaign_id);
        
        if (campaignData && campaignData.target_role_ids && campaignData.target_role_ids.length > 0) {
          try {
            const member = await interaction.guild.members.fetch(flowState.user_id);
            
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
            value: `Completed ${flowState.completed_steps.length} steps\nRoles assigned: ${assignedRoles.length > 0 ? assignedRoles.join(', ') : 'No'}`, 
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
   * Validate step responses - enhanced for text input compatibility
   */
  validateStepResponses(responses, questions) {
    const errors = [];

    questions.forEach(question => {
      const value = responses[question.field_key];
      const normalizedRules = this._normalizeValidationRules(question.validation_rules || {});
      const validationResult = this.validateFieldResponse(value, normalizedRules, question.field_type);
      
      if (!validationResult.valid) {
        errors.push(`${question.field_label}: ${validationResult.message}`);
      }
    });

    return errors;
  }

  /**
   * Validate individual field response - enhanced for text input compatibility
   */
  validateFieldResponse(value, validationRules, originalFieldType = 'text') {
    if (!validationRules || !Array.isArray(validationRules) || validationRules.length === 0) {
      return { valid: true };
    }

    // Add text input format validation based on original field type
    const formatValidation = this._validateTextInputFormat(value, originalFieldType);
    if (!formatValidation.valid) {
      return formatValidation;
    }

    for (const rule of validationRules) {
      const result = this._validateSingleRule(value, rule, originalFieldType);
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true };
  }

  /**
   * Validate text input format based on original field type
   */
  _validateTextInputFormat(value, originalFieldType) {
    const stringValue = String(value || '').trim();
    
    switch (originalFieldType) {
      case 'boolean':
        const lowerValue = stringValue.toLowerCase();
        if (stringValue && !['yes', 'no', 'true', 'false'].includes(lowerValue)) {
          return { 
            valid: false, 
            message: 'Please enter "yes" or "no"' 
          };
        }
        break;
        
      case 'number':
        if (stringValue && (isNaN(Number(stringValue)) || !isFinite(Number(stringValue)))) {
          return { 
            valid: false, 
            message: 'Please enter a valid number' 
          };
        }
        break;
        
      case 'email':
        if (stringValue) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(stringValue)) {
            return { 
              valid: false, 
              message: 'Please enter a valid email address' 
            };
          }
        }
        break;
        
      case 'url':
        if (stringValue) {
          try {
            new URL(stringValue);
          } catch (e) {
            return { 
              valid: false, 
              message: 'Please enter a valid URL (e.g., https://example.com)' 
            };
          }
        }
        break;
    }
    
    return { valid: true };
  }

  /**
   * Validate a single validation rule - enhanced for text input compatibility
   */
  _validateSingleRule(value, rule, originalFieldType = 'text') {
    const stringValue = String(value || '');
    let numericValue = Number(value);
    
    // Handle numeric validation for converted number fields
    if (originalFieldType === 'number') {
      numericValue = Number(stringValue);
      if (isNaN(numericValue)) {
        return { 
          valid: false, 
          message: 'Please enter a valid number' 
        };
      }
    }
    
    switch (rule.type) {
      case 'required':
        if (!value || stringValue.trim() === '') {
          return { valid: false, message: rule.message || 'This field is required' };
        }
        break;

      case 'min':
        if (originalFieldType === 'number') {
          if (numericValue < Number(rule.value)) {
            return { 
              valid: false, 
              message: rule.message || `Must be at least ${rule.value}` 
            };
          }
        } else {
          if (stringValue.length < Number(rule.value)) {
            return { 
              valid: false, 
              message: rule.message || `Minimum ${rule.value} characters required` 
            };
          }
        }
        break;

      case 'max':
        if (originalFieldType === 'number') {
          if (numericValue > Number(rule.value)) {
            return { 
              valid: false, 
              message: rule.message || `Must be no more than ${rule.value}` 
            };
          }
        } else {
          if (stringValue.length > Number(rule.value)) {
            return { 
              valid: false, 
              message: rule.message || `Maximum ${rule.value} characters allowed` 
            };
          }
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

      case 'pattern':
        try {
          const regex = new RegExp(rule.value);
          if (!regex.test(stringValue)) {
            return { 
              valid: false, 
              message: rule.message || 'Value does not match required format' 
            };
          }
        } catch (e) {
          this.logger.warn(`Invalid regex pattern: ${rule.value}`);
          return { valid: true }; // Skip invalid patterns
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Parse text input back to structured data for branching logic evaluation
   * This handles the conversion from Discord text inputs back to the expected data types
   */
  _parseTextInputToStructuredData(fieldKey, textValue) {
    if (!textValue || typeof textValue !== 'string') {
      return textValue;
    }
    
    const trimmedValue = textValue.trim();
    
    // Handle boolean text inputs (yes/no)
    if (trimmedValue.toLowerCase() === 'yes' || trimmedValue.toLowerCase() === 'true') {
      return true;
    }
    if (trimmedValue.toLowerCase() === 'no' || trimmedValue.toLowerCase() === 'false') {
      return false;
    }
    
    // Handle numeric text inputs
    const numericValue = Number(trimmedValue);
    if (!isNaN(numericValue) && isFinite(numericValue) && /^\d+(\.\d+)?$/.test(trimmedValue)) {
      return numericValue;
    }
    
    // Handle comma-separated multiselect values
    if (trimmedValue.includes(',')) {
      const arrayValue = trimmedValue
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      // Only return as array if we have multiple items
      if (arrayValue.length > 1) {
        return arrayValue;
      }
    }
    
    // Return as string (original value for select fields, etc.)
    return trimmedValue;
  }

  /**
   * Calculate next step based on enhanced branching logic
   */
  calculateNextStep(currentStep, responses, allQuestions) {
    this.logger.info(`[Enhanced Onboarding] Calculating next step from ${currentStep} with responses:`, JSON.stringify(responses, null, 2));
    
    // Check if any questions in current step have branching logic
    const currentStepQuestions = allQuestions.filter(q => q.step_number === currentStep);
    let nextStep = null;
    let highestPriority = -1;
    
    for (const question of currentStepQuestions) {
      if (question.branching_logic && question.branching_logic.length > 0) {
        this.logger.info(`[Enhanced Onboarding] Evaluating branching logic for field: ${question.field_key}`);
        
        for (const branchRule of question.branching_logic) {
          const priority = branchRule.priority || 0;
          let conditionMet = false;
          
          // Handle both new enhanced format and legacy format
          if (branchRule.actions && branchRule.actions.set_next_step) {
            // New enhanced format with actions
            if (branchRule.condition) {
              conditionMet = this._evaluateCondition(responses, branchRule.condition);
            } else if (branchRule.condition_group) {
              conditionMet = this._evaluateConditionGroup(responses, branchRule.condition_group);
            }
            
            if (conditionMet && priority > highestPriority) {
              nextStep = branchRule.actions.set_next_step.step_number;
              highestPriority = priority;
              this.logger.info(`[Enhanced Onboarding] Branch rule matched: ${branchRule.description || branchRule.id} - Next step: ${nextStep}`);
            }
          } else if (branchRule.action === 'skip_to_step' && branchRule.target_step) {
            // Legacy format support
            conditionMet = this._evaluateCondition(responses, branchRule.condition);
            
            if (conditionMet && priority > highestPriority) {
              nextStep = branchRule.target_step;
              highestPriority = priority;
              this.logger.info(`[Enhanced Onboarding] Legacy branch rule matched - Next step: ${nextStep}`);
            }
          }
        }
      }
    }
    
    // If no branching logic determined next step, move to next sequential step
    if (nextStep === null) {
      const maxStep = Math.max(...allQuestions.map(q => q.step_number || 1));
      nextStep = currentStep < maxStep ? currentStep + 1 : null;
      this.logger.info(`[Enhanced Onboarding] No branching logic applied, moving to sequential step: ${nextStep}`);
    } else {
      this.logger.info(`[Enhanced Onboarding] Branching logic determined next step: ${nextStep}`);
    }
    
    return nextStep;
  }

  /**
   * Enhanced evaluate branching condition with support for advanced operators
   * Now handles text input representations from converted Discord fields
   */
  _evaluateCondition(responses, condition) {
    if (!condition || !condition.field_key || !condition.operator) {
      this.logger.warn('Invalid condition provided to _evaluateCondition:', condition);
      return false;
    }
    
    const rawFieldValue = responses[condition.field_key];
    let fieldValue = rawFieldValue;
    let stringValue = String(fieldValue || '');
    const caseSensitive = condition.case_sensitive || false;
    
    // Convert text input representations back to structured data for evaluation
    fieldValue = this._parseTextInputToStructuredData(condition.field_key, rawFieldValue);
    stringValue = String(fieldValue || '');
    
    // Handle case sensitivity for string comparisons
    if (!caseSensitive && typeof fieldValue === 'string') {
      stringValue = stringValue.toLowerCase();
      if (typeof condition.value === 'string') {
        condition.value = condition.value.toLowerCase();
      }
    }
    
    // Parse numeric value
    const numericValue = parseFloat(fieldValue);
    const isNumeric = !isNaN(numericValue) && isFinite(numericValue);
    
    // Parse date value
    let dateValue = null;
    try {
      if (typeof fieldValue === 'string' && fieldValue) {
        // Try common date formats
        const formats = [
          /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, // YYYY-MM-DD HH:MM:SS
          /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
          /^\d{2}\/\d{2}\/\d{4}$/ // MM/DD/YYYY
        ];
        
        if (formats.some(format => format.test(fieldValue))) {
          dateValue = new Date(fieldValue);
          if (isNaN(dateValue)) dateValue = null;
        }
      } else if (fieldValue instanceof Date) {
        dateValue = fieldValue;
      }
    } catch (e) {
      // Invalid date, keep as null
    }

    switch (condition.operator) {
      // Basic operators
      case 'equals':
        return stringValue === String(condition.value);

      case 'not_equals':
        return stringValue !== String(condition.value);

      case 'contains':
        return stringValue.includes(String(condition.value));

      case 'not_contains':
        return !stringValue.includes(String(condition.value));

      case 'empty':
        return stringValue.trim() === '';

      case 'not_empty':
        return stringValue.trim() !== '';

      // String operators
      case 'starts_with':
        return stringValue.startsWith(String(condition.value));

      case 'ends_with':
        return stringValue.endsWith(String(condition.value));

      case 'matches_regex':
        try {
          const flags = caseSensitive ? '' : 'i';
          const regex = new RegExp(condition.value, flags);
          return regex.test(stringValue);
        } catch (e) {
          this.logger.warn(`Invalid regex pattern: ${condition.value}`);
          return false;
        }

      // Numeric operators
      case 'greater_than':
        if (isNumeric) {
          try {
            return numericValue > parseFloat(condition.value);
          } catch (e) {
            return false;
          }
        }
        return false;

      case 'less_than':
        if (isNumeric) {
          try {
            return numericValue < parseFloat(condition.value);
          } catch (e) {
            return false;
          }
        }
        return false;

      case 'greater_than_or_equal':
        if (isNumeric) {
          try {
            return numericValue >= parseFloat(condition.value);
          } catch (e) {
            return false;
          }
        }
        return false;

      case 'less_than_or_equal':
        if (isNumeric) {
          try {
            return numericValue <= parseFloat(condition.value);
          } catch (e) {
            return false;
          }
        }
        return false;

      case 'between':
        if (isNumeric && Array.isArray(condition.value) && condition.value.length === 2) {
          try {
            const [min, max] = condition.value.map(v => parseFloat(v));
            return min <= numericValue && numericValue <= max;
          } catch (e) {
            return false;
          }
        }
        return false;

      case 'not_between':
        if (isNumeric && Array.isArray(condition.value) && condition.value.length === 2) {
          try {
            const [min, max] = condition.value.map(v => parseFloat(v));
            return !(min <= numericValue && numericValue <= max);
          } catch (e) {
            return false;
          }
        }
        return false;

      // List/Array operators
      case 'in_list':
        if (Array.isArray(condition.value)) {
          return condition.value.includes(fieldValue) || 
                 condition.value.map(v => String(v)).includes(stringValue);
        }
        return false;

      case 'not_in_list':
        if (Array.isArray(condition.value)) {
          return !condition.value.includes(fieldValue) && 
                 !condition.value.map(v => String(v)).includes(stringValue);
        }
        return true;

      case 'array_contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(condition.value);
        }
        // Handle text input that represents array (comma-separated values)
        if (typeof fieldValue === 'string') {
          const arrayValue = fieldValue.split(',').map(item => item.trim());
          return arrayValue.includes(condition.value);
        }
        return false;

      case 'array_length_equals':
        if (Array.isArray(fieldValue)) {
          try {
            return fieldValue.length === parseInt(condition.value);
          } catch (e) {
            return false;
          }
        }
        // Handle text input that represents array (comma-separated values)
        if (typeof fieldValue === 'string') {
          const arrayValue = fieldValue.trim() ? fieldValue.split(',').map(item => item.trim()).filter(item => item.length > 0) : [];
          try {
            return arrayValue.length === parseInt(condition.value);
          } catch (e) {
            return false;
          }
        }
        return false;

      // Date operators
      case 'before_date':
        if (dateValue) {
          try {
            const targetDate = new Date(condition.value);
            return dateValue < targetDate;
          } catch (e) {
            return false;
          }
        }
        return false;

      case 'after_date':
        if (dateValue) {
          try {
            const targetDate = new Date(condition.value);
            return dateValue > targetDate;
          } catch (e) {
            return false;
          }
        }
        return false;

      case 'between_dates':
        if (dateValue && Array.isArray(condition.value) && condition.value.length === 2) {
          try {
            const [startDate, endDate] = condition.value.map(d => new Date(d));
            return startDate <= dateValue && dateValue <= endDate;
          } catch (e) {
            return false;
          }
        }
        return false;

      default:
        this.logger.warn(`Unknown condition operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Enhanced evaluate branching logic with support for complex conditions and nested logic
   */
  evaluateBranchingLogic(responses, branchingRules) {
    const visibleFields = new Set();
    const hiddenFields = new Set();
    const requiredFields = new Set();
    const fieldValues = {};
    let nextStep = null;
    const appliedRules = [];
    
    // Sort rules by priority (higher priority first)
    const sortedRules = branchingRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of sortedRules) {
      let conditionMet = false;
      
      // Handle enhanced condition formats
      if (rule.condition_group) {
        // Enhanced condition group format
        conditionMet = this._evaluateConditionGroup(responses, rule.condition_group);
      } else if (rule.condition) {
        // Single condition format
        conditionMet = this._evaluateCondition(responses, rule.condition);
      }

      if (conditionMet) {
        const ruleDescription = rule.description || rule.id || `Rule with priority: ${rule.priority || 0}`;
        appliedRules.push({
          id: rule.id,
          description: ruleDescription,
          priority: rule.priority || 0
        });
        
        // Handle enhanced actions format
        if (rule.actions && typeof rule.actions === 'object') {
          // Set field visibility
          if (rule.actions.set_field_visibility) {
            if (rule.actions.set_field_visibility.visible) {
              rule.actions.set_field_visibility.visible.forEach(field => {
                visibleFields.add(field);
                hiddenFields.delete(field);
              });
            }
            if (rule.actions.set_field_visibility.hidden) {
              rule.actions.set_field_visibility.hidden.forEach(field => {
                hiddenFields.add(field);
                visibleFields.delete(field);
              });
            }
          }
          
          // Set field requirements
          if (rule.actions.set_field_requirements) {
            if (rule.actions.set_field_requirements.required) {
              rule.actions.set_field_requirements.required.forEach(field => {
                requiredFields.add(field);
              });
            }
            if (rule.actions.set_field_requirements.optional) {
              rule.actions.set_field_requirements.optional.forEach(field => {
                requiredFields.delete(field);
              });
            }
          }
          
          // Set field values
          if (rule.actions.set_field_values) {
            Object.entries(rule.actions.set_field_values).forEach(([fieldKey, fieldConfig]) => {
              if (fieldConfig.value !== undefined) {
                fieldValues[fieldKey] = fieldConfig.value;
              }
              if (fieldConfig.dynamic_value && fieldConfig.dynamic_value.template) {
                // Handle dynamic templating
                let templateValue = fieldConfig.dynamic_value.template;
                if (fieldConfig.dynamic_value.variables) {
                  Object.entries(fieldConfig.dynamic_value.variables).forEach(([varKey, varTemplate]) => {
                    const actualValue = responses[varKey.replace(/[{}]/g, '')] || varTemplate;
                    templateValue = templateValue.replace(new RegExp(`\\{\\{${varKey.replace(/[{}]/g, '')}\\}\\}`, 'g'), actualValue);
                  });
                }
                fieldValues[fieldKey] = templateValue;
              }
              // Handle options filtering for select/multiselect fields
              if (fieldConfig.options_filter) {
                // This would be handled at render time, just store the filter
                fieldValues[`${fieldKey}_options_filter`] = fieldConfig.options_filter;
              }
            });
          }
          
          // Set next step
          if (rule.actions.set_next_step) {
            if (rule.actions.set_next_step.step_number !== undefined) {
              nextStep = rule.actions.set_next_step.step_number;
            }
          }
        }
      }
    }

    return {
      visibleFields: Array.from(visibleFields),
      hiddenFields: Array.from(hiddenFields),
      requiredFields: Array.from(requiredFields),
      fieldValues,
      nextStep,
      appliedRules
    };
  }

  /**
   * Evaluate a group of conditions with AND/OR logic and nested groups
   */
  _evaluateConditionGroup(responses, conditionGroup) {
    const logic = (conditionGroup.logic || 'AND').toUpperCase();
    const conditions = conditionGroup.conditions || [];
    const nestedGroups = conditionGroup.groups || [];
    
    const conditionResults = [];
    
    // Evaluate individual conditions
    for (const condition of conditions) {
      const result = this._evaluateCondition(responses, condition);
      conditionResults.push(result);
    }
    
    // Evaluate nested groups recursively
    for (const group of nestedGroups) {
      const result = this._evaluateConditionGroup(responses, group);
      conditionResults.push(result);
    }
    
    // If no conditions, return true (empty condition group is considered satisfied)
    if (conditionResults.length === 0) {
      return true;
    }
    
    // Apply logic operator
    if (logic === 'AND') {
      return conditionResults.every(result => result);
    } else if (logic === 'OR') {
      return conditionResults.some(result => result);
    } else {
      this.logger.warn(`Unknown logic operator: ${logic}, defaulting to AND`);
      return conditionResults.every(result => result);
    }
  }

  /**
   * Filter questions based on branching logic
   */
  getVisibleQuestionsForStep(stepNumber, allQuestions, responses) {
    const stepQuestions = allQuestions.filter(q => q.step_number === stepNumber);
    const visibleQuestions = [];

    for (const question of stepQuestions) {
      let isVisible = question.is_enabled !== false; // Default to enabled status

      // Check if any questions have branching logic that affects this question
      for (const otherQuestion of allQuestions) {
        if (otherQuestion.branching_logic && otherQuestion.branching_logic.length > 0) {
          for (const rule of otherQuestion.branching_logic) {
            let conditionMet = false;
            
            // Handle both legacy condition format and new condition_group format
            if (rule.condition_group) {
              conditionMet = this._evaluateConditionGroup(responses, rule.condition_group);
            } else if (rule.condition) {
              conditionMet = this._evaluateCondition(responses, rule.condition);
            }
            
            if (conditionMet) {
              // Handle actions
              if (rule.action === 'show' && rule.target_fields && rule.target_fields.includes(question.field_key)) {
                isVisible = true;
              } else if (rule.action === 'hide' && rule.target_fields && rule.target_fields.includes(question.field_key)) {
                isVisible = false;
              }
            }
          }
        }
      }

      if (isVisible) {
        visibleQuestions.push(question);
      }
    }

    return visibleQuestions;
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
   * Truncate label to fit Discord's 45-character limit for TextInputBuilder
   */
  _truncateLabel(label, maxLength = 45) {
    if (!label || typeof label !== 'string') {
      return label;
    }
    
    if (label.length <= maxLength) {
      return label;
    }
    
    // Log truncation for debugging
    this.logger.warn(`[Enhanced Onboarding] Truncating label from ${label.length} to ${maxLength} characters: "${label}"`);
    
    // Try to truncate at word boundary
    const truncated = label.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.6) { // Only use word boundary if it's not too short
      return truncated.substring(0, lastSpace) + '...';
    }
    
    // Fallback to character truncation
    return truncated + '...';
  }

  /**
   * Convert field types to Discord TextInputStyle - optimized for text inputs only
   */
  _getInputStyle(fieldType) {
    // For Discord compatibility, all fields use text input styles
    switch (fieldType) {
      case 'multiselect':
      case 'textarea':
        // Use paragraph style for fields that typically need more text
        return TextInputStyle.Paragraph;
      case 'text':
      case 'email':
      case 'number':
      case 'url':
      case 'select':
      case 'boolean':
      default:
        // Use short style for most fields
        return TextInputStyle.Short;
    }
  }

  /**
   * Convert non-text field types to text input compatible format
   */
  _convertFieldToTextInput(field) {
    let convertedField = { ...field };
    
    switch (field.field_type) {
      case 'select':
        convertedField = this._convertSelectToText(field);
        break;
      case 'multiselect':
        convertedField = this._convertMultiselectToText(field);
        break;
      case 'boolean':
        convertedField = this._convertBooleanToText(field);
        break;
      case 'number':
        convertedField = this._convertNumberToText(field);
        break;
      case 'email':
        convertedField = this._convertEmailToText(field);
        break;
      case 'url':
        convertedField = this._convertUrlToText(field);
        break;
      case 'text':
      case 'textarea':
      default:
        // Already text compatible
        break;
    }
    
    // Log conversion for debugging
    if (field.field_type !== 'text' && field.field_type !== 'textarea') {
      this.logger.info(`[Enhanced Onboarding] Converted ${field.field_type} field '${field.field_key}' to text input`);
    }
    
    return convertedField;
  }

  /**
   * Convert SELECT field to text input with option guidance
   */
  _convertSelectToText(field) {
    const options = field.field_options || [];
    let placeholder = '';
    let description = field.field_description || '';
    
    if (Array.isArray(options) && options.length > 0) {
      const optionValues = options.map(opt => {
        if (typeof opt === 'object' && opt.label && opt.value) {
          return opt.value;
        } else if (typeof opt === 'string') {
          return opt;
        }
        return '';
      }).filter(Boolean);
      
      // Show only the options in placeholder for space efficiency
      placeholder = optionValues.join(', ');
      
      // Include full guidance in description
      const optionText = optionValues.map(val => `"${val}"`).join(', ');
      description = description ? 
        `${description} Available options: ${optionText}` : 
        `Available options: ${optionText}`;
    }
    
    return {
      ...field,
      field_type: 'text', // Convert to text type
      field_placeholder: this._truncateText(placeholder, 100),
      field_description: this._truncateText(description, 200)
    };
  }

  /**
   * Convert MULTISELECT field to text input with comma-separation guidance
   */
  _convertMultiselectToText(field) {
    const options = field.field_options || [];
    let placeholder = '';
    let description = field.field_description || '';
    
    if (Array.isArray(options) && options.length > 0) {
      const optionValues = options.map(opt => {
        if (typeof opt === 'object' && opt.label && opt.value) {
          return opt.value;
        } else if (typeof opt === 'string') {
          return opt;
        }
        return '';
      }).filter(Boolean);
      
      const exampleText = optionValues.slice(0, 2).join(', ');
      
      // Show concise example in placeholder
      placeholder = `e.g., ${exampleText}`;
      
      // Include full guidance in description
      const optionText = optionValues.join(', ');
      description = description ? 
        `${description} Available options: ${optionText}. Enter multiple options separated by commas.` : 
        `Available options: ${optionText}. Enter multiple options separated by commas.`;
    } else {
      placeholder = 'comma, separated, values';
      description = description ? `${description} Enter multiple values separated by commas.` : 'Enter multiple values separated by commas.';
    }
    
    return {
      ...field,
      field_type: 'text', // Convert to text type
      field_placeholder: this._truncateText(placeholder, 100),
      field_description: this._truncateText(description, 200)
    };
  }

  /**
   * Convert BOOLEAN field to text input with Yes/No guidance
   */
  _convertBooleanToText(field) {
    let placeholder = 'yes or no';
    let description = field.field_description || '';
    description = description ? `${description} Enter "yes" or "no".` : 'Enter "yes" or "no".';
    
    return {
      ...field,
      field_type: 'text', // Convert to text type
      field_placeholder: placeholder,
      field_description: this._truncateText(description, 200)
    };
  }

  /**
   * Convert NUMBER field to text input with numeric guidance
   */
  _convertNumberToText(field) {
    let placeholder = '';
    let description = field.field_description || '';
    
    // Add validation hints if present
    const validationRules = field.validation_rules || {};
    if (validationRules.min !== undefined && validationRules.max !== undefined) {
      placeholder = `${validationRules.min}-${validationRules.max}`;
    } else if (validationRules.min !== undefined) {
      placeholder = `min: ${validationRules.min}`;
    } else if (validationRules.max !== undefined) {
      placeholder = `max: ${validationRules.max}`;
    } else {
      placeholder = 'number';
    }
    
    description = description ? `${description} Enter a number.` : 'Enter a number.';
    
    return {
      ...field,
      field_type: 'text', // Convert to text type
      field_placeholder: placeholder,
      field_description: this._truncateText(description, 200)
    };
  }

  /**
   * Convert EMAIL field to text input with email guidance
   */
  _convertEmailToText(field) {
    let placeholder = 'email@example.com';
    let description = field.field_description || '';
    description = description ? `${description} Enter a valid email address.` : 'Enter a valid email address.';
    
    return {
      ...field,
      field_type: 'text', // Convert to text type
      field_placeholder: placeholder,
      field_description: this._truncateText(description, 200)
    };
  }

  /**
   * Convert URL field to text input with URL guidance
   */
  _convertUrlToText(field) {
    let placeholder = 'https://example.com';
    let description = field.field_description || '';
    description = description ? `${description} Enter a valid URL.` : 'Enter a valid URL.';
    
    return {
      ...field,
      field_type: 'text', // Convert to text type
      field_placeholder: placeholder,
      field_description: this._truncateText(description, 200)
    };
  }

  /**
   * Truncate text to specified length while preserving words
   */
  _truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    
    const truncated = text.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.6) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
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