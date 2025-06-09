import { getCampaignTemplate, type CampaignTemplate } from './campaign-templates'

export interface CampaignWithTemplate {
  id: string
  campaign_name: string
  campaign_type: string
  template?: CampaignTemplate
  bot_config?: any
  onboarding_completion_requirements?: any
  configuration_version?: number
}

/**
 * Merges campaign template configuration with existing campaign data
 */
export function mergeCampaignWithTemplate(campaign: any): CampaignWithTemplate {
  const template = getCampaignTemplate(campaign.campaign_type)
  
  if (!template) {
    return {
      ...campaign,
      template: null
    }
  }

  // Merge bot configuration from template with campaign overrides
  const mergedBotConfig = {
    ...template.bot_config,
    // Override with campaign-specific values if they exist
    ...(campaign.prefix && { prefix: campaign.prefix }),
    ...(campaign.description && { description: campaign.description }),
    ...(campaign.bot_name && { bot_name: campaign.bot_name }),
    ...(campaign.bot_personality && { bot_personality: campaign.bot_personality }),
    ...(campaign.bot_response_style && { bot_response_style: campaign.bot_response_style }),
    ...(campaign.brand_color && { brand_color: campaign.brand_color }),
    ...(campaign.welcome_message && { welcome_message: campaign.welcome_message }),
    // Merge features
    features: {
      ...template.bot_config.features,
      ...(campaign.features || {})
    },
    // Merge custom commands
    custom_commands: [
      ...template.bot_config.custom_commands,
      ...(campaign.custom_commands || [])
    ],
    // Merge auto responses
    auto_responses: {
      ...template.bot_config.auto_responses,
      ...(campaign.auto_responses || {})
    },
    // Merge response templates
    response_templates: {
      ...template.bot_config.response_templates,
      ...(campaign.response_templates || {})
    }
  }

  return {
    ...campaign,
    template,
    bot_config: mergedBotConfig,
    onboarding_completion_requirements: campaign.onboarding_completion_requirements || 
      template.bot_config.onboarding_completion_requirements
  }
}

/**
 * Checks if a campaign's onboarding is complete based on template requirements
 */
export function checkOnboardingCompletion(
  campaign: CampaignWithTemplate,
  completedFieldIds: string[]
): {
  isComplete: boolean
  missingFields: string[]
  completionPercentage: number
  completionMessage?: string
} {
  const requirements = campaign.onboarding_completion_requirements ||
    campaign.template?.bot_config.onboarding_completion_requirements

  if (!requirements || !requirements.required_fields) {
    return {
      isComplete: true,
      missingFields: [],
      completionPercentage: 100
    }
  }

  const requiredFields = requirements.required_fields
  const missingFields = requiredFields.filter(fieldId => !completedFieldIds.includes(fieldId))
  const isComplete = missingFields.length === 0

  return {
    isComplete,
    missingFields,
    completionPercentage: Math.round((completedFieldIds.length / requiredFields.length) * 100),
    completionMessage: isComplete ? requirements.completion_message : undefined
  }
}

/**
 * Gets the bot response for a given trigger based on campaign template
 */
export function getBotResponse(campaign: CampaignWithTemplate, trigger: string): string | null {
  const botConfig = campaign.bot_config || campaign.template?.bot_config
  
  if (!botConfig) return null

  // Check auto responses first
  if (botConfig.auto_responses && botConfig.auto_responses[trigger]) {
    return botConfig.auto_responses[trigger]
  }

  // Check response templates
  if (botConfig.response_templates && botConfig.response_templates[trigger]) {
    return botConfig.response_templates[trigger]
  }

  return null
}

/**
 * Gets custom commands for a campaign based on template and overrides
 */
export function getCampaignCommands(campaign: CampaignWithTemplate) {
  const botConfig = campaign.bot_config || campaign.template?.bot_config
  
  if (!botConfig || !botConfig.custom_commands) {
    return []
  }

  return botConfig.custom_commands
}

/**
 * Validates if a campaign has all required template configurations
 */
export function validateCampaignConfiguration(campaign: CampaignWithTemplate): {
  isValid: boolean
  missingConfigurations: string[]
  warnings: string[]
} {
  const missingConfigurations: string[] = []
  const warnings: string[] = []

  if (!campaign.template) {
    missingConfigurations.push('campaign_template')
  }

  if (!campaign.bot_name) {
    missingConfigurations.push('bot_name')
  }

  if (!campaign.guild_id) {
    missingConfigurations.push('guild_id')
  }

  if (!campaign.campaign_name) {
    missingConfigurations.push('campaign_name')
  }

  // Check if using old configuration version
  if (!campaign.configuration_version || campaign.configuration_version < 2) {
    warnings.push('Campaign is using legacy configuration. Consider updating to use template system.')
  }

  // Check if template has onboarding but no fields are configured
  if (campaign.template?.bot_config.features.onboarding && 
      campaign.template?.onboarding_fields.length === 0) {
    warnings.push('Template enables onboarding but has no onboarding fields defined.')
  }

  return {
    isValid: missingConfigurations.length === 0,
    missingConfigurations,
    warnings
  }
}

/**
 * Generates a summary of campaign configuration for display
 */
export function getCampaignConfigSummary(campaign: CampaignWithTemplate) {
  const template = campaign.template
  const botConfig = campaign.bot_config || template?.bot_config

  return {
    templateName: template?.name || 'Custom',
    templateCategory: template?.category || 'custom',
    botName: botConfig?.bot_name || 'Bot',
    botPersonality: botConfig?.bot_personality || 'helpful',
    features: {
      onboarding: botConfig?.features?.onboarding || false,
      referralTracking: botConfig?.features?.referral_tracking || false,
      autoRole: botConfig?.features?.auto_role || false,
      moderation: botConfig?.features?.moderation || false,
      welcome: botConfig?.features?.welcome_enabled || false
    },
    onboardingFieldsCount: template?.onboarding_fields?.length || 0,
    customCommandsCount: botConfig?.custom_commands?.length || 0,
    autoResponsesCount: Object.keys(botConfig?.auto_responses || {}).length,
    completionRequirements: campaign.onboarding_completion_requirements || 
      template?.bot_config.onboarding_completion_requirements
  }
} 