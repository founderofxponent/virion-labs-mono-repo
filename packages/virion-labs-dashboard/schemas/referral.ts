import { Media, Campaign, User, CampaignOnboardingResponse } from '@/schemas';

export interface ReferralLink {
  id: number;
  title: string;
  description?: string;
  platform: string;
  original_url: string;
  referral_code: string;
  referral_url: string;
  thumbnail_url?: Media[];
  clicks?: number;
  conversions?: number;
  conversion_rate?: number;
  earnings?: number;
  is_active?: boolean;
  expires_at?: string;
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