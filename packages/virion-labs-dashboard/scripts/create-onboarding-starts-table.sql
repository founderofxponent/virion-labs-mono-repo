-- Migration: Add campaign_onboarding_starts table for accurate completion rate tracking
-- Date: January 2025
-- Purpose: Track when users start onboarding to fix completion rate calculations

-- Create the campaign_onboarding_starts table
CREATE TABLE IF NOT EXISTS campaign_onboarding_starts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES discord_guild_campaigns(id) ON DELETE CASCADE,
    discord_user_id TEXT NOT NULL,
    discord_username TEXT NOT NULL,
    guild_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate tracking of the same user starting the same campaign
    UNIQUE(campaign_id, discord_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_onboarding_starts_campaign_id 
ON campaign_onboarding_starts(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_onboarding_starts_discord_user_id 
ON campaign_onboarding_starts(discord_user_id);

CREATE INDEX IF NOT EXISTS idx_campaign_onboarding_starts_started_at 
ON campaign_onboarding_starts(started_at);

-- Add comments for documentation
COMMENT ON TABLE campaign_onboarding_starts IS 'Tracks when users initiate onboarding sessions for accurate completion rate calculations';
COMMENT ON COLUMN campaign_onboarding_starts.campaign_id IS 'Reference to the campaign being started';
COMMENT ON COLUMN campaign_onboarding_starts.discord_user_id IS 'Discord user ID who started onboarding';
COMMENT ON COLUMN campaign_onboarding_starts.discord_username IS 'Discord username for display purposes';
COMMENT ON COLUMN campaign_onboarding_starts.guild_id IS 'Discord server where onboarding was started';
COMMENT ON COLUMN campaign_onboarding_starts.started_at IS 'Timestamp when onboarding was initiated';

-- RLS Policies (if needed)
-- ALTER TABLE campaign_onboarding_starts ENABLE ROW LEVEL SECURITY;

COMMIT; 