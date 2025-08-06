import { Media, ReferralLink, CampaignInfluencerAccess } from '@/schemas';

export interface User {
  id: number;
  username: string;
  email: string;
  provider?: string;
  confirmed?: boolean;
  blocked?: boolean;
  role?: Role;
  full_name?: string;
  avatar_url?: Media;
  user_setting?: UserSetting;
  referral_links?: ReferralLink[];
  campaign_influencer_accesses?: CampaignInfluencerAccess[];
}

export interface UserSetting {
  id: number;
  bio?: string; // richtext in Strapi
  phone_number?: string;
  twitter_handle?: string;
  instagram_handle?: string;
  youtube_channel?: string;
  discord_username?: string;
  website_url?: string;
  email_notifications_new_referral?: boolean;
  email_notifications_link_clicks?: boolean;
  email_notifications_weekly_reports?: boolean;
  email_notifications_product_updates?: boolean;
  push_notifications_new_referral?: boolean;
  push_notifications_link_clicks?: boolean;
  push_notifications_weekly_reports?: boolean;
  push_notifications_product_updates?: boolean;
  profile_visibility?: 'public' | 'private';
  show_earnings?: boolean;
  show_referral_count?: boolean;
  webhook_url?: string;
  webhook_events?: any;
  api_key?: string;
  api_key_test?: string;
  api_key_regenerated_at?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  currency?: string;
  two_factor_enabled?: boolean;
  login_notifications?: boolean;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  type: string;
}