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
      
      // Add timeout to API call to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API request timed out')), 10000)
      );
      
      const campaignsResponse = await Promise.race([
        this.apiService.getAvailableCampaigns(interaction.guildId, interaction.channelId, joinCampaignsChannelId),
        timeoutPromise
      ]);

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
      
      // Only try to respond if the interaction is still valid
      try {
        // Check if the interaction is still valid by testing if it's deferred/replied
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply('An error occurred while fetching campaigns. Please try again.');
        } else if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'An error occurred while fetching campaigns. Please try again.', ephemeral: true });
        }
      } catch (replyError) {
        // If we get error 10062 (Unknown interaction), the interaction has expired
        if (replyError.code === 10062) {
          this.logger.warn('⏰ Interaction expired before we could respond');
        } else {
          this.logger.error('❌ Failed to send error message to Discord:', replyError);
        }
      }
    }
  }
}

module.exports = { JoinCommand };