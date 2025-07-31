import { CampaignOnboardingField } from '@/schemas/campaign-onboarding-field';

/**
 * Base interface for a campaign, aligned with Strapi schema.
 * This should be used for detailed campaign views and API responses.
 */
export interface Campaign {
  id: number;
  documentId: string;
  name: string;
  description?: string;
  campaign_type?: 'referral_onboarding' | 'community_engagement' | 'product_promotion' | 'custom' | 'vip_support';
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  guild_id: string;
  channel_id?: string;
  webhook_url?: string;
  welcome_message?: string;
  bot_name?: string;
  bot_avatar_url?: string;
  brand_color?: string;
  brand_logo_url?: string;
  total_interactions?: number;
  successful_onboardings?: number;
  referral_conversions?: number;
  metadata?: any;
  features?: any;
  client_id: string;
  client_name: string;
  client_industry: string;
  bot_personality?: string;
  bot_response_style?: string;
  auto_role_assignment?: boolean;
  target_role_ids?: any;
  referral_tracking_enabled?: boolean;
  moderation_enabled?: boolean;
  rate_limit_per_user?: number;
  auto_responses?: any;
  custom_commands?: any;
  total_investment?: number;
  value_per_conversion?: number;
  onboarding_questions?: CampaignOnboardingField[];
  landing_page_data?: any;
  client?: any;
  referral_links?: any[];
  campaign_influencer_accesses?: any[];
  campaign_landing_page?: any;
  campaign_onboarding_fields?: any[];
  campaign_onboarding_responses?: any[];
  campaign_onboarding_starts?: any[];
  campaign_onboarding_completions?: any[];
}

/**
 * A slimmed-down version of the Campaign interface for use in lists and tables.
 */
export type CampaignListItem = Pick<
  Campaign,
  | 'id'
  | 'documentId'
  | 'name'
  | 'campaign_type'
  | 'client_name'
  | 'client_industry'
  | 'guild_id'
  | 'description'
  | 'start_date'
  | 'end_date'
  | 'total_interactions'
  | 'referral_conversions'
  | 'is_active'
>;

/**
 * Interface for the data used in the Campaign Wizard form.
 */
export interface CampaignFormData {
  campaign_template: string;
  campaign_type: string;
  client: string;
  name: string;
  description: string;
  guild_id: string;
  channel_id: string;
  start_date: string;
  end_date: string;
  bot_name: string;
  bot_personality: string;
  bot_response_style: string;
  brand_color: string;
  brand_logo_url: string;
  welcome_message: string;
  auto_role_assignment: boolean;
  target_role_ids: string[];
  moderation_enabled: boolean;
  rate_limit_per_user: number;
  referral_tracking_enabled: boolean;
  webhook_url: string;
  landing_page_data?: any;
}

/**
 * Interface for creating a new campaign.
 */
export type CreateCampaignData = Omit<CampaignFormData, 'campaign_template'>;

/**
 * Interface for updating an existing campaign.
 */
export type UpdateCampaignData = Partial<CreateCampaignData>;

export interface CampaignInfluencerAccess {
  id: number;
  access_granted_at?: string;
  is_active?: boolean;
  request_status?: 'pending' | 'approved' | 'denied';
  requested_at?: string;
  request_message?: string;
  admin_response?: string;
  user?: any;
  campaign?: Campaign;
}

export interface CampaignOnboardingResponse {
  id: number;
  discord_user_id: string;
  discord_username?: string;
  field_key: string;
  field_value?: string;
  referral_id?: string;
  interaction_id?: string;
  referral_link?: any;
  campaign?: Campaign;
}

export interface CampaignOnboardingStart {
  id: number;
  discord_user_id: string;
  discord_username: string;
  guild_id?: string;
  started_at?: string;
  campaign?: Campaign;
}

export interface CampaignOnboardingCompletion {
  id: number;
  discord_user_id: string;
  discord_username: string;
  guild_id?: string;
  completed_at?: string;
  campaign?: Campaign;
}

export interface CampaignTemplate {
  id: string;
  documentId: string;
  name: string;
  description?: string;
  campaign_type: 'referral_onboarding' | 'community_engagement' | 'product_promotion' | 'custom' | 'vip_support';
  template_config: any;
  category?: string;
  is_default?: boolean;
  landing_page_template?: any;
}