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
    const { referralCode, referralValidation, forceRestart = false, autoStart = false } = options;
    const author = message.author || message.user;
    const userId = author.id;
    const campaignId = config.campaignId;
    
    try {
      // Check if user wants to restart or if this is a new session
      const shouldRestart = forceRestart || message.content.toLowerCase().includes('restart') || message.content.toLowerCase().includes('reset');
      
      // If not forcing restart and not auto-starting, check for existing incomplete session
      if (!shouldRestart && !autoStart) {
        const existingSession = await this.checkDatabaseSession(campaignId, userId, author.tag);
        if (existingSession && !existingSession.is_completed && existingSession.next_field) {
          console.log(`🔄 Found incomplete session for ${author.tag}, resuming...`);
          await this.resumeOnboarding(message, config, existingSession);
          return true;
        }
      }

      console.log(`🚀 Starting ${shouldRestart ? 'new' : autoStart ? 'auto' : 'fresh'} onboarding session for ${author.tag}`);

      const session = await this.getOrCreateSession(campaignId, userId, author.tag || author.username, {
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
        if (autoStart) {
          // For auto-start, send a welcome message indicating they already completed onboarding
          const welcomeEmbed = new EmbedBuilder()
            .setTitle('🎉 Welcome Back!')
            .setDescription(`Welcome to **${config.clientName}**!\n\nYou've already completed the onboarding process for **${config.campaignName}**. You're all set to enjoy all the community features!`)
            .setColor(config.config?.brand_color || '#00aa00')
            .setTimestamp();

          await message.reply({ embeds: [welcomeEmbed] });
        } else {
          await this.showCompletionMessage(message, config);
        }
        return true;
      }

      // If auto-starting, send an intro message before the first question
      if (autoStart) {
        const introEmbed = new EmbedBuilder()
          .setTitle('🚀 Welcome! Let\'s Get You Started')
          .setDescription(`Hi ${(message.author || message.user).username}! Welcome to **${config.clientName}**.\n\nI'm going to ask you a few quick questions to get you set up with all the best features our community has to offer.\n\n✨ This will only take a minute!`)
          .setColor(config.config?.brand_color || '#6366f1')
          .setTimestamp();

        if (referralValidation && referralValidation.influencer) {
          introEmbed.addFields([{
            name: '🤝 Referral Benefits',
            value: `You joined through **${referralValidation.influencer.name}'s** referral link, so you'll get some exclusive perks once we're done!`,
            inline: false
          }]);
        }

        await message.reply({ embeds: [introEmbed] });
        
        // Small delay before asking the first question
        setTimeout(async () => {
          await this.askNextQuestion(message, config, session);
        }, 1500);
      } else {
        await this.askNextQuestion(message, config, session);
      }
      
      return true;

    } catch (error) {
      console.error('Error starting onboarding:', error);
      await this.sendErrorMessage(message, 'Sorry, there was an error starting the onboarding process. Please try again.');
      return false;
    }
  }

  async handleResponse(message, config) {
    const author = message.author || message.user;
    const userId = author.id;
    const campaignId = config.campaignId;
    const sessionKey = `${campaignId}:${userId}`;
    
    let activeSession = activeSessions.get(sessionKey);
    
    // If no active session in memory, try to restore from database
    if (!activeSession || Date.now() - activeSession.timestamp > SESSION_TIMEOUT) {
      console.log(`🔄 No active session found for ${author.tag}, checking database...`);
      const databaseSession = await this.checkDatabaseSession(campaignId, userId, author.tag);
      
      if (databaseSession && !databaseSession.is_completed && databaseSession.next_field) {
        console.log(`✅ Restored session from database for ${author.tag}`);
        // Restore session in memory
        activeSessions.set(sessionKey, {
          currentField: databaseSession.next_field,
          timestamp: Date.now(),
          progress: databaseSession.progress || { completed: 0, total: 1 },
          referralInfo: databaseSession.referralInfo || {},
          referralValidation: databaseSession.referralValidation
        });
        activeSession = activeSessions.get(sessionKey);
      } else {
        const embed = new EmbedBuilder()
          .setTitle('❌ Session Expired')
          .setDescription('Your onboarding session has expired or is complete. Please start over by typing "start".')
          .setColor('#ff0000')
          .setTimestamp();
        
        await message.reply({ embeds: [embed] });
        this.clearSession(sessionKey);
        return false;
      }
    }

    const { currentField } = activeSession;
    
    if (!currentField) {
      return false;
    }

    try {
      const saveResult = await this.saveResponse(
        campaignId,
        userId,
        (message.author || message.user).tag,
        currentField.field_key,
        message.content,
        activeSession.referralInfo
      );

      if (!saveResult.success) {
        await this.sendErrorMessage(message, saveResult.error || 'Invalid response. Please try again.');
        return true;
      }

      const updatedSession = await this.getOrCreateSession(campaignId, userId, (message.author || message.user).tag);
      
      if (updatedSession.is_completed) {
        await this.completeOnboarding(message, config, activeSession.referralValidation);
        this.clearSession(sessionKey);
      } else {
        // Update the active session with the new field info before asking next question
        activeSessions.set(sessionKey, {
          currentField: updatedSession.next_field,
          timestamp: Date.now(),
          progress: updatedSession.progress || { completed: 0, total: 1 },
          referralInfo: activeSession.referralInfo || {},
          referralValidation: activeSession.referralValidation
        });
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
      console.log(`📋 Getting/creating onboarding session for ${username} in campaign ${campaignId}`);
      
      const getResponse = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding?campaign_id=${campaignId}&discord_user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        }
      });

      if (getResponse.ok) {
        const session = await getResponse.json();
        console.log(`✅ Retrieved existing session for ${username}: completed=${session.is_completed}, next_field=${session.next_field ? session.next_field.field_key : 'none'}`);
        return session;
      }

      console.log(`📝 Creating new onboarding session for ${username}`);
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
        const errorText = await createResponse.text();
        console.error(`❌ Failed to create session: ${createResponse.status} - ${errorText}`);
        throw new Error(`HTTP ${createResponse.status}: ${createResponse.statusText} - ${errorText}`);
      }

      const newSession = await createResponse.json();
      console.log(`✅ Created new session for ${username}: fields=${newSession.fields?.length || 0}`);
      return newSession;

    } catch (error) {
      console.error('❌ Error getting/creating onboarding session:', error);
      return { success: false, error: error.message };
    }
  }

  async saveResponse(campaignId, userId, username, fieldKey, fieldValue, referralInfo = {}) {
    try {
      console.log(`💾 Saving response for ${username}: ${fieldKey} = "${fieldValue}"`);
      
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
        console.error(`❌ Failed to save response: ${response.status} - ${errorData.error}`);
        return { success: false, error: errorData.error };
      }

      const result = await response.json();
      console.log(`✅ Response saved successfully. Completed: ${result.is_completed}, Next field: ${result.next_field ? result.next_field.field_key : 'none'}`);
      return result;

    } catch (error) {
      console.error('❌ Error saving onboarding response:', error);
      return { success: false, error: error.message };
    }
  }

  async askNextQuestion(message, config, session) {
    const userId = (message.author || message.user).id;
    const campaignId = config.campaignId;
    const sessionKey = `${campaignId}:${userId}`;

    if (!session.next_field) {
      // If there's no next field but we're in askNextQuestion, 
      // completion should have already been handled by handleResponse
      console.log(`⚠️ No next field in askNextQuestion for ${(message.author || message.user).tag} - completion should have been handled already`);
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
    const user = message.author || message.user;
    const userId = user.id;
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

    if (config.config?.auto_role_assignment) {
      if (Array.isArray(config.config.target_role_ids) && config.config.target_role_ids.length > 0) {
        await this.assignRoles(message, config.config.target_role_ids);
      } else if (config.config?.target_role_id) {
        await this.assignRoles(message, [config.config.target_role_id]);
      }
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

  async assignRoles(message, roleIds) {
    try {
      for (const roleId of roleIds) {
        const role = message.guild.roles.cache.get(roleId);
        if (role && message.member) {
          await message.member.roles.add(role);

          const roleEmbed = new EmbedBuilder()
            .setTitle('🎖️ Role Assigned!')
            .setDescription(`You've been assigned the **${role.name}** role!`)
            .setColor('#00aa00')
            .setTimestamp();

          await message.followUp({ embeds: [roleEmbed] });
          console.log(`✅ Assigned role ${role.name} to ${(message.author || message.user).tag} after onboarding completion`);
        }
      }
    } catch (error) {
      console.error('Error assigning roles:', error);
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
          discord_user_id: (message.author || message.user).id,
          discord_username: (message.author || message.user).tag,
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
        console.log(`✅ Successfully tracked onboarding completion for ${(message.author || message.user).tag}`);
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
            discord_user_id: (message.author || message.user).id,
            discord_username: (message.author || message.user).tag,
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
            discord_user_id: (message.author || message.user).id,
            discord_username: (message.author || message.user).tag,
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

  // Check database for existing incomplete onboarding session
  async checkDatabaseSession(campaignId, userId, username) {
    try {
      const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding?campaign_id=${campaignId}&discord_user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        }
      });

      if (response.ok) {
        const session = await response.json();
        console.log(`📋 Database session check for ${username}: completed=${session.is_completed}, next_field=${session.next_field ? session.next_field.field_key : 'none'}`);
        return session;
      }

      return null;
    } catch (error) {
      console.error('Error checking database session:', error);
      return null;
    }
  }

  // Resume onboarding from where user left off
  async resumeOnboarding(message, config, session) {
    const user = message.author || message.user;
    const userId = user.id;
    const campaignId = config.campaignId;
    const sessionKey = `${campaignId}:${userId}`;

    console.log(`🔄 Resuming onboarding for ${user.tag} from field: ${session.next_field.field_key}`);

    // Store session in memory
    activeSessions.set(sessionKey, {
      currentField: session.next_field,
      timestamp: Date.now(),
      progress: session.progress || { completed: session.completed_fields?.length || 0, total: session.fields?.length || 1 },
      referralInfo: session.referralInfo || {},
      referralValidation: session.referralValidation
    });

    // Ask the next question
    await this.askNextQuestion(message, config, session);
  }

  // Check if onboarding is complete based on campaign template requirements
  async checkOnboardingCompletion(userId, campaignId, config) {
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
}

module.exports = OnboardingManager;
