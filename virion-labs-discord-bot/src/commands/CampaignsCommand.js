const { EmbedBuilder } = require('discord.js');
const { InteractionUtils } = require('../utils/InteractionUtils');
const { CampaignService } = require('../services/CampaignService');
const { AnalyticsService } = require('../services/AnalyticsService');

/**
 * Handles the /campaigns slash command
 */
class CampaignsCommand {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize services
    this.campaignService = new CampaignService(config, logger);
    this.analyticsService = new AnalyticsService(config, logger);
  }

  /**
   * Execute the /campaigns command
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

      this.logger.info(`📋 Campaigns command from ${userInfo.tag} in guild ${guildInfo.id}, channel ${guildInfo.channelId}`);
      
      // Fetch all campaigns for this guild
      const campaigns = await this.campaignService.getAllCampaigns(guildInfo.id);
      
      if (!campaigns || campaigns.length === 0) {
        await interaction.editReply({
          content: '📭 No campaigns are configured for this server yet.\n\n💡 Server administrators can set up campaigns through the dashboard.'
        });
        return;
      }

      // Create and send the campaigns embed
      const embed = this.createCampaignsEmbed(campaigns, guildInfo.name);
      await interaction.editReply({ embeds: [embed] });

      // Track the interaction
      await this.analyticsService.trackInteraction(guildInfo.id, guildInfo.channelId, {
        author: { id: userInfo.id, tag: userInfo.tag },
        id: interaction.id,
        content: '/campaigns'
      }, 'slash_command_campaigns');

    } catch (error) {
      this.logger.error('❌ Error in campaigns command:', error);
      await this.handleError(interaction, 'Failed to fetch campaigns. Please try again later.');
    }
  }

  /**
   * Create the campaigns embed
   * @param {Array} campaigns 
   * @param {string} guildName 
   * @returns {EmbedBuilder}
   */
  createCampaignsEmbed(campaigns, guildName) {
    // Group campaigns by status for better organization
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const pausedCampaigns = campaigns.filter(c => c.status === 'paused');
    const archivedCampaigns = campaigns.filter(c => c.status === 'archived');
    const inactiveCampaigns = campaigns.filter(c => c.status === 'inactive');

    // Create main embed
    const embed = new EmbedBuilder()
      .setTitle('🎯 Campaign Center')
      .setColor('#6366f1')
      .setTimestamp();

    let description = `Welcome to the campaign center! Here's what's available in **${guildName}**:\n\n`;

    // Add active campaigns section
    if (activeCampaigns.length > 0) {
      description += `## 🟢 Active Campaigns (${activeCampaigns.length})\n`;
      activeCampaigns.forEach(campaign => {
        description += `**${campaign.campaign_name}**\n`;
      });
      description += '\n';
    }

    // Add paused campaigns section
    if (pausedCampaigns.length > 0) {
      description += `## ⏸️ Paused Campaigns (${pausedCampaigns.length})\n`;
      pausedCampaigns.forEach(campaign => {
        description += `**${campaign.campaign_name}**\n`;
      });
      description += '\n';
    }

    // Add archived campaigns section (limit to 3 for brevity)
    if (archivedCampaigns.length > 0) {
      description += `## 📁 Recent Campaigns (${archivedCampaigns.length})\n`;
      archivedCampaigns.slice(0, 3).forEach(campaign => {
        description += `**${campaign.campaign_name}**\n`;
      });
      if (archivedCampaigns.length > 3) {
        description += `*...and ${archivedCampaigns.length - 3} more completed campaigns*\n`;
      }
      description += '\n';
    }

    // Add inactive campaigns (limit to 2 for brevity)
    if (inactiveCampaigns.length > 0) {
      description += `## ⚫ Other Campaigns (${inactiveCampaigns.length})\n`;
      inactiveCampaigns.slice(0, 2).forEach(campaign => {
        description += `**${campaign.campaign_name}**\n`;
      });
      if (inactiveCampaigns.length > 2) {
        description += `*...and ${inactiveCampaigns.length - 2} more campaigns*\n`;
      }
      description += '\n';
    }

    // Add instructions at the bottom
    description += `---\n`;
    if (activeCampaigns.length > 0) {
      description += `🚀 **Ready to get started?** Use \`/start\` to join any active campaign!`;
    } else {
      description += `💡 No campaigns are currently accepting new participants. Check back soon!`;
    }

    embed.setDescription(description);

    // Add footer with helpful info
    let footerText = `${campaigns.length} total campaign${campaigns.length !== 1 ? 's' : ''}`;
    if (activeCampaigns.length > 0) {
      footerText += ` • ${activeCampaigns.length} active`;
    }
    
    embed.setFooter({ text: footerText });

    return embed;
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

module.exports = { CampaignsCommand }; 