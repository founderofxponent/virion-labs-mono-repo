// Using built-in fetch (Node.js 18+)

class ApiService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.baseUrl = config.api.baseUrl;
    this.apiKey = config.api.apiKey;
    // Cache for storing campaign data
    this.campaignCache = new Map();
  }

  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
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

  getCachedCampaign(campaignId) {
    return this.campaignCache.get(campaignId);
  }

  cacheCampaign(campaign) {
    // Use documentId as the key since that's what's used in button customIds
    this.campaignCache.set(campaign.documentId, campaign);
    this.logger.debug(`[ApiService] Cached campaign: ${campaign.documentId} - ${campaign.name}`);
  }


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
        // Cache each campaign for later use
        this.cacheCampaign(campaign);
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
    this.logger.info(`[ApiService] Submitting access request for user ${payload.discord_user_id}`);
    const response = await this._request('/api/v1/integrations/discord/request-access', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Standardize the response to what the handler expects.
    // A successful response might have a `message`. An error from the API has a `detail` field.
    const isSuccess = response && !response.detail;
    const message = isSuccess ? (response.message || 'Your request has been submitted successfully.') : response.detail;

    return {
      success: isSuccess,
      data: {
        message: message
      }
    };
  }

  async hasVerifiedRole(userId, guildId) {
    this.logger.info(`[ApiService] Checking verified role for user ${userId} in guild ${guildId}`);
    return this._request(`/api/v1/integrations/discord/user/${userId}/has-verified-role/${guildId}`);
  }

  // --- Email Endpoints ---
  
  async sendTemplateEmail(emailData) {
    this.logger.info(`[ApiService] Sending template email: ${emailData.template_id} to ${emailData.recipient_email}`);
    const response = await this._request('/api/v1/email/send-template', {
      method: 'POST',
      body: JSON.stringify({
        template_id: emailData.template_id,
        to: emailData.recipient_email,
        variables: emailData.variables
      }),
    });
    
    return {
      success: response.success || !response.error,
      message: response.message || 'Email sent successfully'
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