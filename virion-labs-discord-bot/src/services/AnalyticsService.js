/**
 * Service for handling analytics and interaction tracking
 */
class AnalyticsService {
  constructor(config, logger, database) {
    this.config = config;
    this.logger = logger;
    this.database = database;
    this.dashboardApiUrl = config.api.dashboardUrl;
  }

  /**
   * Track user interaction
   * @param {string} guildId 
   * @param {string} channelId 
   * @param {Object} message 
   * @param {string} interactionType 
   * @param {string} botResponse 
   * @param {string} referralCode 
   * @returns {Promise<boolean>}
   */
  async trackInteraction(guildId, channelId, message, interactionType, botResponse = null, referralCode = null) {
    try {
      this.logger.debug(`📊 Tracking interaction: ${interactionType} in guild ${guildId}`);
      
      const trackingData = {
        guild_id: guildId,
        channel_id: channelId,
        discord_user_id: message.author?.id,
        discord_username: message.author?.tag,
        message_id: message.id,
        interaction_type: interactionType,
        message_content: message.content || `${interactionType} interaction`,
        bot_response: botResponse || `${interactionType} processed`,
        referral_code: referralCode || null,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${this.dashboardApiUrl}/discord-bot/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify(trackingData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.debug(`✅ Successfully tracked ${interactionType} interaction`);
      return true;
      
    } catch (error) {
      this.logger.error('❌ Error tracking interaction:', error);
      return false;
    }
  }

  /**
   * Update bot statistics
   * @param {string} guildId 
   * @param {string} channelId 
   * @param {Object} statsUpdate 
   * @returns {Promise<boolean>}
   */
  async updateBotStats(guildId, channelId, statsUpdate) {
    try {
      this.logger.debug(`📈 Updating bot stats for guild ${guildId}`);
      
      const updateData = {
        guild_id: guildId,
        channel_id: channelId,
        ...statsUpdate,
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${this.dashboardApiUrl}/discord-bot/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.debug(`✅ Successfully updated bot stats for guild ${guildId}`);
      return true;
      
    } catch (error) {
      this.logger.error('❌ Error updating bot stats:', error);
      return false;
    }
  }

  /**
   * Track command usage
   * @param {string} commandName 
   * @param {string} guildId 
   * @param {string} userId 
   * @returns {Promise<boolean>}
   */
  async trackCommandUsage(commandName, guildId, userId) {
    return await this.trackInteraction(
      guildId,
      null,
      { 
        author: { id: userId }, 
        id: `cmd_${Date.now()}`, 
        content: `/${commandName}` 
      },
      `slash_command_${commandName}`
    );
  }

  /**
   * Track onboarding completion
   * @param {string} campaignId 
   * @param {string} guildId 
   * @param {string} userId 
   * @param {string} username 
   * @returns {Promise<boolean>}
   */
  async trackOnboardingCompletion(campaignId, guildId, userId, username) {
    try {
      this.logger.debug(`🎯 Tracking onboarding completion for campaign ${campaignId}`);
      
      const response = await fetch(`${this.dashboardApiUrl}/discord-bot/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          discord_user_id: userId,
          discord_username: username,
          guild_id: guildId,
          completed_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.debug(`✅ Successfully tracked onboarding completion`);
      return true;
      
    } catch (error) {
      this.logger.error('❌ Error tracking onboarding completion:', error);
      return false;
    }
  }

  /**
   * Track referral conversion
   * @param {string} referralCode 
   * @param {string} guildId 
   * @param {string} userId 
   * @returns {Promise<boolean>}
   */
  async trackReferralConversion(referralCode, guildId, userId) {
    try {
      this.logger.debug(`🤝 Tracking referral conversion for code: ${referralCode}`);
      
      const response = await fetch(`${this.dashboardApiUrl}/referral/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify({
          referral_code: referralCode,
          guild_id: guildId,
          discord_user_id: userId,
          converted_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.debug(`✅ Successfully tracked referral conversion`);
      return true;
      
    } catch (error) {
      this.logger.error('❌ Error tracking referral conversion:', error);
      return false;
    }
  }

  /**
   * Get analytics summary for a guild
   * @param {string} guildId 
   * @returns {Promise<Object|null>}
   */
  async getAnalyticsSummary(guildId) {
    try {
      this.logger.debug(`📊 Fetching analytics summary for guild: ${guildId}`);
      
      const response = await fetch(`${this.dashboardApiUrl}/analytics/guild/${guildId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          this.logger.warn(`⚠️ No analytics found for guild: ${guildId}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const analytics = await response.json();
      this.logger.debug(`✅ Retrieved analytics for guild: ${guildId}`);
      
      return analytics;
      
    } catch (error) {
      this.logger.error('❌ Error fetching analytics summary:', error);
      return null;
    }
  }
}

module.exports = { AnalyticsService }; 