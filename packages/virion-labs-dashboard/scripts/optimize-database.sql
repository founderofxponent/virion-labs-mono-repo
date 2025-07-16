-- Database optimization script for Virion Labs Dashboard
-- Run this in your Supabase SQL editor to improve query performance

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_referral_links_influencer_id ON referral_links(influencer_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_created_at ON referral_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_links_is_active ON referral_links(is_active);

CREATE INDEX IF NOT EXISTS idx_referrals_influencer_id ON referrals(influencer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_link_id ON referrals(referral_link_id);

CREATE INDEX IF NOT EXISTS idx_bots_client_id ON bots(client_id);
CREATE INDEX IF NOT EXISTS idx_bots_status ON bots(status);
CREATE INDEX IF NOT EXISTS idx_bots_created_at ON bots(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_analytics_link_id ON referral_analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_referral_analytics_created_at ON referral_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_analytics_event_type ON referral_analytics(event_type);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_referral_links_influencer_active ON referral_links(influencer_id, is_active);
CREATE INDEX IF NOT EXISTS idx_referrals_influencer_status ON referrals(influencer_id, status);
CREATE INDEX IF NOT EXISTS idx_bots_client_status ON bots(client_id, status);

-- Add partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_referral_links_active_only ON referral_links(influencer_id, created_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_referrals_completed_only ON referrals(influencer_id, created_at DESC) WHERE status = 'completed';

-- Analyze tables to update statistics
ANALYZE referral_links;
ANALYZE referrals;
ANALYZE bots;
ANALYZE clients;
ANALYZE user_profiles;
ANALYZE referral_analytics; 