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

    // This is a placeholder for the actual fetch call.
    // In a real implementation, you would use node-fetch or a similar library.
    // For the MVP, we will return mock data.
    return this._getMockData(endpoint, options);
  }

  // --- Campaign Endpoints ---

  async getAvailableCampaigns(channelId) {
    this.logger.info(`[ApiService] Fetching available campaigns for channel: ${channelId}`);
    // In a real implementation, this would be:
    // return this._request(`/operations/discord/available-campaigns?channel_id=${channelId}`);
    return {
      success: true,
      data: [
        { id: 'campaign_1', campaign_name: 'MVP Campaign Alpha' },
        { id: 'campaign_2', campaign_name: 'MVP Campaign Beta' },
      ],
    };
  }

  // --- Onboarding Endpoints ---

  async startOnboarding(campaignId, userId) {
    this.logger.info(`[ApiService] Starting onboarding for user ${userId} in campaign ${campaignId}`);
    // return this._request('/workflows/onboarding/start', {
    //   method: 'POST',
    //   body: JSON.stringify({ campaign_id: campaignId, discord_user_id: userId }),
    // });
    return {
      success: true,
      data: {
        questions: [
          { field_key: 'full_name', field_label: 'Full Name', field_type: 'text' },
          { field_key: 'email', field_label: 'Email Address', field_type: 'email' },
        ],
      },
    };
  }

  async submitOnboarding(payload) {
    this.logger.info(`[ApiService] Submitting onboarding for user ${payload.discord_user_id}`);
    // return this._request('/workflows/onboarding/submit-responses', {
    //   method: 'POST',
    //   body: JSON.stringify(payload),
    // });
    return {
      success: true,
      data: {
        message: 'Onboarding complete! A team member will review your application.',
      },
    };
  }

  // --- Access Request Endpoints ---

  async submitAccessRequest(payload) {
    this.logger.info(`[ApiService] Submitting access request for user ${payload.discord_user_id}`);
    // return this._request('/workflows/access-request/submit', {
    //   method: 'POST',
    //   body: JSON.stringify(payload),
    // });
    return {
      success: true,
      data: {
        message: 'Your access request has been submitted.',
        role_to_assign: 'verified_role_id_from_api',
      },
    };
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