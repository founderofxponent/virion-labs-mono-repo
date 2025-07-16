const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { InteractionUtils } = require('../utils/InteractionUtils');
const { CampaignService } = require('../services/CampaignService');
const { AnalyticsService } = require('../services/AnalyticsService');

/**
 * Handles the /join slash command - intelligently shows campaigns based on channel context
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

      // Check if user has the required "Verified" role
      const hasVerifiedRole = await this.checkVerifiedRole(interaction);
      if (!hasVerifiedRole) {
        await interaction.editReply({
          content: '❌ You need the **Verified** role to use this command. Please request access first using `/request-access`.'
        });
        return;
      }

      this.logger.info(`🔗 Join command from ${userInfo.tag} in guild ${guildInfo.id}, channel ${guildInfo.channelId}`);
      
      // Fetch all active campaigns for this guild
      let activeCampaigns = await this.campaignService.getActiveCampaigns(guildInfo.id);
      
      if (!activeCampaigns || activeCampaigns.length === 0) {
        await interaction.editReply({
          content: '❌ No active campaigns found for this server.\n\n💡 Server administrators can set up campaigns through the dashboard.'
        });
        return;
      }

      // Apply intelligent filtering based on channel context
      const isJoinCampaignsChannel = this.isJoinCampaignsChannel(guildInfo.channelId);
      
      if (isJoinCampaignsChannel) {
        // In join-campaigns channel: only show public campaigns (no channel_id)
        activeCampaigns = activeCampaigns.filter(campaign => 
          !campaign.channel_id || campaign.channel_id === null
        );
        this.logger.debug(`🔍 Filtered to ${activeCampaigns.length} public campaigns for join-campaigns channel`);
        
        if (activeCampaigns.length === 0) {
          await interaction.editReply({
            content: '❌ No public campaigns available in this channel.\n\n💡 Check other channels for channel-specific campaigns, or contact server administrators.'
          });
          return;
        }
      } else {
        // In private/specific channel: only show campaigns that match this channel_id
        const channelCampaigns = activeCampaigns.filter(campaign => {
          return campaign.channel_id && campaign.channel_id === guildInfo.channelId;
        });
        
        if (channelCampaigns.length === 0) {
          // Check if there are active campaigns but none for this channel
          const channelMention = `<#${guildInfo.channelId}>`;
          const joinCampaignsChannelId = this.config.discord_server.defaultChannelId;
          const joinChannelMention = joinCampaignsChannelId ? `<#${joinCampaignsChannelId}>` : 'the join-campaigns channel';
          
          await interaction.editReply({
            content: `❌ No active campaigns found for this channel (${channelMention}).\n\n💡 This server has ${activeCampaigns.length} active campaign${activeCampaigns.length !== 1 ? 's' : ''}, but none are configured for this specific channel.\n\n🔧 Try using \`/join\` in ${joinChannelMention} to see public campaigns, or contact server administrators to configure campaigns for this channel.`
          });
          return;
        }
        
        activeCampaigns = channelCampaigns;
        this.logger.debug(`🔍 Filtered to ${activeCampaigns.length} channel-specific campaigns for channel ${guildInfo.channelId}`);
      }

      // Create and send the campaign selection interface
      const { embed, components } = this.createCampaignSelection(activeCampaigns, userInfo, guildInfo, isJoinCampaignsChannel);
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
      await this.handleError(interaction, 'Failed to load campaigns. Please try again later.');
    }
  }

  /**
   * Check if user has the verified role
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @returns {Promise<boolean>}
   */
  async checkVerifiedRole(interaction) {
    try {
      const verifiedRoleId = this.config.discord_server.verifiedRoleId;
      
      // If no verified role is configured, allow access (for development/testing)
      if (!verifiedRoleId) {
        this.logger.warn('⚠️ DISCORD_VERIFIED_ROLE_ID not configured - allowing access to all users');
        return true;
      }

      // Use utility method to check role
      return await InteractionUtils.hasRole(interaction, verifiedRoleId);
    } catch (error) {
      this.logger.error('❌ Error checking verified role:', error);
      return false;
    }
  }

  /**
   * Check if the current channel is the join-campaigns channel
   * @param {string} channelId - The Discord channel ID
   * @returns {boolean}
   */
  isJoinCampaignsChannel(channelId) {
    const joinCampaignsChannelId = this.config.discord_server.defaultChannelId;
    
    if (!joinCampaignsChannelId) {
      // If no join-campaigns channel is configured, consider any channel as non-join-campaigns
      this.logger.warn('⚠️ DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID not configured - treating all channels as private channels');
      return false;
    }

    const isJoinChannel = channelId === joinCampaignsChannelId;
    this.logger.debug(`🔍 Channel ${channelId} is join-campaigns channel: ${isJoinChannel}`);
    return isJoinChannel;
  }

  /**
   * Create the campaign selection interface
   * @param {Array} activeCampaigns 
   * @param {Object} userInfo 
   * @param {Object} guildInfo 
   * @param {boolean} isJoinCampaignsChannel
   * @returns {Object}
   */
  createCampaignSelection(activeCampaigns, userInfo, guildInfo, isJoinCampaignsChannel) {
    // Create the campaign selection embed
    const embed = new EmbedBuilder()
      .setTitle(isJoinCampaignsChannel ? '🚀 Join Public Campaigns' : '🔗 Join Channel Campaigns')
      .setColor(isJoinCampaignsChannel ? '#6366f1' : '#10b981')
      .setTimestamp();

    let description;
    if (isJoinCampaignsChannel) {
      description = `Welcome ${userInfo.displayName}! Choose from these public campaigns available to all members:\n\n`;
    } else {
      const channelMention = `<#${guildInfo.channelId}>`;
      description = `Welcome ${userInfo.displayName}! Here are the active campaigns for ${channelMention}:\n\n`;
    }
    
    activeCampaigns.forEach((campaign, index) => {
      description += `**${index + 1}.** ${campaign.campaign_name}\n`;
      if (campaign.description && !isJoinCampaignsChannel) {
        description += `   └ ${campaign.description.substring(0, 100)}${campaign.description.length > 100 ? '...' : ''}\n`;
      }
    });
    
    description += `\n💡 **Select a campaign below to start your onboarding journey!**`;
    
    embed.setDescription(description);
    embed.setFooter({ 
      text: `${activeCampaigns.length} active campaign${activeCampaigns.length !== 1 ? 's' : ''} ${isJoinCampaignsChannel ? 'available' : 'in this channel'}` 
    });

    // Create buttons for each campaign (max 5 per row, max 25 total)
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
        .setStyle(isJoinCampaignsChannel ? ButtonStyle.Primary : ButtonStyle.Success)
        .setEmoji(isJoinCampaignsChannel ? '🚀' : '🔗');

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