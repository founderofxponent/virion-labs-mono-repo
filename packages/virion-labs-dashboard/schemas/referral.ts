import { Media, Campaign, User, CampaignOnboardingResponse } from '@/schemas';

// Unified referral link interface supporting both CRUD and analytics use cases
export interface ReferralLink {
  id: string | number;
  title: string;
  description?: string | null;
  platform: string;
  original_url: string;
  referral_code: string;
  referral_url: string;
  thumbnail_url?: string | Media[] | null;
  clicks: number;
  conversions: number;
  conversion_rate?: number | null;
  earnings?: number;
  is_active: boolean;
  expires_at?: string | null;
  created_at?: string;
  
  // Campaign context for analytics
  campaign_context?: {
    campaign_name: string;
    client_name: string;
  };
  
  // Campaign IDs for CRUD operations
  campaign_id?: string | null;
  campaign_name?: string | null;
  
  // Extended Strapi fields (optional)
  discord_invite_url?: string;
  discord_guild_id?: string;
  redirect_to_discord?: boolean;
  landing_page_enabled?: boolean;
  last_conversion_at?: string;
  private_channel_id?: string;
  access_role_id?: string;
  custom_invite_code?: string;
  metadata?: any;
  referral_analytics?: ReferralAnalytic[];
  campaign_onboarding_responses?: CampaignOnboardingResponse[];
  influencer?: User;
}

// Analytics-specific interface for metrics API
export interface InfluencerMetrics {
  total_links: number;
  active_links: number;
  total_clicks: number;
  total_conversions: number;
  total_earnings: number;
  overall_conversion_rate: number;
  links: ReferralLink[];
}

export interface ReferralAnalytic {
  id: number;
  event_type: string;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  conversion_value?: number;
  metadata?: any;
}

export interface Referral {
  id: string;
  name: string;
  email: string;
  discord_id: string | null;
  age: number | null;
  status: string;
  source_platform: string;
  created_at: string;
  conversion_value: number;
  referral_link: ReferralLink | null;
}

// Campaign-specific referral link types matching business-logic-api
export interface CampaignReferralLinkRequest {
  title: string;
  platform: string;
  original_url: string;
  campaign: number; // Required numeric campaign ID
  description?: string;
}

export interface CampaignReferralLinkResponse {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  platform: string;
  original_url: string;
  referral_code: string;
  referral_url: string;
  clicks?: number;
  conversions?: number;
  conversion_rate?: number;
  earnings?: number;
  is_active?: boolean;
  expires_at?: string;
  discord_invite_url?: string;
  redirect_to_discord?: boolean;
  landing_page_enabled?: boolean;
  metadata?: any;
}