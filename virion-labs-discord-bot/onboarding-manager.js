const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

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
      console.log(`🚀 startOnboarding called for ${author.tag} in campaign ${campaignId}`);
      console.log(`📋 Options:`, { referralCode, hasReferralValidation: !!referralValidation, forceRestart, autoStart });
      
      // Check if user wants to restart or if this is a new session
      const shouldRestart = forceRestart || (message.content && (message.content.toLowerCase().includes('restart') || message.content.toLowerCase().includes('reset')));
      
      // If not forcing restart and not auto-starting, check for existing incomplete session
      if (!shouldRestart && !autoStart) {
        console.log(`🔍 Checking for existing incomplete session...`);
        const existingSession = await this.checkDatabaseSession(campaignId, userId, author.tag);
        if (existingSession && !existingSession.is_completed && existingSession.next_field) {
          console.log(`🔄 Found incomplete session for ${author.tag}, resuming with modal...`);
          await this.showOnboardingModal(message, config, existingSession);
          return true;
        }
      }

      console.log(`🚀 Starting ${shouldRestart ? 'new' : autoStart ? 'auto' : 'fresh'} modal onboarding session for ${author.tag}`);

      const session = await this.getOrCreateSession(campaignId, userId, author.tag || author.username, {
        referralId: referralValidation?.referral_id,
        referralLinkId: referralValidation?.referral_link_id,
        referralCode
      });

      console.log(`📋 Session creation result:`, {
        success: session.success !== false,
        hasFields: session.fields?.length || 0,
        isCompleted: session.is_completed
      });

      if (!session.success) {
        throw new Error(session.error || 'Failed to create onboarding session');
      }

      if (!session.fields || session.fields.length === 0) {
        console.log(`✅ No fields configured, completing onboarding immediately`);
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

      // Show onboarding modal instead of asking individual questions
      console.log(`🎯 Proceeding to show onboarding modal...`);
      await this.showOnboardingModal(message, config, session, { autoStart, referralValidation });
      
      return true;

    } catch (error) {
      console.error('Error starting modal onboarding:', error);
      console.error('Error stack:', error.stack);
      await this.sendErrorMessage(message, 'Sorry, there was an error starting the onboarding process. Please try again.');
      return false;
    }
  }

  async handleResponse(message, config) {
    const author = message.author || message.user;
    const userId = author.id;
    const campaignId = config.campaignId;
    
    // Check if user has an existing session and redirect to modal system
    console.log(`🔄 User ${author.tag} sent a message during onboarding - redirecting to modal system...`);
    
    const databaseSession = await this.checkDatabaseSession(campaignId, userId, author.tag);
    
    if (databaseSession && !databaseSession.is_completed) {
      const embed = new EmbedBuilder()
        .setTitle('📝 Continue Your Onboarding')
        .setDescription(`Hi ${author.username}! I see you started the onboarding process but haven't finished yet.\n\nPlease use the button below to continue with our streamlined form instead of typing individual responses.`)
        .setColor(config.config?.brand_color || '#6366f1')
        .setTimestamp();

      const continueButton = new ButtonBuilder()
        .setCustomId(`start_onboarding_${campaignId}_${userId}`)
        .setLabel('Continue Onboarding')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝');

      const row = new ActionRowBuilder().addComponents(continueButton);

      await message.reply({ 
        embeds: [embed], 
        components: [row]
      });

      // Store session info for button interaction
      this.storeSessionForModal(campaignId, userId, {
        fields: this.getIncompleteFields(databaseSession),
        config,
        referralValidation: databaseSession.referralValidation
      });

      return true;
    } else if (databaseSession && databaseSession.is_completed) {
      await this.showCompletionMessage(message, config);
      return true;
    } else {
      // Start new onboarding with modal system
      await this.startOnboarding(message, config);
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

  // Legacy method - now redirects to modal system
  async askNextQuestion(message, config, session) {
    console.log(`⚠️ askNextQuestion called - redirecting to modal system for ${(message.author || message.user).tag}`);
    await this.showOnboardingModal(message, config, session);
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

    try {
      if (message.isButton && message.isButton()) {
        // This is a button interaction
        if (!message.replied && !message.deferred) {
          await message.reply({ embeds: [embed], flags: 64 }); // Ephemeral reply
        } else {
          await message.followUp({ embeds: [embed], flags: 64 });
        }
      } else {
        // This is a regular message
        await message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error sending completion message:', error);
    }

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

    try {
      if (message.isButton && message.isButton()) {
        // This is a button interaction
        if (!message.replied && !message.deferred) {
          await message.reply({ embeds: [embed], flags: 64 }); // Ephemeral reply
        } else {
          await message.followUp({ embeds: [embed], flags: 64 });
        }
      } else {
        // This is a regular message
        await message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error sending completion message:', error);
    }
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

    try {
      // Handle both message objects and interaction objects
      if (message.isButton && message.isButton()) {
        // This is a button interaction
        if (!message.replied && !message.deferred) {
          await message.reply({ embeds: [embed], flags: 64 }); // Ephemeral reply
        } else {
          await message.followUp({ embeds: [embed], flags: 64 });
        }
      } else {
        // This is a regular message
        await message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error sending error message:', error);
      // Fallback: try to send a message to the channel if reply fails
      try {
        if (message.channel) {
          await message.channel.send({ 
            content: `⚠️ Error: ${errorText}`,
            flags: message.isButton && message.isButton() ? 64 : undefined
          });
        }
      } catch (fallbackError) {
        console.error('Fallback error message also failed:', fallbackError);
      }
    }
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

  // Legacy method - now uses modal system
  async resumeOnboarding(message, config, session) {
    console.log(`🔄 resumeOnboarding called - using modal system for ${(message.author || message.user).tag}`);
    await this.showOnboardingModal(message, config, session);
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

  async showOnboardingModal(message, config, session, options = {}) {
    const { autoStart = false, referralValidation = null } = options;
    
    try {
      console.log(`🚀 showOnboardingModal called for ${(message.author || message.user).tag}`);
      console.log(`📋 Session data:`, {
        campaignId: config.campaignId,
        hasFields: session?.fields?.length || 0,
        isCompleted: session?.is_completed
      });
      
      // Get incomplete fields for the modal
      const incompleteFields = this.getIncompleteFields(session);
      console.log(`🔍 Found ${incompleteFields.length} incomplete fields`);
      
      if (incompleteFields.length === 0) {
        console.log(`✅ No incomplete fields, completing onboarding`);
        await this.completeOnboarding(message, config, referralValidation);
        return;
      }

      // Send introduction message first
      const introEmbed = new EmbedBuilder()
        .setTitle('📝 Let\'s Get You Started!')
        .setDescription(`Hi ${(message.author || message.user).username}! Welcome to **${config.clientName}**.\n\nI'm going to show you a form with ${incompleteFields.length} question${incompleteFields.length > 1 ? 's' : ''} to get you set up with all the best features our community has to offer.\n\n✨ This will only take a minute!`)
        .setColor(config.config?.brand_color || '#6366f1')
        .setTimestamp();

      if (referralValidation && referralValidation.influencer) {
        introEmbed.addFields([{
          name: '🤝 Referral Benefits',
          value: `You joined through **${referralValidation.influencer.name}'s** referral link, so you'll get some exclusive perks once we're done!`,
          inline: false
        }]);
      }

      const userId = (message.author || message.user).id;
      const startButton = new ButtonBuilder()
        .setCustomId(`start_onboarding_${config.campaignId}_${userId}`)
        .setLabel('Start Onboarding')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🚀');

      console.log(`🔘 Created button with customId: start_onboarding_${config.campaignId}_${userId}`);

      const row = new ActionRowBuilder().addComponents(startButton);

      try {
        if (message.isButton && message.isButton()) {
          // This is a button interaction
          if (!message.replied && !message.deferred) {
            await message.reply({ 
              embeds: [introEmbed], 
              components: [row],
              flags: 64 // Ephemeral reply
            });
          } else {
            await message.followUp({ 
              embeds: [introEmbed], 
              components: [row],
              flags: 64
            });
          }
        } else {
          // This is a regular message
          await message.reply({ 
            embeds: [introEmbed], 
            components: [row]
          });
        }
      } catch (error) {
        console.error('Error sending onboarding modal introduction:', error);
        await this.sendErrorMessage(message, 'Sorry, there was an error preparing the onboarding form. Please try again.');
        return;
      }

      console.log(`📧 Sent introduction message to ${(message.author || message.user).tag}`);

      // Store session info for button interaction
      console.log(`📦 About to store session for campaignId: ${config.campaignId}, userId: ${userId}`);
      console.log(`📊 Session data to store:`, {
        fieldsCount: incompleteFields.length,
        hasConfig: !!config,
        hasReferralValidation: !!referralValidation
      });
      
      this.storeSessionForModal(config.campaignId, userId, {
        fields: incompleteFields,
        config,
        referralValidation
      });

      console.log(`✅ Session storage completed for ${(message.author || message.user).tag}`);

    } catch (error) {
      console.error('Error showing onboarding modal:', error);
      console.error('Error stack:', error.stack);
      await this.sendErrorMessage(message, 'Sorry, there was an error preparing the onboarding form. Please try again.');
    }
  }

  getIncompleteFields(session) {
    if (!session.fields) return [];
    
    const completedFieldKeys = new Set(
      session.existing_responses?.filter(r => r.field_value && r.field_value.trim() !== '').map(r => r.field_key) || []
    );

    return session.fields.filter(field => !completedFieldKeys.has(field.field_key));
  }

  async storeSessionForModal(campaignId, userId, sessionData) {
    try {
      console.log(`📦 Storing modal session in database for campaignId: ${campaignId}, userId: ${userId}`);
      console.log(`📊 Session data to store:`, {
        fieldsCount: sessionData.fields?.length || 0,
        hasConfig: !!sessionData.config,
        hasReferralValidation: !!sessionData.referralValidation
      });

      const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding/modal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          discord_user_id: userId,
          discord_username: sessionData.config?.clientName || 'Unknown',
          session_data: sessionData
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Modal session stored in database successfully: ${result.session_id}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to store modal session in database: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error storing modal session in database:', error);
    }
  }

  async getStoredModalSession(campaignId, userId) {
    try {
      console.log(`🔍 Looking for modal session in database: ${campaignId} / ${userId}`);
      
      const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding/modal-session?campaign_id=${campaignId}&discord_user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.session) {
          console.log(`✅ Retrieved modal session from database, fields: ${result.session.fields?.length || 0}`);
          return result.session;
        } else {
          console.log(`❌ No modal session found in database for ${userId} in campaign ${campaignId}`);
          return null;
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to retrieve modal session from database: ${response.status} - ${errorText}`);
        return null;
      }
    } catch (error) {
      console.error('❌ Error retrieving modal session from database:', error);
      return null;
    }
  }

  async clearModalSession(campaignId, userId) {
    try {
      console.log(`🗑️ Clearing modal session from database: ${campaignId} / ${userId}`);
      
      const response = await fetch(`${DASHBOARD_API_URL}/discord-bot/onboarding/modal-session?campaign_id=${campaignId}&discord_user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Virion-Discord-Bot/2.0'
        }
      });

      if (response.ok) {
        console.log(`✅ Modal session cleared from database successfully`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to clear modal session from database: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error clearing modal session from database:', error);
    }
  }
}

module.exports = OnboardingManager;
