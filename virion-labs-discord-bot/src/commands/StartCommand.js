const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { InteractionUtils } = require('../utils/InteractionUtils');
const { CampaignService } = require('../services/CampaignService');
const { AnalyticsService } = require('../services/AnalyticsService');

/**
 * Handles the /start slash command
 */
class StartCommand {
  constructor(config, logger, database) {
    this.config = config;
    this.logger = logger;
    this.database = database;
    
    // Initialize services
    this.campaignService = new CampaignService(config, logger, database);
    this.analyticsService = new AnalyticsService(config, logger, database);
  }

  /**
   * Execute the /start command
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async execute(interaction) {
    try {
      await InteractionUtils.safeDefer(interaction, { ephemeral: true });
      
      const guildInfo = InteractionUtils.getGuildInfo(interaction);
      const userInfo = InteractionUtils.getUserInfo(interaction);
      
      if (!guildInfo) {
        await interaction.editReply({
          content: '❌ This command can only be used in a server, not in DMs.'
        });
        return;
      }

      this.logger.info(`🚀 Start command from ${userInfo.tag} in guild ${guildInfo.id}, channel ${guildInfo.channelId}`);
      
      // Fetch all active campaigns for this guild
      const activeCampaigns = await this.campaignService.getActiveCampaigns(guildInfo.id);
      
      if (!activeCampaigns || activeCampaigns.length === 0) {
        await interaction.editReply({
          content: '❌ No active campaigns found for this server.\n\n💡 Server administrators can set up campaigns through the dashboard.'
        });
        return;
      }

      // Create and send the campaign selection interface
      const { embed, components } = this.createCampaignSelection(activeCampaigns, userInfo);
      await interaction.editReply({ 
        embeds: [embed], 
        components: components 
      });

      // Track the interaction
      await this.analyticsService.trackInteraction(guildInfo.id, guildInfo.channelId, {
        author: { id: userInfo.id, tag: userInfo.tag },
        id: interaction.id,
        content: '/start'
      }, 'slash_command_start');

    } catch (error) {
      this.logger.error('❌ Error in start command:', error);
      await this.handleError(interaction, 'Failed to load campaigns. Please try again later.');
    }
  }

  /**
   * Create the campaign selection interface
   * @param {Array} activeCampaigns 
   * @param {Object} userInfo 
   * @returns {Object}
   */
  createCampaignSelection(activeCampaigns, userInfo) {
    // Create the campaign selection embed
    const embed = new EmbedBuilder()
      .setTitle('🚀 Start Campaign Onboarding')
      .setColor('#6366f1')
      .setTimestamp();

    let description = `Welcome ${userInfo.displayName}! Choose a campaign to start your onboarding journey:\n\n`;
    
    activeCampaigns.forEach((campaign, index) => {
      description += `**${index + 1}.** ${campaign.campaign_name}\n`;
    });
    
    description += `\n💡 **Select a campaign below to begin!**`;
    
    embed.setDescription(description);
    embed.setFooter({ 
      text: `${activeCampaigns.length} active campaign${activeCampaigns.length !== 1 ? 's' : ''} available` 
    });

    // Create buttons for each active campaign (max 5 per row, max 25 total)
    const components = [];
    let currentRow = new ActionRowBuilder();
    let buttonCount = 0;

    activeCampaigns.slice(0, 25).forEach((campaign, index) => { // Discord max 25 components
      if (buttonCount === 5) {
        components.push(currentRow);
        currentRow = new ActionRowBuilder();
        buttonCount = 0;
      }

      const button = new ButtonBuilder()
        .setCustomId(`start_onboarding_${campaign.id}_${userInfo.id}`)
        .setLabel(campaign.campaign_name.length > 80 ? 
          campaign.campaign_name.substring(0, 77) + '...' : 
          campaign.campaign_name)
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🚀');

      currentRow.addComponents(button);
      buttonCount++;
    });

    if (buttonCount > 0) {
      components.push(currentRow);
    }

    return { embed, components };
  }

  /**
   * Handle command errors gracefully
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {string} message 
   */
  async handleError(interaction, message) {
    try {
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({
          content: `❌ ${message}`
        });
      } else if (!interaction.replied) {
        await InteractionUtils.sendError(interaction, message);
      } else {
        await interaction.followUp({
          content: `❌ ${message}`,
          ephemeral: true
        });
      }
    } catch (replyError) {
      this.logger.error('❌ Failed to send error reply:', replyError);
    }
  }
}

module.exports = { StartCommand }; 