const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { InteractionUtils } = require('../utils/InteractionUtils');
const { CampaignService } = require('../services/CampaignService');
const { AnalyticsService } = require('../services/AnalyticsService');

/**
 * Handles the /join slash command - shows campaigns for the specific channel
 */
class JoinCommand {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize services
    this.campaignService = new CampaignService(config, logger);
    this.analyticsService = new AnalyticsService(config, logger);
  }

  /**
   * Execute the /join command
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

      this.logger.info(`🔗 Join command from ${userInfo.tag} in guild ${guildInfo.id}, channel ${guildInfo.channelId}`);
      
      // Fetch all active campaigns for this guild
      const allActiveCampaigns = await this.campaignService.getActiveCampaigns(guildInfo.id);
      
      if (!allActiveCampaigns || allActiveCampaigns.length === 0) {
        await interaction.editReply({
          content: '❌ No active campaigns found for this server.\n\n💡 Server administrators can set up campaigns through the dashboard.'
        });
        return;
      }

      // Filter campaigns to only show those that match the current channel
      // Only show campaigns that have a channel_id and it matches the current channel
      const channelCampaigns = allActiveCampaigns.filter(campaign => {
        // Only include campaigns that have a channel_id set and it matches the current channel
        return campaign.channel_id && campaign.channel_id === guildInfo.channelId;
      });

      if (channelCampaigns.length === 0) {
        // Check if there are active campaigns but none for this channel
        const channelMention = `<#${guildInfo.channelId}>`;
        await interaction.editReply({
          content: `❌ No active campaigns found for this channel (${channelMention}).\n\n💡 This server has ${allActiveCampaigns.length} active campaign${allActiveCampaigns.length !== 1 ? 's' : ''}, but none are configured for this specific channel.\n\n🔧 Server administrators can configure campaigns for this channel through the dashboard.`
        });
        return;
      }

      // Create and send the campaign selection interface
      const { embed, components } = this.createChannelCampaignSelection(channelCampaigns, userInfo, guildInfo);
      await interaction.editReply({ 
        embeds: [embed], 
        components: components 
      });

      // Track the interaction
      await this.analyticsService.trackInteraction(guildInfo.id, guildInfo.channelId, {
        author: { id: userInfo.id, tag: userInfo.tag },
        id: interaction.id,
        content: '/join'
      }, 'slash_command_join');

    } catch (error) {
      this.logger.error('❌ Error in join command:', error);
      await this.handleError(interaction, 'Failed to load channel campaigns. Please try again later.');
    }
  }

  /**
   * Create the channel-specific campaign selection interface
   * @param {Array} channelCampaigns 
   * @param {Object} userInfo 
   * @param {Object} guildInfo 
   * @returns {Object}
   */
  createChannelCampaignSelection(channelCampaigns, userInfo, guildInfo) {
    // Create the campaign selection embed
    const embed = new EmbedBuilder()
      .setTitle('🔗 Join Channel Campaigns')
      .setColor('#10b981')
      .setTimestamp();

    const channelMention = `<#${guildInfo.channelId}>`;
    let description = `Welcome ${userInfo.displayName}! Here are the active campaigns for ${channelMention}:\n\n`;
    
    channelCampaigns.forEach((campaign, index) => {
      description += `**${index + 1}.** ${campaign.campaign_name}\n`;
      if (campaign.description) {
        description += `   └ ${campaign.description.substring(0, 100)}${campaign.description.length > 100 ? '...' : ''}\n`;
      }
    });
    
    description += `\n💡 **Select a campaign below to start your journey!**`;
    
    embed.setDescription(description);
    embed.setFooter({ 
      text: `${channelCampaigns.length} active campaign${channelCampaigns.length !== 1 ? 's' : ''} in this channel` 
    });

    // Create buttons for each channel campaign (max 5 per row, max 25 total)
    const components = [];
    let currentRow = new ActionRowBuilder();
    let buttonCount = 0;

    channelCampaigns.slice(0, 25).forEach((campaign, index) => { // Discord max 25 components
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
        .setStyle(ButtonStyle.Success)
        .setEmoji('🔗');

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
          content: `❌ ${message}`,
          embeds: [],
          components: []
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          content: `❌ ${message}`,
          ephemeral: true
        });
      }
    } catch (error) {
      this.logger.error('❌ Failed to send error message:', error);
    }
  }
}

module.exports = { JoinCommand }; 