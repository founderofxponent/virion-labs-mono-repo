const { JoinCommand } = require('../commands/JoinCommand');
const { RequestAccessCommand } = require('../commands/RequestAccessCommand');
const { OnboardingHandler } = require('../handlers/OnboardingHandler');
const { EnhancedOnboardingHandler } = require('../handlers/EnhancedOnboardingHandler');
const { RequestAccessHandler } = require('../handlers/RequestAccessHandler');
const { ApiService } = require('../services/ApiService');

class InteractionHandler {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    // Create a shared ApiService instance
    this.apiService = new ApiService(config, logger);
    this.joinCommand = new JoinCommand(config, logger, this.apiService);
    this.requestAccessCommand = new RequestAccessCommand(config, logger);
    
    // Use enhanced onboarding handler by default, fallback to basic if needed
    this.useEnhancedOnboarding = config.features?.enhanced_onboarding !== false;
    
    if (this.useEnhancedOnboarding) {
      this.onboardingHandler = new EnhancedOnboardingHandler(config, logger, this.apiService);
      this.logger.info('🚀 Using Enhanced Onboarding Handler with validation and multi-step support');
    } else {
      this.onboardingHandler = new OnboardingHandler(config, logger, this.apiService);
      this.logger.info('📝 Using Basic Onboarding Handler');
    }
    
    this.requestAccessHandler = new RequestAccessHandler(config, logger);
  }

  async handle(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        await this.handleSlashCommand(interaction);
      } else if (interaction.isButton()) {
        await this.handleButton(interaction);
      } else if (interaction.isModalSubmit()) {
        await this.handleModal(interaction);
      }
    } catch (error) {
      this.logger.error('❌ Error handling interaction:', error);
    }
  }

  async handleSlashCommand(interaction) {
    const { commandName } = interaction;
    if (commandName === 'join') {
      await this.joinCommand.execute(interaction);
    } else if (commandName === 'request-access') {
      await this.requestAccessCommand.execute(interaction);
    }
  }

  async handleButton(interaction) {
    const { customId } = interaction;
    
    // Enhanced onboarding button handlers
    if (customId.startsWith('start_onboarding_')) {
      await this.onboardingHandler.handleStartButton(interaction);
    } else if (customId.startsWith('open_onboarding_modal_')) {
      if (this.useEnhancedOnboarding) {
        await this.onboardingHandler.handleOpenModalButton(interaction);
      } else {
        await this.onboardingHandler.handleOpenModalButton(interaction);
      }
    } else if (customId.startsWith('start_step_')) {
      if (this.useEnhancedOnboarding) {
        await this.onboardingHandler.handleStepStartButton(interaction);
      }
    } else if (customId.startsWith('start_questions_')) {
      if (this.useEnhancedOnboarding) {
        await this.onboardingHandler.handleQuestionFlow(interaction);
      }
    } else if (customId.startsWith('request_access_submit_')) {
      await this.requestAccessHandler.handleAccessRequestSubmission(interaction);
    }
  }

  async handleModal(interaction) {
    const { customId } = interaction;
    
    // Enhanced onboarding modal handlers
    if (customId.startsWith('onboarding_modal_')) {
      if (this.useEnhancedOnboarding) {
        await this.onboardingHandler.handleModalSubmission(interaction);
      } else {
        await this.onboardingHandler.handleModalSubmission(interaction);
      }
    } else if (customId.startsWith('step_modal_')) {
      if (this.useEnhancedOnboarding) {
        await this.onboardingHandler.handleStepModalSubmission(interaction);
      }
    } else if (customId.startsWith('question_modal_')) {
      if (this.useEnhancedOnboarding) {
        await this.onboardingHandler.handleQuestionModalSubmission(interaction);
      }
    } else if (customId.startsWith('access_request_modal_')) {
      await this.requestAccessHandler.handleModalSubmission(interaction);
    }
  }

  async handleGuildMemberAdd(member) {
    this.logger.info(`👋 New member joined: ${member.user.tag}`);
    
    // Send member joined email notification to administrators
    try {
      await this.sendMemberJoinedEmail({
        userId: member.user.id,
        username: member.user.tag,
        guildName: member.guild.name,
        joinedAt: new Date().toISOString()
      });
    } catch (emailError) {
      this.logger.warn(`[GuildMemberAdd] Failed to send member joined email: ${emailError.message}`);
    }
  }

  /**
   * Send member joined email notification to administrators
   * @param {Object} data - Email data
   * @private
   */
  async sendMemberJoinedEmail(data) {
    try {
      // Get admin emails from config or environment
      const adminEmails = this.config.admin?.emails || process.env.ADMIN_EMAILS?.split(',') || [];
      
      if (adminEmails.length === 0) {
        this.logger.warn('[GuildMemberAdd] No admin emails configured, skipping member joined notification');
        return;
      }

      // Send to each admin
      for (const adminEmail of adminEmails) {
        if (adminEmail.trim()) {
          await this.apiService.sendTemplateEmail({
            template_id: 'discord-member-joined',
            recipient_email: adminEmail.trim(),
            variables: {
              username: data.username,
              user_id: data.userId,
              guild_name: data.guildName,
              joined_at: new Date(data.joinedAt).toLocaleString(),
              invite_code: data.inviteCode || 'Unknown'
            }
          });
        }
      }
      
      this.logger.info(`[GuildMemberAdd] Member joined emails sent to ${adminEmails.length} administrators`);
    } catch (error) {
      this.logger.error(`[GuildMemberAdd] Failed to send member joined email: ${error.message}`);
      throw error;
    }
  }
}

module.exports = { InteractionHandler };