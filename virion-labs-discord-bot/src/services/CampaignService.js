/**
 * Service for handling campaign-related operations
 */
class CampaignService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.dashboardApiUrl = config.api.dashboardUrl;
  }

  /**
   * Fetch all campaigns for a guild
   * @param {string} guildId 
   * @returns {Promise<Array>}
   */
  async getAllCampaigns(guildId) {
    try {
      this.logger.debug(`📋 Fetching all campaigns for guild: ${guildId}`);
      
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
      const campaigns = responseData.campaigns || [];
      this.logger.debug(`✅ Found ${campaigns.length} campaigns for guild ${guildId}`);
      
      return campaigns;
      
    } catch (error) {
      this.logger.error('❌ Error fetching all campaigns:', error);
      return [];
    }
  }

  /**
   * Fetch active campaigns for a guild
   * @param {string} guildId 
   * @returns {Promise<Array>}
   */
  async getActiveCampaigns(guildId) {
    try {
      const allCampaigns = await this.getAllCampaigns(guildId);
      const activeCampaigns = allCampaigns.filter(campaign => this.isCampaignActive(campaign));
      
      this.logger.debug(`✅ Found ${activeCampaigns.length} active campaigns for guild ${guildId}`);
      return activeCampaigns;
      
    } catch (error) {
      this.logger.error('❌ Error fetching active campaigns:', error);
      return [];
    }
  }

  /**
   * Get campaign by ID
   * @param {string} campaignId 
   * @returns {Promise<Object|null>}
   */
  async getCampaignById(campaignId) {
    try {
      this.logger.debug(`🔍 Fetching campaign by ID: ${campaignId}`);
      
      const response = await fetch(`${this.dashboardApiUrl}/bot-campaigns/${campaignId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          this.logger.warn(`⚠️ Campaign not found: ${campaignId}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      const campaign = responseData.campaign || responseData; // Handle both wrapped and direct response
      this.logger.debug(`✅ Found campaign: ${campaign.campaign_name}`);
      
      return campaign;
      
    } catch (error) {
      this.logger.error('❌ Error fetching campaign by ID:', error);
      return null;
    }
  }

  /**
   * Get campaign status
   * @param {Object} campaign 
   * @returns {string}
   */
  getCampaignStatus(campaign) {
    if (!campaign) return 'unknown';
    
    // Check if campaign has explicit status
    if (campaign.status) {
      return campaign.status;
    }
    
    // Legacy status determination
    const now = new Date();
    const startDate = campaign.start_date ? new Date(campaign.start_date) : null;
    const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
    
    if (startDate && now < startDate) {
      return 'scheduled';
    } else if (endDate && now > endDate) {
      return 'expired';
    } else if (campaign.is_active === false) {
      return 'inactive';
    } else {
      return 'active';
    }
  }

  /**
   * Check if campaign is active
   * @param {Object} campaign 
   * @returns {boolean}
   */
  isCampaignActive(campaign) {
    return this.getCampaignStatus(campaign) === 'active';
  }

  /**
   * Get campaigns by status
   * @param {string} guildId 
   * @param {string} status 
   * @returns {Promise<Array>}
   */
  async getCampaignsByStatus(guildId, status) {
    try {
      const allCampaigns = await this.getAllCampaigns(guildId);
      const filteredCampaigns = allCampaigns.filter(campaign => 
        this.getCampaignStatus(campaign) === status
      );
      
      this.logger.debug(`✅ Found ${filteredCampaigns.length} ${status} campaigns for guild ${guildId}`);
      return filteredCampaigns;
      
    } catch (error) {
      this.logger.error(`❌ Error fetching ${status} campaigns:`, error);
      return [];
    }
  }

  /**
   * Update campaign statistics
   * @param {string} campaignId 
   * @param {Object} stats 
   * @returns {Promise<boolean>}
   */
  async updateCampaignStats(campaignId, stats) {
    try {
      this.logger.debug(`📊 Updating stats for campaign: ${campaignId}`);
      
      const response = await fetch(`${this.dashboardApiUrl}/bot-campaigns/${campaignId}/stats`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify(stats)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.debug(`✅ Updated stats for campaign: ${campaignId}`);
      return true;
      
    } catch (error) {
      this.logger.error('❌ Error updating campaign stats:', error);
      return false;
    }
  }

  /**
   * Get campaign configuration for bot operations
   * @param {string} guildId 
   * @param {string} channelId 
   * @returns {Promise<Object|null>}
   */
  async getBotConfig(guildId, channelId = null) {
    try {
      this.logger.debug(`⚙️ Fetching bot config for guild: ${guildId}, channel: ${channelId}`);
      
      let url = `${this.dashboardApiUrl}/discord-bot/config?guild_id=${guildId}`;
      if (channelId) {
        url += `&channel_id=${channelId}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          this.logger.warn(`⚠️ No bot config found for guild: ${guildId}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const config = await response.json();
      this.logger.debug(`✅ Retrieved bot config for guild: ${guildId}`);
      
      return config;
      
    } catch (error) {
      this.logger.error('❌ Error fetching bot config:', error);
      return null;
    }
  }

  /**
   * Get managed invite details by Discord invite code
   * @param {string} inviteCode
   * @returns {Promise<Object|null>}
   */
  async getManagedInvite(inviteCode) {
    try {
      this.logger.debug(`🔍 Checking for managed invite with code: ${inviteCode}`);
      
      const response = await fetch(`${this.dashboardApiUrl}/discord/invite/${inviteCode}/context`);
      
      if (response.ok) {
        const data = await response.json();
        return { data, error: null };
      }
      
      if (response.status === 404) {
        return { data: null, error: null }; // Not a managed invite, not an error
      }

      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
      
    } catch (error) {
      this.logger.error('❌ Error getting managed invite context:', error);
      return { data: null, error: error.message };
    }
  }
}

module.exports = { CampaignService }; 