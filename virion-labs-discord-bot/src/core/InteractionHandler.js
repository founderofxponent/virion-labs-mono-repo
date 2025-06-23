const { InteractionUtils } = require('../utils/InteractionUtils');
const { CampaignsCommand } = require('../commands/CampaignsCommand');
const { StartCommand } = require('../commands/StartCommand');
const { OnboardingHandler } = require('../handlers/OnboardingHandler');

/**
 * Handles all Discord interactions (slash commands, buttons, modals)
 */
class InteractionHandler {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize command handlers
    this.campaignsCommand = new CampaignsCommand(config, logger);
    this.startCommand = new StartCommand(config, logger);
    this.onboardingHandler = new OnboardingHandler(config, logger);
  }

  /**
   * Main interaction handler - routes to appropriate handler
   * @param {import('discord.js').Interaction} interaction 
   */
  async handleInteraction(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        await this.handleSlashCommand(interaction);
      } else if (interaction.isButton()) {
        await this.handleButtonInteraction(interaction);
      } else if (interaction.isModalSubmit()) {
        await this.handleModalSubmission(interaction);
      } else if (interaction.isStringSelectMenu()) {
        await this.handleSelectMenuInteraction(interaction);
      } else {
        this.logger.warn(`⚠️ Unhandled interaction type: ${interaction.type}`);
      }
    } catch (error) {
      this.logger.error('❌ Error handling interaction:', error);
      await this.handleInteractionError(interaction, error);
    }
  }

  /**
   * Handle slash command interactions
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async handleSlashCommand(interaction) {
    const { commandName } = interaction;
    const userInfo = InteractionUtils.getUserInfo(interaction);
    const guildInfo = InteractionUtils.getGuildInfo(interaction);
    
    this.logger.info(`⚡ Slash command /${commandName} from ${userInfo.tag} in ${guildInfo?.name || 'DM'}`);

    // Route to appropriate command handler
    switch (commandName) {
      case 'campaigns':
        await this.campaignsCommand.execute(interaction);
        break;
      
      case 'start':
        await this.startCommand.execute(interaction);
        break;
      
      default:
        this.logger.error(`❌ Unknown slash command: ${commandName}`);
        await InteractionUtils.sendError(interaction, 'Unknown command. Use `/campaigns` to see available options.');
    }
  }

  /**
   * Handle button interactions
   * @param {import('discord.js').ButtonInteraction} interaction 
   */
  async handleButtonInteraction(interaction) {
    const { customId } = interaction;
    const userInfo = InteractionUtils.getUserInfo(interaction);
    
    this.logger.info(`🔘 Button interaction: ${customId} from ${userInfo.tag}`);

    // Route based on custom ID pattern
    if (customId.startsWith('start_onboarding_')) {
      await this.onboardingHandler.handleStartButton(interaction);
    } else if (customId.startsWith('retry_onboarding_')) {
      await this.onboardingHandler.handleRetryButton(interaction);
    } else {
      this.logger.warn(`⚠️ Unhandled button interaction: ${customId}`);
      await InteractionUtils.sendError(interaction, 'This button is no longer available.');
    }
  }

  /**
   * Handle modal submission interactions
   * @param {import('discord.js').ModalSubmitInteraction} interaction 
   */
  async handleModalSubmission(interaction) {
    const { customId } = interaction;
    const userInfo = InteractionUtils.getUserInfo(interaction);
    
    this.logger.info(`📝 Modal submission: ${customId} from ${userInfo.tag}`);

    // Route based on custom ID pattern
    if (customId.startsWith('onboarding_modal_')) {
      await this.onboardingHandler.handleModalSubmission(interaction);
    } else {
      this.logger.warn(`⚠️ Unhandled modal submission: ${customId}`);
      await InteractionUtils.sendError(interaction, 'This form is no longer available.');
    }
  }

  /**
   * Handle select menu interactions
   * @param {import('discord.js').StringSelectMenuInteraction} interaction 
   */
  async handleSelectMenuInteraction(interaction) {
    const { customId } = interaction;
    const userInfo = InteractionUtils.getUserInfo(interaction);
    
    this.logger.info(`📋 Select menu interaction: ${customId} from ${userInfo.tag}`);

    // Future: Add select menu handlers here
    this.logger.warn(`⚠️ Unhandled select menu interaction: ${customId}`);
    await InteractionUtils.sendError(interaction, 'This selection menu is no longer available.');
  }

  /**
   * Handle interaction errors gracefully
   * @param {import('discord.js').Interaction} interaction 
   * @param {Error} error 
   */
  async handleInteractionError(interaction, error) {
    const errorMessage = 'An error occurred while processing your request. Please try again.';
    
    try {
      if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isModalSubmit()) {
        await InteractionUtils.sendError(interaction, errorMessage);
      }
    } catch (replyError) {
      this.logger.error('❌ Failed to send error reply:', replyError);
    }
  }

  /**
   * Get interaction statistics
   * @returns {Object}
   */
  getStats() {
    return {
      handlersInitialized: {
        campaigns: !!this.campaignsCommand,
        start: !!this.startCommand,
        onboarding: !!this.onboardingHandler
      }
    };
  }
}

module.exports = { InteractionHandler }; 