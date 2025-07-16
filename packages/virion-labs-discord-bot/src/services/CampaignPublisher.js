const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Service for publishing campaigns to Discord channels
 */
class CampaignPublisher {
  constructor(config, logger, botClient) {
    this.config = config;
    this.logger = logger;
    this.botClient = botClient;
    this.dashboardApiUrl = config.api.dashboardUrl;
    
    // Cache for published messages per guild
    this.publishedMessages = new Map();
  }

  /**
   * Publish campaigns to a specific channel
   * @param {string} guildId 
   * @param {string} channelIdentifier 
   * @param {boolean} forceUpdate 
   * @param {object | null} campaignsData
   * @returns {Promise<Object>}
   */
  async publishToChannel(guildId, channelIdentifier = 'join-campaigns', forceUpdate = false, campaignsData = null) {
    try {
      this.logger.info(`📢 Publishing campaigns to guild: ${guildId}, channel: ${channelIdentifier}`);
      
      const client = this.botClient.getClient();
      const guild = client.guilds.cache.get(guildId);
      
      if (!guild) {
        throw new Error(`Guild not found: ${guildId}`);
      }

      // Find the channel
      let channel;
      if (channelIdentifier.match(/^\d+$/)) {
        // Channel ID provided
        channel = guild.channels.cache.get(channelIdentifier);
      } else {
        // Channel name provided
        channel = guild.channels.cache.find(ch => 
          ch.name.toLowerCase() === channelIdentifier.toLowerCase() && ch.isTextBased()
        );
      }

      if (!channel) {
        throw new Error(`Channel not found: ${channelIdentifier} in guild ${guild.name}`);
      }

      this.logger.info(`📍 Found channel: ${channel.name} (${channel.id})`);

      // Fetch campaigns for this guild if not provided
      const campaigns = campaignsData ? (campaignsData.active || []).concat(campaignsData.inactive || []) : await this.fetchCampaigns(guildId);
      
      if (!campaigns || campaigns.length === 0) {
        this.logger.warn(`⚠️ No campaigns found for guild: ${guildId}`);
        return {
          success: false,
          error: 'No campaigns found for this guild'
        };
      }

      // Check if we need to update existing message
      const cacheKey = `${guildId}:${channel.id}`;
      const existingMessageId = this.publishedMessages.get(cacheKey);
      
      if (existingMessageId && !forceUpdate) {
        try {
          const existingMessage = await channel.messages.fetch(existingMessageId);
          if (existingMessage) {
            this.logger.info(`ℹ️ Campaign message already exists, skipping update`);
            return {
              success: true,
              data: { messageId: existingMessageId, updated: false }
            };
          }
        } catch (error) {
          this.logger.warn(`⚠️ Existing message not found, will create new one`);
          this.publishedMessages.delete(cacheKey);
        }
      }

      // Check if we're publishing to the join-campaigns channel
      const isJoinCampaignsChannel = this.isJoinCampaignsChannel(channel.id, channelIdentifier);

      // Create campaign embed and components
      const { embed, components } = this.createCampaignMessage(campaigns, guild.name, campaignsData, isJoinCampaignsChannel);

      // Send or update the message
      let message;
      if (existingMessageId && forceUpdate) {
        try {
          const existingMessage = await channel.messages.fetch(existingMessageId);
          message = await existingMessage.edit({ embeds: [embed], components });
          this.logger.success(`✅ Updated existing campaign message in ${channel.name}`);
        } catch (error) {
          this.logger.warn(`⚠️ Failed to update existing message, creating new one`);
          message = await channel.send({ embeds: [embed], components });
          this.publishedMessages.set(cacheKey, message.id);
        }
      } else {
        message = await channel.send({ embeds: [embed], components });
        this.publishedMessages.set(cacheKey, message.id);
        this.logger.success(`✅ Published new campaign message in ${channel.name}`);
      }

      // Update bot stats
      await this.updateBotStats(guildId, channel.id, {
        campaigns_published: campaigns.length,
        last_publish_at: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          messageId: message.id,
          channelId: channel.id,
          campaignCount: campaigns.length,
          updated: !!existingMessageId
        }
      };
      
    } catch (error) {
      this.logger.error('❌ Error publishing campaigns:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch campaigns from the dashboard API
   * @param {string} guildId 
   * @returns {Promise<Array>}
   */
  async fetchCampaigns(guildId) {
    try {
      const response = await fetch(`${this.dashboardApiUrl}/bot-campaigns?guild_id=${guildId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData.campaigns || responseData; // Handle both wrapped and direct response
      
    } catch (error) {
      this.logger.error('❌ Error fetching campaigns:', error);
      return [];
    }
  }

  /**
   * Create campaign message embed and components
   * @param {Array} campaigns 
   * @param {string} guildName 
   * @param {object | null} campaignsData
   * @param {boolean} isJoinCampaignsChannel - Whether this is the join-campaigns channel
   * @returns {Object}
   */
  createCampaignMessage(campaigns, guildName, campaignsData = null, isJoinCampaignsChannel = false) {
    // Filter active campaigns
    let activeCampaigns = campaignsData 
      ? campaignsData.active 
      : campaigns.filter(campaign => campaign.status === 'active');

    // If publishing to join-campaigns channel, only show public campaigns (no channel_id)
    if (isJoinCampaignsChannel) {
      activeCampaigns = activeCampaigns.filter(campaign => 
        !campaign.channel_id || campaign.channel_id === null
      );
      this.logger.debug(`🔍 Filtered to ${activeCampaigns.length} public campaigns for join-campaigns channel`);
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle('🎯 Join Our Campaigns!')
      .setColor('#6366f1')
      .setTimestamp();

    let description = `Welcome to **${guildName}**! 🚀\n\n`;
    
    if (activeCampaigns.length > 0) {
      description += `We have **${activeCampaigns.length}** active campaign${activeCampaigns.length !== 1 ? 's' : ''} you can join:\n\n`;
      
      activeCampaigns.forEach((campaign, index) => {
        description += `**${index + 1}.** ${campaign.campaign_name || campaign.name}\n`;
      });
      
      description += `\n🚀 **Ready to get started?** Click the button below to begin your onboarding journey!`;
    } else {
      description += `No campaigns are currently active. Check back soon for new opportunities! 💫`;
    }

    embed.setDescription(description);
    embed.setFooter({ 
      text: `${campaigns.length} total campaign${campaigns.length !== 1 ? 's' : ''} • ${activeCampaigns.length} active` 
    });

    // Create components (buttons)
    const components = [];
    
    if (activeCampaigns.length > 0) {
      const row = new ActionRowBuilder();
      
      // Add a "Get Started" button
      const getStartedButton = new ButtonBuilder()
        .setCustomId('campaign_get_started')
        .setLabel('Get Started')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🪄');
      
      row.addComponents(getStartedButton);
      
      components.push(row);
    }

    return { embed, components };
  }

  /**
   * Check if the target channel is the join-campaigns channel
   * @param {string} channelId - The Discord channel ID
   * @param {string} channelIdentifier - The channel identifier used for publishing
   * @returns {boolean}
   */
  isJoinCampaignsChannel(channelId, channelIdentifier) {
    // Check if the channel identifier matches known join-campaigns patterns
    const joinCampaignsIdentifiers = [
      'join-campaigns',
      this.config.discord_server.defaultChannelId
    ].filter(Boolean); // Remove any null/undefined values

    // Check if channelIdentifier matches any of the join-campaigns patterns
    const matchesIdentifier = joinCampaignsIdentifiers.some(identifier => {
      // If identifier is a channel ID (all digits), compare with channelId
      if (identifier.match(/^\d+$/)) {
        return identifier === channelId;
      }
      // If identifier is a channel name, compare with channelIdentifier
      return identifier.toLowerCase() === channelIdentifier.toLowerCase();
    });

    this.logger.debug(`🔍 Channel check: ${channelId} (${channelIdentifier}) is join-campaigns: ${matchesIdentifier}`);
    return matchesIdentifier;
  }

  /**
   * Update bot statistics
   * @param {string} guildId 
   * @param {string} channelId 
   * @param {Object} stats 
   * @returns {Promise<boolean>}
   */
  async updateBotStats(guildId, channelId, stats) {
    try {
      const response = await fetch(`${this.dashboardApiUrl}/discord-bot/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify({
          guild_id: guildId,
          channel_id: channelId,
          ...stats
        })
      });

      return response.ok;
      
    } catch (error) {
      this.logger.error('❌ Error updating bot stats:', error);
      return false;
    }
  }

  /**
   * Clear published message cache for a guild
   * @param {string} guildId 
   */
  clearGuildCache(guildId) {
    for (const [key] of this.publishedMessages) {
      if (key.startsWith(`${guildId}:`)) {
        this.publishedMessages.delete(key);
      }
    }
    this.logger.debug(`🧹 Cleared cache for guild: ${guildId}`);
  }

  /**
   * Clear all published message cache
   */
  clearAllCache() {
    this.publishedMessages.clear();
    this.logger.debug(`🧹 Cleared all published message cache`);
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getCacheStats() {
    return {
      cachedMessages: this.publishedMessages.size,
      guilds: new Set([...this.publishedMessages.keys()].map(key => key.split(':')[0])).size
    };
  }
}

module.exports = { CampaignPublisher }; 