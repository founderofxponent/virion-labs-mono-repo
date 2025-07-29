// Using built-in fetch (Node.js 18+)

class ApiService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.baseUrl = config.api.baseUrl;
    this.apiKey = config.api.apiKey;
  }

  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    this.logger.debug(`📡 Making API request to ${url}`);

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        this.logger.warn(`API request to ${url} returned status ${response.status}:`, data);
      }
      return data;
    } catch (error) {
      this.logger.error(`API request error during request to ${url}: ${error.message}`);
      return { success: false, message: 'Failed to communicate with the API.' };
    }
  }

  // --- Campaign Endpoints ---

  async getAvailableCampaigns(guildId, channelId, joinCampaignsChannelId) {
    this.logger.info(`[ApiService] Fetching available campaigns for guild ${guildId}, channel: ${channelId}`);
    let url = `/api/v1/integrations/discord/campaigns/${guildId}?channel_id=${channelId}`;
    if (joinCampaignsChannelId) {
      url += `&join_campaigns_channel_id=${joinCampaignsChannelId}`;
    }
    
    const response = await this._request(url);
    
    // Log the API response details
    this.logger.info(`[ApiService] API Response: ${JSON.stringify(response, null, 2)}`);
    
    if (response.campaigns) {
      this.logger.info(`[ApiService] Received ${response.campaigns.length} campaigns`);
      response.campaigns.forEach((campaign, index) => {
        this.logger.info(`[ApiService] Campaign ${index + 1}: id=${campaign.id}, documentId=${campaign.documentId}, name="${campaign.name}"`);
      });
      
      // Check for duplicate documentIds in API response
      const documentIds = response.campaigns.map(c => c.documentId);
      const uniqueDocumentIds = [...new Set(documentIds)];
      if (documentIds.length !== uniqueDocumentIds.length) {
        this.logger.error(`[ApiService] ⚠️  DUPLICATE DOCUMENT IDs IN API RESPONSE!`);
        this.logger.error(`[ApiService] Total campaigns: ${documentIds.length}, Unique documentIds: ${uniqueDocumentIds.length}`);
        this.logger.error(`[ApiService] DocumentIds: ${JSON.stringify(documentIds)}`);
      }
    } else {
      this.logger.warn(`[ApiService] No campaigns array in response`);
    }
    
    return response;
  }

  // --- Onboarding Endpoints ---

  async startOnboarding(campaignId, userId, username) {
    this.logger.info(`[ApiService] Starting onboarding for user ${userId} in campaign ${campaignId}`);
    const response = await this._request('/api/v1/integrations/discord/onboarding/start', {
      method: 'POST',
      body: JSON.stringify({
        campaign_id: campaignId,
        discord_user_id: userId,
        discord_username: username
      }),
    });
    
    // Transform the response to match expected format
    if (!response.success) {
      return { success: false, message: response.message };
    }
    
    return {
      success: true,
      data: {
        questions: response.fields || []
      }
    };
  }

  async submitOnboarding(payload) {
    this.logger.info(`[ApiService] Submitting onboarding for user ${payload.discord_user_id}`);
    const response = await this._request('/api/v1/integrations/discord/onboarding/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    // Transform the response to match expected format
    return {
      success: response.success,
      data: {
        message: response.message || 'Onboarding completed successfully!',
        role_assigned: response.role_assigned || false
      }
    };
  }

  // --- Access Request Endpoints ---

  async submitAccessRequest(payload) {
    this.logger.info(`[ApiService] Submitting access request for user ${payload.user_id}`);
    return this._request('/api/v1/integrations/discord/request-access', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async hasVerifiedRole(userId, guildId) {
    this.logger.info(`[ApiService] Checking verified role for user ${userId} in guild ${guildId}`);
    return this._request(`/api/v1/integrations/discord/user/${userId}/has-verified-role/${guildId}`);
  }

  // --- Referral Endpoints ---

  async trackMemberJoin(userId, inviteCode) {
    this.logger.info(`[ApiService] Tracking member join for user ${userId} with invite ${inviteCode}`);
    // return this._request('/integrations/discord/member-join', {
    //   method: 'POST',
    //   body: JSON.stringify({ discord_user_id: userId, invite_code: inviteCode }),
    // });
    return { success: true };
  }
}

module.exports = { ApiService };