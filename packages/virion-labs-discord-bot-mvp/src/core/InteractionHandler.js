const { JoinCommand } = require('../commands/JoinCommand');
const { RequestAccessCommand } = require('../commands/RequestAccessCommand');
const { OnboardingHandler } = require('../handlers/OnboardingHandler');
const { RequestAccessHandler } = require('../handlers/RequestAccessHandler');

class InteractionHandler {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.joinCommand = new JoinCommand(config, logger);
    this.requestAccessCommand = new RequestAccessCommand(config, logger);
    this.onboardingHandler = new OnboardingHandler(config, logger);
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
    if (customId.startsWith('start_onboarding_')) {
      await this.onboardingHandler.handleStartButton(interaction);
    } else if (customId.startsWith('request_access_submit_')) {
      await this.requestAccessHandler.handleAccessRequestSubmission(interaction);
    }
  }

  async handleModal(interaction) {
    const { customId } = interaction;
    if (customId.startsWith('onboarding_modal_')) {
      await this.onboardingHandler.handleModalSubmission(interaction);
    } else if (customId.startsWith('access_request_modal_')) {
      await this.requestAccessHandler.handleModalSubmission(interaction);
    }
  }

  async handleGuildMemberAdd(member) {
    // In the refactored bot, this will call the API.
    // For the MVP, we'll just log it.
    this.logger.info(`👋 New member joined: ${member.user.tag}`);
  }
}

module.exports = { InteractionHandler };