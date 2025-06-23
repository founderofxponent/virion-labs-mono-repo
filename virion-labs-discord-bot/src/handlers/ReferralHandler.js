const { EmbedBuilder } = require('discord.js');
const { CampaignService } = require('../services/CampaignService');
const { AnalyticsService } = require('../services/AnalyticsService');

/**
 * Handles referral-related functionality and validation
 */
class ReferralHandler {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.dashboardApiUrl = config.api.dashboardUrl;
    
    // Initialize services
    this.campaignService = new CampaignService(config, logger);
    this.analyticsService = new AnalyticsService(config, logger);
  }

  /**
   * Handle new member onboarding with referral context
   * @param {import('discord.js').GuildMember} member 
   */
  async handleNewMemberOnboarding(member) {
    try {
      this.logger.info(`👋 Processing new member: ${member.user.tag} in ${member.guild.name}`);
      
      // Check for referral invite context
      const autoReferralProcessed = await this.handleReferralInviteContext(member);
      
      if (autoReferralProcessed) {
        this.logger.info(`✅ Auto-referral processed for ${member.user.tag}`);
        return;
      }

      // Check for active campaigns that might trigger auto-onboarding
      const activeCampaigns = await this.campaignService.getActiveCampaigns(member.guild.id);
      
      if (activeCampaigns.length > 0) {
        // Send welcome message with campaign information
        await this.sendWelcomeMessage(member, activeCampaigns);
      }
      
    } catch (error) {
      this.logger.error('❌ Error handling new member onboarding:', error);
    }
  }

  /**
   * Handle referral invite context for new members
   * @param {import('discord.js').GuildMember} member 
   * @returns {Promise<boolean>}
   */
  async handleReferralInviteContext(member) {
    try {
      this.logger.debug(`🔍 Checking referral invite context for ${member.user.tag}`);
      
      // Get invite information
      const invites = await member.guild.invites.fetch();
      const guildInvites = invites.filter(invite => invite.inviter?.id !== member.client.user.id);
      
      // Look for referral codes in invite context
      for (const invite of guildInvites.values()) {
        if (invite.url && invite.url.includes('ref=')) {
          const urlParams = new URLSearchParams(invite.url.split('?')[1]);
          const referralCode = urlParams.get('ref');
          
          if (referralCode) {
            this.logger.info(`🤝 Found referral code in invite: ${referralCode}`);
            
            const validation = await this.validateReferralCode(
              referralCode, 
              member.guild.id, 
              member.user.id
            );
            
            if (validation.isValid) {
              await this.processReferralOnboarding(member, validation);
              return true;
            }
          }
        }
      }
      
      return false;
      
    } catch (error) {
      this.logger.error('❌ Error handling referral invite context:', error);
      return false;
    }
  }

  /**
   * Handle direct messages for referral codes
   * @param {import('discord.js').Message} message 
   */
  async handleDirectMessage(message) {
    try {
      const referralCode = this.extractReferralCode(message.content);
      
      if (referralCode) {
        this.logger.info(`🤝 Found referral code in DM: ${referralCode}`);
        
        // Since this is a DM, we need to determine which guild to validate against
        // For now, we'll validate against all guilds the user shares with the bot
        const guilds = message.client.guilds.cache.filter(guild => 
          guild.members.cache.has(message.author.id)
        );
        
        for (const guild of guilds.values()) {
          const validation = await this.validateReferralCode(
            referralCode, 
            guild.id, 
            message.author.id
          );
          
          if (validation.isValid) {
            await this.sendReferralValidationResponse(message, validation, guild);
            break;
          }
        }
      }
      
    } catch (error) {
      this.logger.error('❌ Error handling direct message:', error);
    }
  }

  /**
   * Handle referral messages in guild channels
   * @param {import('discord.js').Message} message 
   * @param {string} referralCode 
   */
  async handleReferralMessage(message, referralCode) {
    try {
      this.logger.info(`🤝 Processing referral code: ${referralCode} from ${message.author.tag}`);
      
      const validation = await this.validateReferralCode(
        referralCode, 
        message.guild.id, 
        message.author.id
      );
      
      if (validation.isValid) {
        await this.sendReferralValidationResponse(message, validation);
      } else {
        await this.sendInvalidReferralResponse(message, referralCode);
      }
      
    } catch (error) {
      this.logger.error('❌ Error handling referral message:', error);
    }
  }

  /**
   * Validate referral code
   * @param {string} code 
   * @param {string} guildId 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async validateReferralCode(code, guildId, userId = null) {
    try {
      this.logger.debug(`🔍 Validating referral code: ${code} for guild: ${guildId}`);
      
      let url = `${this.dashboardApiUrl}/referral/${code}/validate?guild_id=${guildId}`;
      if (userId) {
        url += `&user_id=${userId}`;
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
          this.logger.debug(`⚠️ Referral code not found: ${code}`);
          return { isValid: false, error: 'Code not found' };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const validation = await response.json();
      this.logger.debug(`✅ Referral validation result: ${validation.isValid}`);
      
      return validation;
      
    } catch (error) {
      this.logger.error('❌ Error validating referral code:', error);
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Process referral onboarding
   * @param {import('discord.js').GuildMember} member 
   * @param {Object} validation 
   */
  async processReferralOnboarding(member, validation) {
    try {
      this.logger.info(`🚀 Processing referral onboarding for ${member.user.tag}`);
      
      // Send welcome message with referral context
      const embed = new EmbedBuilder()
        .setTitle('🤝 Welcome via Referral!')
        .setDescription(
          `Welcome to **${member.guild.name}**, ${member.user.username}!\n\n` +
          `You joined through **${validation.influencer?.name || 'a referral'}'s** invitation.\n\n` +
          `🚀 Ready to get started? Use \`/start\` to begin your onboarding journey!`
        )
        .setColor('#6366f1')
        .setTimestamp();

      await member.send({ embeds: [embed] }).catch(() => {
        this.logger.warn(`⚠️ Could not send DM to ${member.user.tag}`);
      });

      // Track referral interaction
      await this.analyticsService.trackInteraction(
        member.guild.id,
        null,
        {
          author: { id: member.user.id, tag: member.user.tag },
          id: `referral_${Date.now()}`,
          content: `Referral code: ${validation.referral_code}`
        },
        'referral_join',
        'Referral onboarding started',
        validation.referral_code
      );
      
    } catch (error) {
      this.logger.error('❌ Error processing referral onboarding:', error);
    }
  }

  /**
   * Send welcome message to new members
   * @param {import('discord.js').GuildMember} member 
   * @param {Array} activeCampaigns 
   */
  async sendWelcomeMessage(member, activeCampaigns) {
    try {
      const embed = new EmbedBuilder()
        .setTitle(`👋 Welcome to ${member.guild.name}!`)
        .setDescription(
          `Hi ${member.user.username}! Welcome to our community.\n\n` +
          `We have **${activeCampaigns.length}** active campaign${activeCampaigns.length !== 1 ? 's' : ''} you can join:\n\n` +
          activeCampaigns.slice(0, 3).map(c => `• **${c.campaign_name}**`).join('\n') +
          (activeCampaigns.length > 3 ? `\n• ...and ${activeCampaigns.length - 3} more!` : '') +
          `\n\n🚀 Use \`/start\` to begin your onboarding journey!`
        )
        .setColor('#6366f1')
        .setTimestamp();

      await member.send({ embeds: [embed] }).catch(() => {
        this.logger.warn(`⚠️ Could not send welcome DM to ${member.user.tag}`);
      });
      
    } catch (error) {
      this.logger.error('❌ Error sending welcome message:', error);
    }
  }

  /**
   * Send referral validation response
   * @param {import('discord.js').Message} message 
   * @param {Object} validation 
   * @param {import('discord.js').Guild} guild 
   */
  async sendReferralValidationResponse(message, validation, guild = null) {
    try {
      const targetGuild = guild || message.guild;
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Valid Referral Code!')
        .setDescription(
          `Great! Your referral code is valid.\n\n` +
          `**Influencer:** ${validation.influencer?.name || 'Unknown'}\n` +
          `**Campaign:** ${validation.campaign?.campaign_name || 'Unknown'}\n\n` +
          `🚀 Use \`/start\` in **${targetGuild.name}** to begin your onboarding!`
        )
        .setColor('#00ff00')
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      this.logger.error('❌ Error sending referral validation response:', error);
    }
  }

  /**
   * Send invalid referral response
   * @param {import('discord.js').Message} message 
   * @param {string} referralCode 
   */
  async sendInvalidReferralResponse(message, referralCode) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('❌ Invalid Referral Code')
        .setDescription(
          `The referral code \`${referralCode}\` is not valid or has expired.\n\n` +
          `Please check with the person who shared it or use \`/start\` to see available options.`
        )
        .setColor('#ff0000')
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      this.logger.error('❌ Error sending invalid referral response:', error);
    }
  }

  /**
   * Extract referral code from message content
   * @param {string} content 
   * @returns {string|null}
   */
  extractReferralCode(content) {
    // Look for patterns like "REF123", "ref:ABC123", etc.
    const patterns = [
      /\bREF[A-Z0-9]{6,}\b/i,           // REF123456
      /\bref:([A-Z0-9]{6,})\b/i,        // ref:ABC123
      /\breferral[:\s]+([A-Z0-9]{6,})\b/i, // referral: ABC123
      /\b([A-Z0-9]{8,12})\b/             // Generic alphanumeric codes
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  }

  /**
   * Complete referral conversion
   * @param {string} referralCode 
   * @param {string} guildId 
   * @param {string} userId 
   * @returns {Promise<boolean>}
   */
  async completeReferralConversion(referralCode, guildId, userId) {
    try {
      this.logger.info(`🎯 Completing referral conversion: ${referralCode}`);
      
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
          completed_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.success(`✅ Referral conversion completed: ${referralCode}`);
      return true;
      
    } catch (error) {
      this.logger.error('❌ Error completing referral conversion:', error);
      return false;
    }
  }
}

module.exports = { ReferralHandler }; 