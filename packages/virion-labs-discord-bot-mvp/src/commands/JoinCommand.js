const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ApiService } = require('../services/ApiService');

class JoinCommand {
  constructor(config, logger, apiService) {
    this.config = config;
    this.logger = logger;
    this.apiService = apiService || new ApiService(config, logger);
  }

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const joinCampaignsChannelId = this.config.discord.joinCampaignsChannelId;
      this.logger.info(`🔍 JoinCommand: Fetching campaigns for guild ${interaction.guildId}, channel ${interaction.channelId}, joinCampaignsChannel: ${joinCampaignsChannelId}`);
      
      const campaignsResponse = await this.apiService.getAvailableCampaigns(interaction.guildId, interaction.channelId, joinCampaignsChannelId);

      if (!campaignsResponse.campaigns || campaignsResponse.campaigns.length === 0) {
        this.logger.info('📭 No campaigns found in API response');
        return interaction.editReply('No active campaigns found.');
      }

      const campaigns = campaignsResponse.campaigns;
      this.logger.info(`📊 JoinCommand: Received ${campaigns.length} campaigns from API`);
      
      // Log all received campaigns
      campaigns.forEach((campaign, index) => {
        this.logger.info(`Campaign ${index + 1}: id=${campaign.id}, documentId=${campaign.documentId}, name="${campaign.name}"`);
      });

      const embed = new EmbedBuilder()
        .setTitle('🚀 Join a Campaign')
        .setDescription('Choose a campaign to start the onboarding process.')
        .setColor('#6366f1');

      const components = [];
      let currentRow = new ActionRowBuilder();
      const customIds = []; // Track custom IDs to detect duplicates

      campaigns.forEach((campaign, index) => {
        if (currentRow.components.length === 5) {
          components.push(currentRow);
          currentRow = new ActionRowBuilder();
        }
        
        const customId = `start_onboarding_${campaign.documentId}_${interaction.user.id}`;
        this.logger.info(`🔧 Creating button ${index + 1}: customId="${customId}", label="${campaign.name}"`);
        
        // Check for duplicate custom IDs
        if (customIds.includes(customId)) {
          this.logger.error(`⚠️  DUPLICATE CUSTOM ID DETECTED: "${customId}"`);
          this.logger.error(`This will cause Discord API error!`);
        }
        customIds.push(customId);
        
        currentRow.addComponents(
          new ButtonBuilder()
            .setCustomId(customId)
            .setLabel(campaign.name)
            .setStyle(ButtonStyle.Primary)
        );
      });
      components.push(currentRow);

      this.logger.info(`✅ JoinCommand: Created ${customIds.length} buttons with custom IDs: ${JSON.stringify(customIds)}`);
      this.logger.info(`🎯 Sending Discord message with ${components.length} action rows`);

      await interaction.editReply({ embeds: [embed], components });

    } catch (error) {
      this.logger.error('❌ Error in JoinCommand:', error);
      interaction.editReply('An error occurred while fetching campaigns.');
    }
  }
}

module.exports = { JoinCommand };