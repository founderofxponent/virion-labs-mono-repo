const express = require('express');
const cors = require('cors');
const { CampaignPublisher } = require('../services/CampaignPublisher');

/**
 * Express server for handling webhooks and API endpoints
 */
class WebhookServer {
  constructor(config, logger, botClient) {
    this.config = config;
    this.logger = logger;
    this.botClient = botClient;
    
    // Initialize Express app
    this.app = express();
    this.server = null;
    
    // Initialize services
    this.campaignPublisher = new CampaignPublisher(config, logger, botClient);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(cors());
    
    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`📡 ${req.method} ${req.path} from ${req.ip}`);
      next();
    });
    
    // Error handling middleware
    this.app.use((error, req, res, next) => {
      this.logger.error('❌ Express error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Main webhook endpoint for campaign publishing
    this.app.post('/api/publish-campaigns', async (req, res) => {
      await this.handlePublishCampaigns(req, res);
    });

    // Webhook endpoint for cache invalidation from the dashboard
    this.app.post('/api/cache-invalidation', async (req, res) => {
      await this.handleCacheInvalidation(req, res);
    });

    // Future: Add more webhook endpoints here
    // this.app.post('/api/onboarding-webhook', async (req, res) => {
    //   await this.handleOnboardingWebhook(req, res);
    // });
    
    // this.app.post('/api/referral-webhook', async (req, res) => {
    //   await this.handleReferralWebhook(req, res);
    // });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });
  }

  /**
   * Handle campaign publishing webhook
   * @param {express.Request} req 
   * @param {express.Response} res 
   */
  async handlePublishCampaigns(req, res) {
    try {
      this.logger.info('📡 Received webhook request to publish campaigns');
      
      const { guild_id, channel_id, campaigns } = req.body;
      
      // Use environment variables if not provided in request
      const targetGuildId = guild_id || this.config.discord_server.defaultGuildId;
      const targetChannelId = channel_id || this.config.discord_server.defaultChannelId || 'join-campaigns';
      
      if (!targetGuildId) {
        this.logger.error('❌ No guild ID provided');
        return res.status(400).json({ 
          success: false, 
          error: 'Guild ID is required' 
        });
      }
      
      this.logger.info(`🎯 Auto-publishing campaigns to guild: ${targetGuildId}, channel: ${targetChannelId}`);
      
      // Publish campaigns using the campaign publisher service
      const result = await this.campaignPublisher.publishToChannel(
        targetGuildId, 
        targetChannelId, 
        true, // forceUpdate
        campaigns
      );
      
      if (result.success) {
        this.logger.success('✅ Campaigns published successfully via webhook');
        
        const campaignCount = result.data.campaignCount || 0;
        const message = campaignCount > 0
          ? `Successfully published ${campaignCount} campaign(s).`
          : 'No active campaigns to publish.';

        res.json({
          success: true,
          message: message,
          data: result.data
        });
      } else {
        this.logger.error('❌ Failed to publish campaigns via webhook:', result.error);
        
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to publish campaigns'
        });
      }
      
    } catch (error) {
      this.logger.error('❌ Error in publish campaigns webhook:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Handle cache invalidation webhook
   * @param {express.Request} req 
   * @param {express.Response} res 
   */
  async handleCacheInvalidation(req, res) {
    try {
      const { action, campaignId, guildId } = req.body;
      this.logger.info(`📡 Received cache invalidation request: action=${action}, campaignId=${campaignId}, guildId=${guildId}`);

      if (!action || !['invalidate', 'clear_all'].includes(action)) {
        return res.status(400).json({ success: false, error: 'Invalid action' });
      }

      if (action === 'invalidate' && !campaignId) {
        return res.status(400).json({ success: false, error: 'campaignId is required for invalidate action' });
      }
      
      const interactionHandler = this.botClient.getInteractionHandler();
      if (!interactionHandler || !interactionHandler.onboardingHandler) {
          this.logger.error('❌ Onboarding handler not available on interaction handler.');
          return res.status(500).json({ success: false, error: 'Internal server error: Onboarding handler not found' });
      }
      
      // Clear the in-memory session cache in OnboardingHandler
      interactionHandler.onboardingHandler.clearSessionsByCampaignId(campaignId);
      
      // Note: CampaignService does not have a cache, so no action needed there.
      // The dashboard-side cache is what matters for it.

      res.json({ success: true, message: `Cache invalidated for campaign ${campaignId}` });

    } catch (error) {
      this.logger.error('❌ Error in cache invalidation webhook:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Start the webhook server
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        const port = this.config.api.port;
        
        this.server = this.app.listen(port, () => {
          this.logger.success(`🌐 Webhook server started on port ${port}`);
          resolve();
        });
        
        this.server.on('error', (error) => {
          this.logger.error('❌ Webhook server error:', error);
          reject(error);
        });
        
      } catch (error) {
        this.logger.error('❌ Failed to start webhook server:', error);
        reject(error);
      }
    });
  }

  /**
   * Shutdown the webhook server
   */
  async shutdown() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('🛑 Webhook server shut down');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get server statistics
   * @returns {Object}
   */
  getStats() {
    return {
      isRunning: !!this.server,
      port: this.config.api.port,
      servicesInitialized: {
        campaignPublisher: !!this.campaignPublisher
      }
    };
  }
}

module.exports = { WebhookServer }; 