const { EmbedBuilder } = require("discord.js");

// Configuration
const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000/api';
const DEBUG = process.env.DEBUG === 'true';

// Active onboarding sessions (in-memory store)
const activeSessions = new Map();

// Session timeout (15 minutes)
const SESSION_TIMEOUT = 15 * 60 * 1000;

class OnboardingManager {
  constructor() {
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  async startOnboarding(message, config, options = {}) {
    const { referralCode, referralValidation } = options;
    const userId = message.author.id;
    const campaignId = config.campaignId;
    
    try {
      const session = await this.getOrCreateSession(campaignId, userId, message.author.tag, {
        referralId: referralValidation?.referral_id,
        referralLinkId: referralValidation?.referral_link_id,
        referralCode
      });

      if (!session.success) {
        throw new Error(session.error || 'Failed to create onboarding session');
      }

      if (!session.fields || session.fields.length === 0) {
        await this.completeOnboarding(message, config, referralValidation);
        return true;
      }

      if (session.is_completed) {
        await this.showCompletionMessage(message, config);
        return true;
      }

      await this.askNextQuestion(message, config, session);
      return true;

    } catch (error) {
      console.error('Error starting onboarding:', error);
      await this.sendErrorMessage(message, 'Sorry, there was an error starting the onboarding process. Please try again.');
      return false;
    }
  }

  async handleResponse(message, config) {
    const userId = message.author.id;
    const campaignId = config.campaignId;
    const sessionKey = `${campaignId}:${userId}`;
    
    const activeSession = activeSessions.get(sessionKey);
    
    if (!activeSession || Date.now() - activeSession.timestamp > SESSION_TIMEOUT) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Session Expired')
        .setDescription('Your onboarding session has expired. Please start over by sending a message with your referral code.')
        .setColor('#ff0000')
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      this.clearSession(sessionKey);
      return false;
    }

    const { currentField } = activeSession;
    
    if (!currentField) {
      return false;
    }

    try {
      const saveResult = await this.saveResponse(
        campaignId,
        userId,
        message.author.tag,
        currentField.field_key,
        message.content,
        activeSession.referralInfo
      );

      if (!saveResult.success) {
        await this.sendErrorMessage(message, saveResult.error || 'Invalid response. Please try again.');
        return true;
      }

      const updatedSession = await this.getOrCreateSession(campaignId, userId, message.author.tag);
      
      if (updatedSession.is_completed) {
        await this.completeOnboarding(message, config, activeSession.referralValidation);
        this.clearSession(sessionKey);
      } else {
        await this.askNextQuestion(message, config, updatedSession);
      }

      return true;

    } catch (error) {
      console.error('Error handling onboarding response:', error);
      await this.sendErrorMessage(message, 'Sorry, there was an error processing your response. Please try again.');
      return true;
    }
  }

