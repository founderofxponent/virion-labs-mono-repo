export type Campaign = {
  id: string; // Corresponds to campaign_id
  name: string; // Corresponds to campaign_name
  type: string;
  client_name: string;
  client_industry: string;
  guild_id: string;
  discord_server_name: string;
  description: string; // Corresponds to campaign_description
  campaign_start_date: string;
  campaign_end_date: string | null;
  total_interactions: number;
  referral_conversions: number;
  has_access: boolean;
  request_status: string;
  can_request_access: boolean;
};