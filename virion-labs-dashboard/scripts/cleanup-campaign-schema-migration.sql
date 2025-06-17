-- Migration Script: Cleanup Campaign Schema Inconsistencies
-- This script addresses the major redundancies and inconsistencies in discord_guild_campaigns table

-- Step 1: Create campaign_landing_pages table for landing page fields
CREATE TABLE IF NOT EXISTS campaign_landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES discord_guild_campaigns(id) ON DELETE CASCADE,
    
    -- Offer details
    offer_title TEXT,
    offer_description TEXT,
    offer_highlights TEXT[],
    offer_value TEXT,
    offer_expiry_date TIMESTAMPTZ,
    
    -- Visual content
    hero_image_url TEXT,
    product_images TEXT[],
    video_url TEXT,
    
    -- Content sections
    what_you_get TEXT,
    how_it_works TEXT,
    requirements TEXT,
    support_info TEXT,
    
    -- Template reference
    landing_page_template_id TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one landing page per campaign
    UNIQUE(campaign_id)
);

-- Step 2: Migrate existing landing page data to new table
INSERT INTO campaign_landing_pages (
    campaign_id,
    offer_title,
    offer_description,
    offer_highlights,
    offer_value,
    offer_expiry_date,
    hero_image_url,
    product_images,
    video_url,
    what_you_get,
    how_it_works,
    requirements,
    support_info,
    landing_page_template_id
)
SELECT 
    id as campaign_id,
    offer_title,
    offer_description,
    offer_highlights,
    offer_value,
    offer_expiry_date,
    hero_image_url,
    product_images,
    video_url,
    what_you_get,
    how_it_works,
    requirements,
    support_info,
    landing_page_template_id
FROM discord_guild_campaigns
WHERE offer_title IS NOT NULL 
   OR offer_description IS NOT NULL 
   OR offer_highlights IS NOT NULL 
   OR offer_value IS NOT NULL
   OR hero_image_url IS NOT NULL
   OR product_images IS NOT NULL
   OR video_url IS NOT NULL
   OR what_you_get IS NOT NULL
   OR how_it_works IS NOT NULL
   OR requirements IS NOT NULL
   OR support_info IS NOT NULL
   OR landing_page_template_id IS NOT NULL;

-- Step 3: Migrate role ID data to target_role_ids array
-- First, update target_role_ids to include data from target_role_id and auto_role_on_join
UPDATE discord_guild_campaigns 
SET target_role_ids = CASE
    -- If target_role_ids already has data, keep it
    WHEN target_role_ids IS NOT NULL AND array_length(target_role_ids, 1) > 0 THEN target_role_ids
    -- If target_role_id has data, convert to array
    WHEN target_role_id IS NOT NULL AND array_length(target_role_id, 1) > 0 THEN target_role_id
    -- If auto_role_on_join has data, convert to array
    WHEN auto_role_on_join IS NOT NULL THEN ARRAY[auto_role_on_join]
    -- Otherwise, empty array
    ELSE '{}'::TEXT[]
END
WHERE target_role_ids IS NULL 
   OR array_length(target_role_ids, 1) IS NULL 
   OR target_role_id IS NOT NULL 
   OR auto_role_on_join IS NOT NULL;

-- Step 4: Remove obsolete bot_configurations table (if it still exists)
DROP TABLE IF EXISTS bot_configurations CASCADE;

-- Step 5: Remove redundant role ID fields from discord_guild_campaigns
ALTER TABLE discord_guild_campaigns 
DROP COLUMN IF EXISTS target_role_id,
DROP COLUMN IF EXISTS auto_role_on_join;

-- Step 6: Remove landing page fields from discord_guild_campaigns
ALTER TABLE discord_guild_campaigns 
DROP COLUMN IF EXISTS offer_title,
DROP COLUMN IF EXISTS offer_description,
DROP COLUMN IF EXISTS offer_highlights,
DROP COLUMN IF EXISTS offer_value,
DROP COLUMN IF EXISTS offer_expiry_date,
DROP COLUMN IF EXISTS hero_image_url,
DROP COLUMN IF EXISTS product_images,
DROP COLUMN IF EXISTS video_url,
DROP COLUMN IF EXISTS what_you_get,
DROP COLUMN IF EXISTS how_it_works,
DROP COLUMN IF EXISTS requirements,
DROP COLUMN IF EXISTS support_info,
DROP COLUMN IF EXISTS landing_page_template_id;

-- Step 7: Remove redundant archive fields (is_active is sufficient)
ALTER TABLE discord_guild_campaigns 
DROP COLUMN IF EXISTS archived,
DROP COLUMN IF EXISTS archived_at;

-- Step 8: Fix onboarding_channel_type default to 'channel'
ALTER TABLE discord_guild_campaigns 
ALTER COLUMN onboarding_channel_type SET DEFAULT 'channel';

-- Update existing NULL values to use the new default
UPDATE discord_guild_campaigns 
SET onboarding_channel_type = 'channel' 
WHERE onboarding_channel_type IS NULL;

-- Step 9: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_landing_pages_campaign_id ON campaign_landing_pages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_discord_guild_campaigns_client_guild ON discord_guild_campaigns(client_id, guild_id);
CREATE INDEX IF NOT EXISTS idx_discord_guild_campaigns_active ON discord_guild_campaigns(is_active) WHERE is_active = true;

-- Step 10: Add comments for documentation
COMMENT ON TABLE campaign_landing_pages IS 'Landing page content and configuration for Discord campaigns';
COMMENT ON COLUMN discord_guild_campaigns.target_role_ids IS 'Array of Discord role IDs to assign to users (consolidated from target_role_id and auto_role_on_join)';
COMMENT ON COLUMN discord_guild_campaigns.onboarding_channel_type IS 'Where onboarding occurs: dm, channel, or any (default: channel)';

-- Step 11: Update configuration_version for all campaigns to reflect the schema change
UPDATE discord_guild_campaigns 
SET configuration_version = COALESCE(configuration_version, 1) + 1,
    updated_at = now();

-- Verification queries
SELECT 'Campaign Landing Pages Created' as action, count(*) as count FROM campaign_landing_pages;
SELECT 'Campaigns with Target Role IDs' as action, count(*) as count FROM discord_guild_campaigns WHERE target_role_ids IS NOT NULL AND array_length(target_role_ids, 1) > 0;
SELECT 'Campaigns Updated' as action, count(*) as count FROM discord_guild_campaigns;

-- Migration complete
SELECT 'Schema cleanup migration completed successfully' as status; 