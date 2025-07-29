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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        this.logger.error(`API request failed with status ${response.status}:`, errorData);
        throw new Error(errorData.detail || 'API request failed');
      }
      return response.json();
    } catch (error) {
      this.logger.error('API request error:', error);
      throw error;
    }
  }

  // --- Campaign Endpoints ---

  async getAvailableCampaigns(guildId, channelId, joinCampaignsChannelId) {
    this.logger.info(`[ApiService] Fetching available campaigns for guild ${guildId}, channel: ${channelId}`);
    let url = `/api/v1/integrations/discord/campaigns/${guildId}?channel_id=${channelId}`;
    if (joinCampaignsChannelId) {
      url += `&join_campaigns_channel_id=${joinCampaignsChannelId}`;
    }
    return this._request(url);
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
    return {
      success: response.success,
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
        message: response.message || 'Onboarding completed successfully!'
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