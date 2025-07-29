const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ApiService } = require('../services/ApiService');

class JoinCommand {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.apiService = new ApiService(config, logger);
  }

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const joinCampaignsChannelId = this.config.discord.joinCampaignsChannelId;
      const campaignsResponse = await this.apiService.getAvailableCampaigns(interaction.guildId, interaction.channelId, joinCampaignsChannelId);

      if (!campaignsResponse.campaigns || campaignsResponse.campaigns.length === 0) {
        return interaction.editReply('No active campaigns found.');
      }

      const campaigns = campaignsResponse.campaigns;
      const embed = new EmbedBuilder()
        .setTitle('🚀 Join a Campaign')
        .setDescription('Choose a campaign to start the onboarding process.')
        .setColor('#6366f1');

      const components = [];
      let currentRow = new ActionRowBuilder();

      campaigns.forEach(campaign => {
        if (currentRow.components.length === 5) {
          components.push(currentRow);
          currentRow = new ActionRowBuilder();
        }
        currentRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`start_onboarding_${campaign.id}_${interaction.user.id}`)
            .setLabel(campaign.campaign_name)
            .setStyle(ButtonStyle.Primary)
        );
      });
      components.push(currentRow);

      await interaction.editReply({ embeds: [embed], components });

    } catch (error) {
      this.logger.error('❌ Error in JoinCommand:', error);
      interaction.editReply('An error occurred while fetching campaigns.');
    }
  }
}

module.exports = { JoinCommand };