-- Migration: Add archived fields to discord_guild_campaigns table
-- This allows campaigns to be archived instead of deleted, preserving all data and relationships

-- Add archived fields to discord_guild_campaigns table
ALTER TABLE discord_guild_campaigns 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better performance when filtering archived campaigns
CREATE INDEX IF NOT EXISTS idx_discord_guild_campaigns_archived ON discord_guild_campaigns(archived);
CREATE INDEX IF NOT EXISTS idx_discord_guild_campaigns_archived_at ON discord_guild_campaigns(archived_at);

-- Update existing campaigns to ensure they are not archived by default
UPDATE discord_guild_campaigns 
SET archived = false 
WHERE archived IS NULL;

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN discord_guild_campaigns.archived IS 'Indicates if the campaign has been archived instead of deleted';
COMMENT ON COLUMN discord_guild_campaigns.archived_at IS 'Timestamp when the campaign was archived';

-- Create a function to archive campaigns (optional, for consistency)
CREATE OR REPLACE FUNCTION archive_campaign(campaign_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE discord_guild_campaigns 
    SET 
        archived = true,
        archived_at = NOW(),
        is_active = false,
        updated_at = NOW()
    WHERE id = campaign_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to restore archived campaigns (optional, for consistency)
CREATE OR REPLACE FUNCTION restore_campaign(campaign_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE discord_guild_campaigns 
    SET 
        archived = false,
        archived_at = NULL,
        is_active = true,
        updated_at = NOW()
    WHERE id = campaign_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql; 