  async getOrCreateSession(campaignId, userId, username, referralInfo = {}) {
    try {
      const getResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding?campaign_id=${campaignId}&discord_user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        }
      });

      if (getResponse.ok) {
        return await getResponse.json();
      }

      const createResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          discord_user_id: userId,
          discord_username: username,
          referral_id: referralInfo.referralId,
          referral_link_id: referralInfo.referralLinkId
        })
      });

      if (!createResponse.ok) {
        throw new Error(`HTTP ${createResponse.status}: ${createResponse.statusText}`);
      }

      return await createResponse.json();

    } catch (error) {
      console.error('Error getting/creating onboarding session:', error);
      return { success: false, error: error.message };
    }
  }

  async saveResponse(campaignId, userId, username, fieldKey, fieldValue, referralInfo = {}) {
    try {
      const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          discord_user_id: userId,
          discord_username: username,
          field_key: fieldKey,
          field_value: fieldValue,
          referral_id: referralInfo.referralId,
          referral_link_id: referralInfo.referralLinkId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }

      return await response.json();

    } catch (error) {
      console.error('Error saving onboarding response:', error);
      return { success: false, error: error.message };
    }
  }

  async askNextQuestion(message, config, session) {
    const userId = message.author.id;
    const campaignId = config.campaignId;
    const sessionKey = `${campaignId}:${userId}`;

    if (!session.next_field) {
      await this.completeOnboarding(message, config);
      return;
    }

    const field = session.next_field;
    const progress = session.progress || { completed: 0, total: 1 };

    const progressBar = this.createProgressBar(progress.completed, progress.total);

    const embed = new EmbedBuilder()
      .setTitle(`📝 ${config.campaignName} - Onboarding`)
      .setDescription(`**Question ${progress.completed + 1} of ${progress.total}**\n\n${field.field_label}`)
      .setColor(config.config?.brand_color || '#6366f1')
      .setTimestamp()
      .addFields([
        {
          name: 'Progress',
          value: progressBar,
          inline: false
        }
      ]);

    if (field.field_description) {
      embed.addFields([{
        name: 'ℹ️ Additional Info',
        value: field.field_description,
        inline: false
      }]);
    }

    if (field.field_placeholder) {
      embed.addFields([{
        name: '💡 Example',
        value: field.field_placeholder,
        inline: false
      }]);
    }

    let guidance = '';
    switch (field.field_type) {
      case 'email':
        guidance = '📧 Please provide a valid email address';
        break;
      case 'number':
        guidance = '🔢 Please provide a number';
        break;
      case 'select':
        if (field.field_options && field.field_options.length > 0) {
          guidance = `🎯 Please choose one of: ${field.field_options.join(', ')}`;
        }
        break;
      case 'checkbox':
        guidance = '☑️ Please answer with yes/no or true/false';
        break;
      case 'date':
        guidance = '📅 Please provide a date (YYYY-MM-DD format)';
        break;
      default:
        guidance = '✏️ Please provide your answer';
    }

    embed.addFields([{
      name: '📝 How to respond',
      value: guidance,
      inline: false
    }]);

    activeSessions.set(sessionKey, {
      currentField: field,
      timestamp: Date.now(),
      progress: progress,
      referralInfo: session.referralInfo || {},
      referralValidation: session.referralValidation
    });

    await message.reply({ embeds: [embed] });
  }

  async completeOnboarding(message, config, referralValidation = null) {
    const userId = message.author.id;
    const campaignId = config.campaignId;
    const sessionKey = `${campaignId}:${userId}`;

    this.clearSession(sessionKey);

    let completionMessage = `🎉 **Welcome to ${config.clientName}!**\n\nThank you for completing the onboarding process!`;
    
    if (referralValidation && referralValidation.influencer) {
      completionMessage += `\n\n🤝 You joined through **${referralValidation.influencer.name}'s** referral link.`;
    }

    completionMessage += `\n\n✨ **What's next?**`;
    completionMessage += `\n• Explore our community channels`;
    completionMessage += `\n• Connect with other members`;
    completionMessage += `\n• Get exclusive campaign benefits`;

    const embed = new EmbedBuilder()
      .setTitle('🎉 Onboarding Complete!')
      .setDescription(completionMessage)
      .setColor('#00ff00')
      .setTimestamp();

    if (config.config?.completion_message) {
      embed.addFields([{
        name: '📋 Important',
        value: config.config.completion_message,
        inline: false
      }]);
    }

    await message.reply({ embeds: [embed] });

    if (config.config?.auto_role_assignment && config.config?.target_role_id) {
      await this.assignRole(message, config.config.target_role_id);
    }

    await this.trackCompletion(message, config, referralValidation);
  }

  async showCompletionMessage(message, config) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Already Completed')
      .setDescription(`You have already completed the onboarding process for **${config.campaignName}**.\n\nWelcome back! If you need help, feel free to ask.`)
      .setColor('#00aa00')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  async assignRole(message, roleId) {
    try {
      const role = message.guild.roles.cache.get(roleId);
      if (role && message.member) {
        await message.member.roles.add(role);
        
        const roleEmbed = new EmbedBuilder()
          .setTitle('🎖️ Role Assigned!')
          .setDescription(`You've been assigned the **${role.name}** role!`)
          .setColor('#00aa00')
          .setTimestamp();
        
        await message.followUp({ embeds: [roleEmbed] });
        console.log(`✅ Assigned role ${role.name} to ${message.author.tag} after onboarding completion`);
      }
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  }

  async trackCompletion(message, config, referralValidation = null) {
    try {
      // Track onboarding completion interaction
      const trackingResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify({
          guild_id: message.guild?.id,
          channel_id: message.channel.id,
          discord_user_id: message.author.id,
          discord_username: message.author.tag,
          message_id: message.id,
          interaction_type: 'onboarding_completed',
          message_content: 'Onboarding process completed',
          bot_response: 'Onboarding completion tracked',
          referral_code: referralValidation?.referral_code || null
        })
      });

      if (!trackingResponse.ok) {
        console.error('Failed to track onboarding completion:', trackingResponse.status);
      } else {
        console.log(`✅ Successfully tracked onboarding completion for ${message.author.tag}`);
      }

      // Increment successful_onboardings count in campaign
      try {
        const incrementResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Virion-Discord-Bot/2.0'
          },
          body: JSON.stringify({
            campaign_id: config.campaignId,
            discord_user_id: message.author.id,
            discord_username: message.author.tag,
            guild_id: message.guild?.id
          })
        });

        if (incrementResponse.ok) {
          const incrementResult = await incrementResponse.json();
          console.log(`✅ Incremented successful_onboardings for campaign: ${config.campaignId}`);
        } else {
          console.error('❌ Failed to increment successful_onboardings:', incrementResponse.status);
        }
      } catch (error) {
        console.error('❌ Error incrementing successful_onboardings:', error);
      }

      // Handle referral completion if applicable
      if (referralValidation && referralValidation.referral_code) {
        const completionResponse = await fetch(`${DASHBOARD_API_URL}/referral/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Virion-Discord-Bot/2.0'
          },
          body: JSON.stringify({
            referral_code: referralValidation.referral_code,
            discord_user_id: message.author.id,
            discord_username: message.author.tag,
            guild_id: message.guild.id,
            conversion_source: 'onboarding_completion'
          })
        });
        
        if (completionResponse.ok) {
          const completionResult = await completionResponse.json();
          console.log(`✅ Referral completion recorded via onboarding: ${completionResult.referral_id}`);
        } else {
          console.error('❌ Failed to record referral completion via onboarding:', completionResponse.status);
        }
      }

    } catch (error) {
      console.error('Error tracking onboarding completion:', error);
    }
  }

  isInOnboardingSession(userId, campaignId) {
    const sessionKey = `${campaignId}:${userId}`;
    const session = activeSessions.get(sessionKey);
    
    if (!session) return false;
    
    if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
      this.clearSession(sessionKey);
      return false;
    }
    
    return true;
  }

  clearSession(sessionKey) {
    activeSessions.delete(sessionKey);
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [key, session] of activeSessions.entries()) {
      if (now - session.timestamp > SESSION_TIMEOUT) {
        activeSessions.delete(key);
      }
    }
  }

  createProgressBar(completed, total) {
    const percentage = Math.round((completed / total) * 100);
    const filledBars = Math.round((completed / total) * 10);
    const emptyBars = 10 - filledBars;
    
    return `${'█'.repeat(filledBars)}${'░'.repeat(emptyBars)} ${percentage}% (${completed}/${total})`;
  }

  async sendErrorMessage(message, errorText) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(errorText)
      .setColor('#ff0000')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
}

// Check if onboarding is complete based on campaign template requirements
async function checkOnboardingCompletion(userId, campaignId, config) {
  try {
    const completionRequirements = config.config.onboarding_completion_requirements || {};
    
    if (!completionRequirements.required_fields || completionRequirements.required_fields.length === 0) {
      // No specific requirements, consider complete if any responses exist
      return { isComplete: true, message: 'Onboarding completed!' };
    }

    // Check completion via dashboard API
    const response = await fetch(`${process.env.DASHBOARD_API_URL}/campaign-onboarding-responses/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Virion-Discord-Bot/2.0'
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        discord_user_id: userId
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        isComplete: result.completed,
        message: result.completed 
          ? (result.completion_message || 'Congratulations! Your onboarding is complete.')
          : `Please complete the remaining fields: ${result.missing_fields?.join(', ') || 'unknown'}`,
        autoRole: result.auto_role_on_completion,
        completionPercentage: result.completion_percentage || 0
      };
    }

    return { isComplete: false, message: 'Unable to check completion status.' };
  } catch (error) {
    console.error('Error checking onboarding completion:', error);
    return { isComplete: false, message: 'Error checking completion status.' };
  }
}

module.exports = OnboardingManager;
